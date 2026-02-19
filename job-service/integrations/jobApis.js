const axios = require('axios');

/**
 * RemoteOK API Integration
 * Free, unlimited access to remote job listings
 */
class RemoteOKClient {
    constructor() {
        this.baseUrl = 'https://remoteok.com/api';
    }

    async searchJobs(query = '', tags = []) {
        try {
            const response = await axios.get(this.baseUrl, {
                headers: {
                    'User-Agent': 'CareerGini/1.0'
                }
            });

            let jobs = response.data.slice(1); // First item is metadata

            // Filter by query
            if (query) {
                const queryLower = query.toLowerCase();
                jobs = jobs.filter(job =>
                    job.position?.toLowerCase().includes(queryLower) ||
                    job.company?.toLowerCase().includes(queryLower) ||
                    job.description?.toLowerCase().includes(queryLower)
                );
            }

            // Filter by tags/skills
            if (tags.length > 0) {
                jobs = jobs.filter(job =>
                    tags.some(tag =>
                        job.tags?.some(jobTag =>
                            jobTag.toLowerCase().includes(tag.toLowerCase())
                        )
                    )
                );
            }

            return jobs.map(job => this.formatJob(job));
        } catch (error) {
            console.error('RemoteOK API error:', error.message);
            return [];
        }
    }

    formatJob(job) {
        return {
            id: job.id || job.slug,
            title: job.position,
            company: job.company,
            location: 'Remote',
            type: 'Remote',
            description: job.description,
            url: job.url,
            tags: job.tags || [],
            salary: job.salary_min ? `$${job.salary_min} - $${job.salary_max}` : null,
            posted: new Date(job.date * 1000),
            logo: job.company_logo,
            source: 'RemoteOK'
        };
    }
}

/**
 * Arbeitnow API Integration
 * Free European job listings
 */
class ArbeitnowClient {
    constructor() {
        this.baseUrl = 'https://www.arbeitnow.com/api/job-board-api';
    }

    async searchJobs(query = '', location = '') {
        try {
            const response = await axios.get(this.baseUrl, {
                headers: {
                    'User-Agent': 'CareerGini/1.0'
                }
            });

            let jobs = response.data.data || [];

            // Filter by query
            if (query) {
                const queryLower = query.toLowerCase();
                jobs = jobs.filter(job =>
                    job.title?.toLowerCase().includes(queryLower) ||
                    job.company_name?.toLowerCase().includes(queryLower) ||
                    job.description?.toLowerCase().includes(queryLower)
                );
            }

            // Filter by location
            if (location) {
                const locationLower = location.toLowerCase();
                jobs = jobs.filter(job =>
                    job.location?.toLowerCase().includes(locationLower)
                );
            }

            return jobs.map(job => this.formatJob(job));
        } catch (error) {
            console.error('Arbeitnow API error:', error.message);
            return [];
        }
    }

    formatJob(job) {
        return {
            id: job.slug,
            title: job.title,
            company: job.company_name,
            location: job.location,
            type: job.job_types?.join(', ') || 'Full-time',
            description: job.description,
            url: job.url,
            tags: job.tags || [],
            salary: null,
            posted: new Date(job.created_at),
            logo: null,
            source: 'Arbeitnow'
        };
    }
}

/**
 * Jobicy API Integration
 * Free remote jobs with RSS support
 */
class JobicyClient {
    constructor() {
        this.baseUrl = 'https://jobicy.com/api/v2/remote-jobs';
    }

    async searchJobs(query = '', category = '') {
        try {
            const params = {};
            if (category) params.tag = category;
            if (query) params.search = query;

            const response = await axios.get(this.baseUrl, {
                params,
                headers: {
                    'User-Agent': 'CareerGini/1.0'
                }
            });

            const jobs = response.data.jobs || [];
            return jobs.map(job => this.formatJob(job));
        } catch (error) {
            console.error('Jobicy API error:', error.message);
            return [];
        }
    }

    formatJob(job) {
        return {
            id: job.id,
            title: job.jobTitle,
            company: job.companyName,
            location: job.jobGeo || 'Remote',
            type: job.jobType || 'Remote',
            description: job.jobDescription,
            url: job.url,
            tags: job.jobIndustry ? [job.jobIndustry] : [],
            salary: job.annualSalaryMin ? `$${job.annualSalaryMin} - $${job.annualSalaryMax}` : null,
            posted: new Date(job.pubDate),
            logo: job.companyLogo,
            source: 'Jobicy'
        };
    }
}

module.exports = {
    RemoteOKClient,
    ArbeitnowClient,
    JobicyClient
};
