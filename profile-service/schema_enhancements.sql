-- CareerGini Enhanced Database Schema
-- New tables for enhancement features

-- ============================================
-- APPLICATION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Job Details
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    job_url TEXT,
    job_description TEXT,
    location VARCHAR(255),
    salary_range VARCHAR(100),
    
    -- Application Status
    status VARCHAR(50) NOT NULL DEFAULT 'interested',
    -- Status values: interested, applied, phone_screen, interview, offer, rejected, accepted, withdrawn
    
    -- Tracking
    applied_date TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW(),
    
    -- Documents
    resume_version VARCHAR(255),
    cover_letter TEXT,
    
    -- Scores & Predictions
    job_match_score INT, -- 0-100
    ats_score INT, -- 0-100
    success_probability DECIMAL(5,2), -- 0.00-100.00
    
    -- Referral
    has_referral BOOLEAN DEFAULT FALSE,
    referral_contact VARCHAR(255),
    
    -- Notes
    notes TEXT,
    company_research TEXT,
    interview_notes TEXT[],
    questions_to_ask TEXT[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('interested', 'applied', 'phone_screen', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn'))
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_date ON applications(applied_date);
CREATE INDEX idx_applications_company ON applications(company);

-- ============================================
-- APPLICATION EVENTS (Timeline)
-- ============================================

CREATE TABLE IF NOT EXISTS application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    
    event_type VARCHAR(50) NOT NULL,
    -- Event types: status_change, email_sent, email_received, interview_scheduled, note_added, document_uploaded
    
    event_data JSONB, -- Flexible storage for event-specific data
    description TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_event_type CHECK (event_type IN ('status_change', 'email_sent', 'email_received', 'interview_scheduled', 'note_added', 'document_uploaded', 'follow_up_reminder'))
);

CREATE INDEX idx_application_events_application_id ON application_events(application_id);
CREATE INDEX idx_application_events_created_at ON application_events(created_at);

-- ============================================
-- ANALYTICS & METRICS
-- ============================================

CREATE TABLE IF NOT EXISTS application_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Funnel Stage
    stage VARCHAR(50) NOT NULL,
    -- Stages: application, response, phone_screen, interview, offer
    
    -- Timing Metrics
    timestamp TIMESTAMP DEFAULT NOW(),
    response_time_days INT, -- Days from application to response
    time_to_interview_days INT,
    time_to_offer_days INT,
    
    -- Quality Metrics
    ats_score INT,
    match_score INT,
    has_cover_letter BOOLEAN,
    has_referral BOOLEAN,
    
    -- Source Tracking
    source VARCHAR(100), -- linkedin, company_website, referral, job_board, etc.
    
    -- Outcome
    outcome VARCHAR(50), -- success, rejected, withdrawn, pending
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_application_metrics_user_id ON application_metrics(user_id);
CREATE INDEX idx_application_metrics_stage ON application_metrics(stage);
CREATE INDEX idx_application_metrics_timestamp ON application_metrics(timestamp);

-- ============================================
-- USER ACTIVITY TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(100) NOT NULL,
    -- Types: resume_updated, job_viewed, job_applied, course_started, course_completed, 
    --        skill_added, interview_practiced, profile_updated, etc.
    
    activity_data JSONB, -- Flexible storage for activity-specific data
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);

-- ============================================
-- RESUME VERSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS resume_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    version_name VARCHAR(255) NOT NULL,
    content JSONB NOT NULL, -- Structured resume data
    
    -- Scores
    ats_score INT,
    last_ats_check TIMESTAMP,
    
    -- Metadata
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resume_versions_user_id ON resume_versions(user_id);
CREATE INDEX idx_resume_versions_is_default ON resume_versions(is_default);

-- ============================================
-- SKILL GAP ANALYSIS
-- ============================================

CREATE TABLE IF NOT EXISTS skill_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    target_role VARCHAR(255) NOT NULL,
    
    -- Gap Analysis Results
    readiness_score INT, -- 0-100
    critical_missing_skills TEXT[],
    nice_to_have_skills TEXT[],
    transferable_skills TEXT[],
    strengths TEXT[],
    
    -- Learning Path
    estimated_time_months INT,
    priority_skills JSONB, -- Array of skills with priority, learning time, ROI
    
    -- Metadata
    analyzed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_skill_gaps_user_id ON skill_gaps(user_id);
CREATE INDEX idx_skill_gaps_target_role ON skill_gaps(target_role);

-- ============================================
-- INTERVIEW PRACTICE SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    job_role VARCHAR(255),
    company VARCHAR(255),
    difficulty VARCHAR(20), -- easy, medium, hard
    
    -- Session Data
    questions_asked JSONB[], -- Array of {question, type, answer, score, feedback}
    overall_score INT, -- 0-100
    
    -- Performance Metrics
    avg_clarity_score INT,
    avg_relevance_score INT,
    avg_confidence_score INT,
    filler_words_count INT,
    
    -- Duration
    duration_minutes INT,
    
    -- Metadata
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_created_at ON interview_sessions(created_at);

-- ============================================
-- CAREER PREDICTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS career_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Predicted Roles
    predictions JSONB, -- Array of {role, probability, timeline, required_skills, salary_range}
    
    -- Model Info
    model_version VARCHAR(50),
    confidence_score DECIMAL(5,2),
    
    -- Metadata
    predicted_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_career_predictions_user_id ON career_predictions(user_id);

-- ============================================
-- JOB BOOKMARKS
-- ============================================

CREATE TABLE IF NOT EXISTS job_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    job_id VARCHAR(255) NOT NULL, -- External job ID from API
    job_data JSONB NOT NULL, -- Cached job details
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_job_bookmarks_user_id ON job_bookmarks(user_id);

-- ============================================
-- NOTIFICATIONS & NUDGES
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    -- Types: skill_recommendation, activity_reminder, profile_maintenance, job_match, interview_prep, etc.
    
    priority VARCHAR(20) NOT NULL, -- high, medium, low
    
    message TEXT NOT NULL,
    action_text VARCHAR(100),
    action_url VARCHAR(255),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- LEARNING PROGRESS
-- ============================================

CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    course_id VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    platform VARCHAR(100), -- coursera, udemy, youtube, etc.
    
    -- Progress
    status VARCHAR(50) DEFAULT 'not_started',
    -- Status: not_started, in_progress, completed, abandoned
    
    progress_percentage INT DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_status ON learning_progress(status);

-- ============================================
-- ENHANCED PROFILES TABLE (Add new columns)
-- ============================================

-- Add new columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_role VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS career_goals JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB; -- job preferences, location, salary, remote, etc.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_ats_score INT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness INT DEFAULT 0; -- 0-100
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW();

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_versions_updated_at BEFORE UPDATE ON resume_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- User application funnel view
CREATE OR REPLACE VIEW user_application_funnel AS
SELECT 
    user_id,
    COUNT(*) FILTER (WHERE status = 'applied') as applications_sent,
    COUNT(*) FILTER (WHERE status IN ('phone_screen', 'interview', 'offer', 'accepted')) as responses_received,
    COUNT(*) FILTER (WHERE status IN ('interview', 'offer', 'accepted')) as interviews_secured,
    COUNT(*) FILTER (WHERE status IN ('offer', 'accepted')) as offers_received,
    COUNT(*) FILTER (WHERE status = 'accepted') as offers_accepted,
    ROUND(
        COUNT(*) FILTER (WHERE status IN ('phone_screen', 'interview', 'offer', 'accepted'))::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE status = 'applied'), 0) * 100, 
        2
    ) as response_rate,
    ROUND(
        COUNT(*) FILTER (WHERE status IN ('interview', 'offer', 'accepted'))::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE status IN ('phone_screen', 'interview', 'offer', 'accepted')), 0) * 100,
        2
    ) as interview_rate
FROM applications
GROUP BY user_id;

-- User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    user_id,
    COUNT(*) FILTER (WHERE activity_type = 'job_applied') as jobs_applied,
    COUNT(*) FILTER (WHERE activity_type = 'course_completed') as courses_completed,
    COUNT(*) FILTER (WHERE activity_type = 'interview_practiced') as interviews_practiced,
    MAX(created_at) as last_activity
FROM user_activity
GROUP BY user_id;

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Add sample application statuses for testing
-- INSERT INTO applications (user_id, job_title, company, status, job_match_score, ats_score)
-- VALUES 
--     ((SELECT id FROM users LIMIT 1), 'Software Engineer', 'Google', 'applied', 85, 78),
--     ((SELECT id FROM users LIMIT 1), 'Frontend Developer', 'Meta', 'interview', 92, 88);
