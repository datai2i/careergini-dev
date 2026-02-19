const axios = require('axios');
const ytSearch = require('yt-search');

/**
 * YouTube Data API Integration (Keyless)
 * Uses scraping via yt-search to bypass API quotas
 */
class YouTubeClient {
    constructor() {
        this.platform = 'YouTube';
    }

    async searchCourses(topic) {
        try {
            if (!topic) return [];

            const results = await ytSearch(topic + ' tutorial course long');
            const videos = results.videos.slice(0, 20);

            return videos.map(video => this.formatCourse(video));
        } catch (error) {
            console.error('YouTube search error:', error.message);
            return [];
        }
    }

    formatCourse(video) {
        return {
            id: video.videoId,
            title: video.title,
            description: video.description || 'Watch on YouTube',
            thumbnail: video.thumbnail,
            url: video.url,
            instructor: video.author?.name || 'YouTube',
            platform: 'YouTube',
            level: 'All Levels',
            duration: video.timestamp,
            rating: null, // No rating available via search
            price: 'Free',
            published: video.ago, // Relative time string
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
