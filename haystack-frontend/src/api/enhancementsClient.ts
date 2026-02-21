/**
 * API Client for CareerGini Enhancement Features
 * Handles all API calls to backend services
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API client with error handling
class APIClient {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`,
            };
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // ATS Resume Scoring
    async scoreResume(resumeText: string, jobDescription?: string) {
        return this.request('/api/ai/resume/ats-score', {
            method: 'POST',
            body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
        });
    }

    // Job Matching
    async calculateJobMatch(userProfile: any, jobPosting: any) {
        return this.request('/api/ai/jobs/match-score', {
            method: 'POST',
            body: JSON.stringify({ user_profile: userProfile, job_posting: jobPosting }),
        });
    }

    // Skill Gap Analysis
    async analyzeSkillGaps(userProfile: any, targetRole: string) {
        return this.request('/api/ai/skills/gap-analysis', {
            method: 'POST',
            body: JSON.stringify({ user_profile: userProfile, target_role: targetRole }),
        });
    }

    // Interview Simulator
    async startInterview(jobRole: string, company?: string, difficulty: string = 'medium') {
        return this.request('/api/ai/interview/start', {
            method: 'POST',
            body: JSON.stringify({ job_role: jobRole, company, difficulty }),
        });
    }

    async evaluateAnswer(session: any, question: string, answer: string, questionType: string) {
        return this.request('/api/ai/interview/evaluate', {
            method: 'POST',
            body: JSON.stringify({ session, question, answer, question_type: questionType }),
        });
    }

    // Career Path Prediction
    async predictCareerPath(userProfile: any, targetRole?: string) {
        return this.request('/api/ai/career/predict-path', {
            method: 'POST',
            body: JSON.stringify({ user_profile: userProfile, target_role: targetRole }),
        });
    }

    // Application Tracker
    async getApplications(userId: string, status?: string) {
        const params = new URLSearchParams({ user_id: userId });
        if (status) params.append('status', status);
        return this.request(`/api/applications/applications?${params}`);
    }

    async getApplication(id: string) {
        return this.request(`/api/applications/applications/${id}`);
    }

    async createApplication(data: any) {
        return this.request('/api/applications/applications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateApplication(id: string, data: any) {
        return this.request(`/api/applications/applications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteApplication(id: string) {
        return this.request(`/api/applications/applications/${id}`, {
            method: 'DELETE',
        });
    }

    async addApplicationEvent(id: string, eventType: string, description: string, eventData?: any) {
        return this.request(`/api/applications/applications/${id}/events`, {
            method: 'POST',
            body: JSON.stringify({ event_type: eventType, description, event_data: eventData }),
        });
    }

    async getAnalyticsFunnel(userId: string) {
        return this.request(`/api/applications/analytics/funnel?user_id=${userId}`);
    }

    async getAnalyticsSummary(userId: string) {
        return this.request(`/api/applications/analytics/summary?user_id=${userId}`);
    }

    // Job Bookmarks
    async getBookmarks(userId: string) {
        return this.request(`/api/applications/bookmarks?user_id=${userId}`);
    }

    async createBookmark(userId: string, jobId: string, jobData: any, notes?: string) {
        return this.request('/api/applications/bookmarks', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, job_id: jobId, job_data: jobData, notes }),
        });
    }

    async deleteBookmark(id: string) {
        return this.request(`/api/applications/bookmarks/${id}`, {
            method: 'DELETE',
        });
    }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export types
export interface ATSScoreResult {
    overall_score: number;
    ats_friendly: boolean;
    breakdown: {
        keyword_match: number;
        formatting_score: number;
        section_completeness: number;
        content_quality: number;
    };
    issues: Array<{
        type: string;
        severity: 'high' | 'medium' | 'low';
        suggestion: string;
    }>;
    improvements: string[];
}

export interface JobMatchResult {
    overall_score: number;
    match_level: 'excellent' | 'good' | 'fair' | 'poor';
    breakdown: {
        skills: any;
        experience: any;
        education: any;
        location: any;
        salary: any;
    };
    explanation: {
        strengths: string[];
        weaknesses: string[];
    };
    recommendation: string;
}

export interface SkillGapResult {
    readiness_score: number;
    target_role: string;
    gaps: {
        critical_missing: any[];
        nice_to_have_missing: any[];
        transferable: any[];
        strengths: any[];
    };
    learning_path: any[];
    estimated_time_months: number;
    priority_skills: any[];
    recommendations: string[];
}

export interface InterviewSession {
    session_id: string;
    job_role: string;
    company?: string;
    difficulty: string;
    questions_asked: any[];
    current_question_index: number;
}

export interface CareerPathResult {
    current_level: number;
    role_category: string;
    timeline: any[];
    success_probability: number;
    milestones: any[];
    salary_projection: any;
    alternative_paths: any[];
    recommendations: string[];
}

export default apiClient;
