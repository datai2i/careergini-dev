const axios = require('axios');

/**
 * YouTube Data API Integration
 * Free tier: 10,000 units/day (~100 searches)
 */
class YouTubeClient {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.YOUTUBE_API_KEY;
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    }

    async searchCourses(topic, maxResults = 20) {
        if (!this.apiKey) {
            console.warn('YouTube API key not configured');
            return [];
        }

        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    part: 'snippet',
                    q: `${topic} tutorial course`,
                    type: 'video',
                    videoDuration: 'long', // Only long videos (>20min)
                    order: 'relevance',
                    maxResults,
                    key: this.apiKey
                }
            });

            return response.data.items.map(item => this.formatCourse(item));
        } catch (error) {
            console.error('YouTube API error:', error.message);
            return [];
        }
    }

    formatCourse(item) {
        return {
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
            url: `https://youtube.com/watch?v=${item.id.videoId}`,
            instructor: item.snippet.channelTitle,
            platform: 'YouTube',
            level: 'All Levels',
            duration: 'Video',
            rating: null,
            price: 'Free',
            published: new Date(item.snippet.publishedAt),
            source: 'YouTube'
        };
    }
}

/**
 * edX Catalog API Integration
 * Completely free, unlimited access
 */
class EdXClient {
    constructor() {
        this.baseUrl = 'https://www.edx.org/api/catalog/v2';
    }

    async searchCourses(topic, level = '') {
        try {
            const params = { search: topic };
            if (level) params.level_type = level;

            const response = await axios.get(`${this.baseUrl}/courses`, {
                params,
                headers: {
                    'User-Agent': 'CareerGini/1.0'
                }
            });

            const courses = response.data.results || [];
            return courses.map(course => this.formatCourse(course));
        } catch (error) {
            console.error('edX API error:', error.message);
            return [];
        }
    }

    formatCourse(course) {
        return {
            id: course.key,
            title: course.title,
            description: course.short_description || course.full_description,
            thumbnail: course.image?.src || course.card_image_url,
            url: course.marketing_url,
            instructor: course.owners?.[0]?.name || 'edX',
            platform: 'edX',
            level: course.level_type || 'Intermediate',
            duration: course.weeks_to_complete ? `${course.weeks_to_complete} weeks` : 'Self-paced',
            rating: course.avg_rating || null,
            price: course.price || 'Free to audit',
            published: course.start ? new Date(course.start) : null,
            source: 'edX'
        };
    }
}

/**
 * Coursera Catalog API Integration
 * Free public catalog access
 */
class CourseraClient {
    constructor() {
        this.baseUrl = 'https://api.coursera.org/api/courses.v1';
    }

    async searchCourses(topic) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    q: 'search',
                    query: topic,
                    limit: 20
                },
                headers: {
                    'User-Agent': 'CareerGini/1.0'
                }
            });

            const courses = response.data.elements || [];
            return courses.map(course => this.formatCourse(course));
        } catch (error) {
            console.error('Coursera API error:', error.message);
            return [];
        }
    }

    formatCourse(course) {
        return {
            id: course.id,
            title: course.name,
            description: course.description,
            thumbnail: course.photoUrl,
            url: `https://www.coursera.org/learn/${course.slug}`,
            instructor: course.instructorIds?.[0] || 'Coursera',
            platform: 'Coursera',
            level: course.level || 'Beginner',
            duration: course.workload || 'Self-paced',
            rating: course.averageProductRating || null,
            price: 'Free to audit',
            published: null,
            source: 'Coursera'
        };
    }
}

module.exports = {
    YouTubeClient,
    EdXClient,
    CourseraClient
};
