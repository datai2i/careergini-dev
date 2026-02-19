-- Connect to database
\c careergini;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table (Identity)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    password_hash VARCHAR(255), -- For manual login if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Linked Accounts (OAuth)
CREATE TABLE IF NOT EXISTS linked_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- google, linkedin, github
    provider_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    profile_data JSONB, -- Raw profile data from provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

-- User Profiles (Centralized Data)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    headline VARCHAR(255),
    summary TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    phone VARCHAR(50),
    resume_url TEXT,
    resume_text TEXT, -- Parsed text
    skills TEXT[],
    experience JSONB DEFAULT '[]', -- Structured experience data
    education JSONB DEFAULT '[]', -- Structured education data
    goals JSONB DEFAULT '{}', -- Career goals
    preferences JSONB DEFAULT '{}', -- Job preferences (remote, salary, etc.)
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_parsed_at TIMESTAMP WITH TIME ZONE, -- For refresh logic
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id ON linked_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
