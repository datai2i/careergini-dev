const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const redis = require('redis');
const { RemoteOKClient, ArbeitnowClient, JobicyClient } = require('./integrations/jobApis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Redis client for caching
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379/2'
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect().catch(err => console.error('Redis connection error:', err));

// API clients
const remoteOK = new RemoteOKClient();
const arbeitnow = new ArbeitnowClient();
const jobicy = new JobicyClient();

// Helper: Generate cache key
function getCacheKey(query, location, skills) {
    return `jobs:${query}:${location}:${skills.join(',')}`;
}

// Helper: Deduplicate jobs by title + company
function deduplicateJobs(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
        const key = `${job.title}:${job.company}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Helper: Rank jobs by relevance to skills
function rankJobsBySkills(jobs, skills) {
    if (!skills || skills.length === 0) return jobs;

    return jobs.map(job => {
        const jobText = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
        const matchCount = skills.filter(skill =>
            jobText.includes(skill.toLowerCase())
        ).length;

        return { ...job, relevanceScore: matchCount };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'job-service' });
});

// Get jobs with filtering
app.get('/jobs', async (req, res) => {
    try {
        const { query = '', location = '', skills = '' } = req.query;
        const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];

        // Check cache
        const cacheKey = getCacheKey(query, location, skillsArray);
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            console.log('✓ Cache HIT for jobs:', cacheKey);
            return res.json(JSON.parse(cached));
        }

        console.log('✗ Cache MISS for jobs:', cacheKey);

        // Fetch from multiple sources in parallel
        const [remoteOKJobs, arbeitnowJobs, jobicyJobs] = await Promise.allSettled([
            remoteOK.searchJobs(query, skillsArray),
            arbeitnow.searchJobs(query, location),
            jobicy.searchJobs(query)
        ]);

        // Combine results
        let allJobs = [];
        if (remoteOKJobs.status === 'fulfilled') allJobs.push(...remoteOKJobs.value);
        if (arbeitnowJobs.status === 'fulfilled') allJobs.push(...arbeitnowJobs.value);
        if (jobicyJobs.status === 'fulfilled') allJobs.push(...jobicyJobs.value);

        // Deduplicate and rank
        allJobs = deduplicateJobs(allJobs);
        allJobs = rankJobsBySkills(allJobs, skillsArray);

        // Limit to top 50
        allJobs = allJobs.slice(0, 50);

        // Cache for 24 hours
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(allJobs));

        res.json(allJobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// Get recommended jobs based on user profile
app.get('/recommendations', async (req, res) => {
    try {
        const { skills = '', experience = '', goals = '' } = req.query;
        const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];

        // Fetch jobs matching user skills
        const jobs = await remoteOK.searchJobs('', skillsArray);
        const rankedJobs = rankJobsBySkills(jobs, skillsArray);

        res.json(rankedJobs.slice(0, 20));
    } catch (error) {
        console.error('Error fetching recommended jobs:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

app.listen(PORT, () => {
    console.log(`Job Service running on port ${PORT}`);
    console.log(`Using APIs: RemoteOK, Arbeitnow, Jobicy`);
});
