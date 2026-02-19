/**
 * CareerGini E2E Tests
 * Uses Playwright for end-to-end testing
 * Run: npx playwright test
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// ============================================================
// HELPERS
// ============================================================

async function mockAuth(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('auth_token', 'test-token-123');
        localStorage.setItem('user_profile', JSON.stringify({
            id: 'test-user',
            name: 'Test User',
            email: 'test@example.com',
            skills: ['JavaScript', 'React', 'Node.js', 'Python'],
            experience: [{ title: 'Software Engineer', company: 'Test Co', years: 3 }],
            education: [{ degree: 'BS Computer Science', school: 'Test University' }],
            resume_ats_score: 72,
            profile_completeness: 80,
        }));
    });
}

// ============================================================
// SKILL GAP ANALYSIS PAGE
// ============================================================

test.describe('Skill Gap Analysis Page', () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await page.goto(`${BASE_URL}/skill-gaps`);
    });

    test('renders page header', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Skill Gap Analysis/i })).toBeVisible();
        await expect(page.getByText(/personalized learning roadmap/i)).toBeVisible();
    });

    test('shows role selector buttons', async ({ page }) => {
        await expect(page.getByText('Software Engineer')).toBeVisible();
        await expect(page.getByText('Data Scientist')).toBeVisible();
        await expect(page.getByText('Product Manager')).toBeVisible();
    });

    test('can select a target role', async ({ page }) => {
        await page.getByText('Data Scientist').click();
        // Button should be highlighted
        const btn = page.getByRole('button', { name: 'Data Scientist' });
        await expect(btn).toHaveClass(/from-purple-600/);
    });

    test('analyze button triggers analysis', async ({ page }) => {
        // Mock API response
        await page.route('**/api/ai/skills/gap-analysis', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    readiness_score: 72,
                    target_role: 'software_engineer',
                    gaps: {
                        critical_missing: [{ skill: 'Docker', importance: 'critical', learning_time_weeks: 4, roi: 'high' }],
                        nice_to_have_missing: [],
                        transferable: ['JavaScript', 'React'],
                        strengths: ['Problem Solving'],
                    },
                    learning_path: [
                        { phase: 1, name: 'Core Skills', duration_weeks: 4, skills: ['Docker'], resources: [] },
                    ],
                    estimated_time_months: 2,
                    priority_skills: [{ skill: 'Docker', priority_rank: 1, roi_score: 85 }],
                    recommendations: ['Learn Docker first'],
                }),
            });
        });

        await page.getByRole('button', { name: /Analyze My Skill Gaps/i }).click();
        await expect(page.getByText('Readiness Score')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('72')).toBeVisible();
    });

    test('shows demo data when API fails', async ({ page }) => {
        await page.route('**/api/ai/skills/gap-analysis', route => route.abort());
        await page.getByRole('button', { name: /Analyze My Skill Gaps/i }).click();
        await expect(page.getByText('Readiness Score')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Critical Skill Gaps')).toBeVisible();
    });

    test('learning path phases are expandable', async ({ page }) => {
        await page.route('**/api/ai/skills/gap-analysis', route => route.abort());
        await page.getByRole('button', { name: /Analyze My Skill Gaps/i }).click();
        await expect(page.getByText('Your Learning Roadmap')).toBeVisible({ timeout: 5000 });
        // Phase 1 should be expanded by default
        await expect(page.getByText('Core Foundations')).toBeVisible();
    });
});

// ============================================================
// INTERVIEW PRACTICE PAGE
// ============================================================

test.describe('Interview Practice Page', () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await page.goto(`${BASE_URL}/interview-practice`);
    });

    test('renders setup screen', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /AI Interview Practice/i })).toBeVisible();
        await expect(page.getByText(/Practice with an AI interviewer/i)).toBeVisible();
    });

    test('shows role and company selectors', async ({ page }) => {
        await expect(page.getByRole('combobox')).toBeVisible(); // Role dropdown
        await expect(page.getByText('Google')).toBeVisible();
        await expect(page.getByText('Amazon')).toBeVisible();
    });

    test('difficulty buttons work', async ({ page }) => {
        await page.getByRole('button', { name: 'hard' }).click();
        const hardBtn = page.getByRole('button', { name: 'hard' });
        await expect(hardBtn).toHaveClass(/bg-red-100/);
    });

    test('starts interview session', async ({ page }) => {
        await page.route('**/api/ai/interview/start', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    session: { session_id: 'test-session', job_role: 'Software Engineer', company: 'Google' },
                    question: { question: 'Tell me about yourself.', type: 'behavioral', index: 1 },
                    tips: ['Be concise', 'Use STAR method'],
                }),
            });
        });

        await page.getByRole('button', { name: /Start Interview/i }).click();
        await expect(page.getByText('Tell me about yourself.')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Question 1 of 5')).toBeVisible();
    });

    test('can type and submit an answer', async ({ page }) => {
        // Start with demo data
        await page.route('**/api/ai/interview/start', route => route.abort());
        await page.getByRole('button', { name: /Start Interview/i }).click();
        await expect(page.getByPlaceholder(/Type your answer/i)).toBeVisible({ timeout: 5000 });

        await page.getByPlaceholder(/Type your answer/i).fill('I am a software engineer with 3 years of experience...');

        await page.route('**/api/ai/interview/evaluate', route => route.abort());
        await page.getByRole('button', { name: /Submit/i }).click();
        await expect(page.getByText('AI Feedback')).toBeVisible({ timeout: 5000 });
    });
});

// ============================================================
// CAREER ROADMAP PAGE
// ============================================================

test.describe('Career Roadmap Page', () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await page.route('**/api/ai/career/predict-path', route => route.abort()); // Use demo data
        await page.goto(`${BASE_URL}/career-roadmap`);
    });

    test('renders career roadmap', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Career Roadmap/i })).toBeVisible({ timeout: 5000 });
    });

    test('shows success probability', async ({ page }) => {
        await expect(page.getByText('Success Probability')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('75%')).toBeVisible();
    });

    test('shows career timeline', async ({ page }) => {
        await expect(page.getByText('Career Progression Timeline')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Software Engineer')).toBeVisible();
        await expect(page.getByText('Senior Software Engineer')).toBeVisible();
    });

    test('shows salary projection', async ({ page }) => {
        await expect(page.getByText('Salary Projection')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/\$105K/)).toBeVisible();
    });

    test('alternative paths are expandable', async ({ page }) => {
        await expect(page.getByText('Alternative Career Paths')).toBeVisible({ timeout: 5000 });
        await page.getByText('Technical Leadership').click();
        await expect(page.getByText('Tech Lead')).toBeVisible();
    });

    test('milestones are displayed', async ({ page }) => {
        await expect(page.getByText('Key Milestones')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Master System Design')).toBeVisible();
    });
});

// ============================================================
// ADVISOR PAGE
// ============================================================

test.describe('Career Advisor Page', () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await page.goto(`${BASE_URL}/advisor`);
    });

    test('renders advisor page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Career Advisor/i })).toBeVisible();
    });

    test('shows nudge stats', async ({ page }) => {
        await expect(page.getByText('Urgent')).toBeVisible();
        await expect(page.getByText('Important')).toBeVisible();
        await expect(page.getByText('Tips')).toBeVisible();
    });

    test('shows high priority nudges', async ({ page }) => {
        await expect(page.getByText('Urgent Action Required')).toBeVisible();
        await expect(page.getByText(/Follow up on Google application/i)).toBeVisible();
    });

    test('can dismiss a nudge', async ({ page }) => {
        const nudgeTitle = 'Follow up on Google application';
        await expect(page.getByText(nudgeTitle)).toBeVisible();
        // Click the X button on the first nudge
        const nudgeCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: nudgeTitle });
        await nudgeCard.getByRole('button').first().click();
        await expect(page.getByText(nudgeTitle)).not.toBeVisible({ timeout: 2000 });
    });

    test('shows career tips section', async ({ page }) => {
        await expect(page.getByText('Career Tips')).toBeVisible();
        await expect(page.getByText('Apply consistently')).toBeVisible();
    });

    test('refresh button works', async ({ page }) => {
        await page.route('**/api/ai/advisor/nudges', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ nudges: [] }),
            });
        });
        await page.getByRole('button', { name: /Refresh/i }).click();
        await expect(page.getByText("You're all caught up!")).toBeVisible({ timeout: 5000 });
    });
});

// ============================================================
// ANALYTICS DASHBOARD PAGE
// ============================================================

test.describe('Analytics Dashboard Page', () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
        await page.route('**/api/ai/analytics/dashboard', route => route.abort()); // Use demo data
        await page.goto(`${BASE_URL}/analytics`);
    });

    test('renders analytics dashboard', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Analytics Dashboard/i })).toBeVisible();
    });

    test('shows overview stats', async ({ page }) => {
        await expect(page.getByText('Total Applications')).toBeVisible();
        await expect(page.getByText('42')).toBeVisible();
        await expect(page.getByText('Response Rate')).toBeVisible();
    });

    test('shows application funnel', async ({ page }) => {
        await expect(page.getByText('Application Funnel')).toBeVisible();
        await expect(page.getByText('Applied')).toBeVisible();
        await expect(page.getByText('Phone Screen')).toBeVisible();
        await expect(page.getByText('Interview')).toBeVisible();
    });

    test('shows weekly activity chart', async ({ page }) => {
        await expect(page.getByText('Weekly Activity')).toBeVisible();
    });

    test('shows goal tracking', async ({ page }) => {
        await expect(page.getByText('Goal Tracking')).toBeVisible();
        await expect(page.getByText('Applications / Week')).toBeVisible();
    });

    test('shows benchmarks', async ({ page }) => {
        await expect(page.getByText('Benchmarks')).toBeVisible();
        await expect(page.getByText(/Above avg|Below avg/)).toBeVisible();
    });

    test('timeframe buttons work', async ({ page }) => {
        await page.getByRole('button', { name: '30d' }).click();
        const btn = page.getByRole('button', { name: '30d' });
        await expect(btn).toHaveClass(/bg-purple-600/);
    });

    test('shows insights', async ({ page }) => {
        await expect(page.getByText('Insights')).toBeVisible();
    });
});

// ============================================================
// API HEALTH CHECKS
// ============================================================

test.describe('API Health Checks', () => {
    test('AI service is healthy', async ({ request }) => {
        const response = await request.get(`${API_URL}/api/ai/health`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.status).toBe('healthy');
    });

    test('ATS score endpoint responds', async ({ request }) => {
        const response = await request.post(`${API_URL}/api/ai/resume/ats-score`, {
            data: {
                resume_text: 'Software Engineer with 5 years experience in Python, React, Node.js. Education: BS Computer Science. Skills: Python, JavaScript, React, Node.js, Docker. Experience: Led team of 5 engineers. Achieved 40% performance improvement.',
            },
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('overall_score');
        expect(body.overall_score).toBeGreaterThanOrEqual(0);
        expect(body.overall_score).toBeLessThanOrEqual(100);
    });

    test('job match endpoint responds', async ({ request }) => {
        const response = await request.post(`${API_URL}/api/ai/jobs/match-score`, {
            data: {
                user_profile: {
                    skills: ['Python', 'React', 'JavaScript'],
                    experience: [{ title: 'Software Engineer', years: 3 }],
                    education: [{ degree: 'BS Computer Science' }],
                    location: 'San Francisco',
                    preferences: { remote: true, min_salary: 100000 },
                },
                job_posting: {
                    title: 'Software Engineer',
                    required_skills: ['Python', 'React'],
                    preferred_skills: ['Docker'],
                    years_required: 2,
                    location: 'Remote',
                    salary_min: 100000,
                    salary_max: 150000,
                },
            },
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('overall_score');
        expect(body).toHaveProperty('match_level');
    });

    test('skill gap analysis endpoint responds', async ({ request }) => {
        const response = await request.post(`${API_URL}/api/ai/skills/gap-analysis`, {
            data: {
                user_profile: { skills: ['JavaScript', 'React'], experience: [], education: [] },
                target_role: 'software_engineer',
            },
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('readiness_score');
    });

    test('advisor nudges endpoint responds', async ({ request }) => {
        const response = await request.post(`${API_URL}/api/ai/advisor/nudges`, {
            data: {
                user_profile: { resume_ats_score: 65, profile_completeness: 75 },
                user_activity: { last_activity_date: new Date().toISOString() },
                applications: [],
            },
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('nudges');
        expect(Array.isArray(body.nudges)).toBe(true);
    });

    test('analytics dashboard endpoint responds', async ({ request }) => {
        const response = await request.post(`${API_URL}/api/ai/analytics/dashboard`, {
            data: {
                user_id: 'test-user',
                applications: [],
                user_profile: { skills: ['JavaScript'] },
                timeframe_days: 90,
            },
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('overview');
        expect(body).toHaveProperty('funnel');
    });
});

// ============================================================
// NAVIGATION TESTS
// ============================================================

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await mockAuth(page);
    });

    test('can navigate to skill gaps page', async ({ page }) => {
        await page.goto(`${BASE_URL}/skill-gaps`);
        await expect(page.getByRole('heading', { name: /Skill Gap Analysis/i })).toBeVisible();
    });

    test('can navigate to interview practice page', async ({ page }) => {
        await page.goto(`${BASE_URL}/interview-practice`);
        await expect(page.getByRole('heading', { name: /AI Interview Practice/i })).toBeVisible();
    });

    test('can navigate to career roadmap page', async ({ page }) => {
        await page.route('**/api/ai/career/predict-path', route => route.abort());
        await page.goto(`${BASE_URL}/career-roadmap`);
        await expect(page.getByRole('heading', { name: /Career Roadmap/i })).toBeVisible({ timeout: 5000 });
    });

    test('can navigate to advisor page', async ({ page }) => {
        await page.goto(`${BASE_URL}/advisor`);
        await expect(page.getByRole('heading', { name: /Career Advisor/i })).toBeVisible();
    });

    test('can navigate to analytics page', async ({ page }) => {
        await page.route('**/api/ai/analytics/dashboard', route => route.abort());
        await page.goto(`${BASE_URL}/analytics`);
        await expect(page.getByRole('heading', { name: /Analytics Dashboard/i })).toBeVisible();
    });
});
