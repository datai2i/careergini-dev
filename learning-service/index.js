const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const redis = require('redis');
const { YouTubeClient, EdXClient, CourseraClient } = require('./integrations/courseApis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Redis client for caching
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379/3'
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect().catch(err => console.error('Redis connection error:', err));

// API clients
const youtube = new YouTubeClient();
const edx = new EdXClient();
const coursera = new CourseraClient();

// Helper: Generate cache key
function getCacheKey(topic, level, platform) {
    return `courses:${topic}:${level}:${platform}`;
}

// Helper: Deduplicate courses by title
function deduplicateCourses(courses) {
    const seen = new Set();
    return courses.filter(course => {
        const key = course.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Helper: Rank courses by quality (rating, platform reputation)
function rankCourses(courses) {
    const platformScores = {
        'edX': 10,
        'Coursera': 9,
        'YouTube': 7
    };

    return courses.map(course => {
        const platformScore = platformScores[course.platform] || 5;
        const ratingScore = course.rating ? course.rating * 2 : 5;
        const qualityScore = (platformScore + ratingScore) / 2;

        return { ...course, qualityScore };
    }).sort((a, b) => b.qualityScore - a.qualityScore);
}

// Helper: Match courses to skills
function matchCoursesToSkills(courses, skills) {
    if (!skills || skills.length === 0) return courses;

    return courses.map(course => {
        const courseText = `${course.title} ${course.description}`.toLowerCase();
        const matchCount = skills.filter(skill =>
            courseText.includes(skill.toLowerCase())
        ).length;

        return { ...course, relevanceScore: matchCount };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'learning-service' });
});

// Get courses with filtering
app.get('/courses', async (req, res) => {
    try {
        const { topic = '', level = '', platform = '', skills = '' } = req.query;
        const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];

        // Check cache
        const cacheKey = getCacheKey(topic, level, platform);
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            console.log('✓ Cache HIT for courses:', cacheKey);
            const courses = JSON.parse(cached);
            // Apply skill matching even on cached results
            const matched = skillsArray.length > 0 ? matchCoursesToSkills(courses, skillsArray) : courses;
            return res.json(matched);
        }

        console.log('✗ Cache MISS for courses:', cacheKey);

        // Fetch from multiple sources in parallel
        const promises = [];

        if (!platform || platform === 'YouTube') {
            promises.push(youtube.searchCourses(topic));
        }
        if (!platform || platform === 'edX') {
            promises.push(edx.searchCourses(topic, level));
        }
        if (!platform || platform === 'Coursera') {
            promises.push(coursera.searchCourses(topic));
        }

        const results = await Promise.allSettled(promises);

        // Combine results
        let allCourses = [];
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                allCourses.push(...result.value);
            }
        });

        // Deduplicate and rank
        allCourses = deduplicateCourses(allCourses);
        allCourses = rankCourses(allCourses);

        // Filter by level if specified
        if (level) {
            allCourses = allCourses.filter(course =>
                course.level.toLowerCase().includes(level.toLowerCase())
            );
        }

        // Match to skills
        if (skillsArray.length > 0) {
            allCourses = matchCoursesToSkills(allCourses, skillsArray);
        }

        // Limit to top 50
        allCourses = allCourses.slice(0, 50);

        // Cache for 24 hours
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(allCourses));

        res.json(allCourses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Get recommended courses based on skill gaps
app.get('/recommendations', async (req, res) => {
    try {
        const { skills = '', level = 'beginner' } = req.query;
        const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];

        if (skillsArray.length === 0) {
            return res.json([]);
        }

        // Fetch courses for each skill
        const coursePromises = skillsArray.slice(0, 3).map(skill =>
            edx.searchCourses(skill, level)
        );

        const results = await Promise.allSettled(coursePromises);
        let courses = [];
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                courses.push(...result.value);
            }
        });

        courses = deduplicateCourses(courses);
        courses = rankCourses(courses);

        res.json(courses.slice(0, 20));
    } catch (error) {
        console.error('Error fetching recommended courses:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

app.listen(PORT, () => {
    console.log(`Learning Service running on port ${PORT}`);
    console.log(`Using APIs: YouTube, edX, Coursera`);
});
