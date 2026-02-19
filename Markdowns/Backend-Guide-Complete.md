# CareerGini - Backend Development Guide (Complete & Detailed)

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Microservices Structure](#microservices-structure)
3. [Database Design](#database-design)
4. [API Documentation](#api-documentation)
5. [Authentication & Authorization](#authentication--authorization)
6. [Integration Guide](#integration-guide)
7. [Deployment Guide](#deployment-guide)
8. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

CareerGini backend uses a **microservices architecture** with specialized services for different domains. Services communicate via REST APIs and share data through PostgreSQL and Redis.

### Service Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
│  (Node.js/Express - Port 3000)                              │
│  • Authentication & Authorization                            │
│  • Request routing                                          │
│  • Rate limiting                                            │
│  • API versioning                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ AI Service   │ │ Profile  │ │   Job    │ │ Learning │
│ (FastAPI)    │ │ Service  │ │ Service  │ │ Service  │
│ Port 8000    │ │ (Express)│ │ (Express)│ │ (Express)│
│              │ │ Port 3001│ │ Port 3002│ │ Port 3003│
└──────────────┘ └──────────┘ └──────────┘ └──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ PostgreSQL   │ │ ChromaDB │ │  Redis   │ │  MinIO   │
│  (Primary)   │ │ (Vector) │ │ (Cache)  │ │  (Files) │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## Microservices Structure

### 1. API Gateway (Node.js/Express - Port 3000)

**Purpose**: Entry point for all client requests

**Responsibilities**:
- OAuth authentication (Google, GitHub, LinkedIn)
- JWT token validation
- Request routing to appropriate microservices
- Rate limiting with Redis
- Request/response logging
- API versioning (/api/v1/*)

**Project Structure**:
```
api-gateway/
├── src/
│   ├── server.ts              # Main entry point
│   ├── config/
│   │   ├── database.ts        # PostgreSQL connection
│   │   ├── oauth.ts           # OAuth providers config
│   │   └── redis.ts           # Redis client setup
│   ├── middleware/
│   │   ├── auth.ts            # JWT validation
│   │   ├── rateLimiter.ts     # Redis-based rate limiting
│   │   ├── errorHandler.ts    # Global error handling
│   │   ├── logger.ts          # Request logging (Morgan)
│   │   └── cors.ts            # CORS configuration
│   ├── routes/
│   │   ├── auth.routes.ts     # /auth/* endpoints
│   │   └── proxy.routes.ts    # Microservice routing
│   ├── controllers/
│   │   └── authController.ts  # OAuth logic
│   └── utils/
│       ├── jwt.ts             # Token generation/validation
│       └── oauth.ts           # OAuth helpers
├── package.json
├── tsconfig.json
└── Dockerfile
```

**Implementation Details**:

```typescript
// src/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth.routes';
import { proxyRouter } from './routes/proxy.routes';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { corsConfig } from './middleware/cors';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors(corsConfig));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use('/api', rateLimiter);

// Public routes
app.use('/api/v1/auth', authRouter);

// Protected routes (JWT required)
app.use('/api/v1', authMiddleware, proxyRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});
```

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JWTPayload;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
};
```

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

export const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});
```

```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/authController';

const router = Router();

// Google OAuth
router.get('/oauth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/oauth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.oauthCallback
);

// GitHub OAuth
router.get('/oauth/github', passport.authenticate('github', {
  scope: ['user:email', 'read:user'],
  session: false,
}));

router.get('/oauth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  authController.oauthCallback
);

// LinkedIn OAuth
router.get('/oauth/linkedin', passport.authenticate('linkedin', {
  scope: ['r_basicprofile', 'r_emailaddress'],
  session: false,
}));

router.get('/oauth/linkedin/callback',
  passport.authenticate('linkedin', { session: false, failureRedirect: '/login' }),
  authController.oauthCallback
);

// Token refresh
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

export { router as authRouter };
```

```typescript
// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const authController = {
  async oauthCallback(req: Request, res: Response) {
    try {
      const user = req.user as any;

      // Upsert user in database
      const result = await pool.query(
        `INSERT INTO users (email, name, avatar_url, auth_provider, oauth_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) 
         DO UPDATE SET 
           name = EXCLUDED.name,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = NOW()
         RETURNING id, email, name, avatar_url`,
        [user.email, user.displayName, user.photos[0]?.value, user.provider, user.id]
      );

      const dbUser = result.rows[0];

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { userId: dbUser.id, email: dbUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: dbUser.id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      // Store refresh token in Redis
      await redis.setex(
        `refresh_token:${dbUser.id}`,
        7 * 24 * 60 * 60, // 7 days
        refreshToken
      );

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as { userId: string };

      // Check if token exists in Redis
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      if (storedToken !== refreshToken) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Get user from database
      const result = await pool.query(
        'SELECT id, email FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (userId) {
        // Delete refresh token from Redis
        await redis.del(`refresh_token:${userId}`);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  },
};
```

---

### 2. AI Service (Python/FastAPI - Port 8000)

**Purpose**: LangGraph orchestration and AI agent management using **LOCAL Ollama models**

**Responsibilities**:
- Multi-agent workflow orchestration with LangGraph
- Local LLM integration via Ollama (NO OpenAI/Anthropic)
- Vector embedding generation (sentence-transformers)
- Chat message processing with streaming
- Resume generation with JD matching
- Skills gap analysis

**Project Structure**:
```
ai-service/
├── main.py                    # FastAPI application
├── config.py                  # Configuration settings
├── requirements.txt
├── agents/
│   ├── __init__.py
│   ├── supervisor.py          # Uses Qwen2.5 7B
│   ├── profile_agent.py       # Uses Phi3 Mini
│   ├── skills_gap_agent.py    # Uses Qwen2.5-Coder
│   ├── job_search_agent.py    # Uses Phi3 Mini
│   ├── resume_builder_agent.py# Uses Qwen2.5 7B
│   └── learning_agent.py      # Uses Phi3 Mini
├── orchestration/
│   ├── __init__.py
│   ├── workflow.py            # LangGraph workflow
│   ├── state.py               # State definition
│   └── router.py              # Agent routing logic
├── integrations/
│   ├── __init__.py
│   ├── ollama_client.py       # Ollama integration (CRITICAL)
│   ├── chromadb_client.py     # Vector database
│   └── redis_client.py        # Caching
├── routers/
│   ├── __init__.py
│   ├── chat.py                # Chat endpoints
│   ├── resume.py              # Resume endpoints
│   └── skills.py              # Skills analysis endpoints
└── models/
    ├── __init__.py
    ├── profile.py             # Pydantic models
    └── conversation.py
```

**CRITICAL IMPLEMENTATION - Ollama Client**:

```python
# integrations/ollama_client.py
from langchain_community.chat_models import ChatOllama
from typing import Literal
import os

class OllamaClient:
    """
    Centralized Ollama client for all LLM operations.
    NO OpenAI/Anthropic - 100% local inference.
    """
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        
        # Model for complex reasoning (supervisor, resume builder)
        self.llm_reasoning = ChatOllama(
            model="qwen2.5:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.7,
            num_ctx=2048,      # Context window
            num_thread=6,      # 75% of 8 vCores
            top_p=0.9,
            repeat_penalty=1.1
        )
        
        # Model for fast tasks (profile, jobs, learning)
        self.llm_fast = ChatOllama(
            model="phi3:3.8b-mini-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.3,
            num_ctx=2048,
            num_thread=6,
            top_p=0.95,
            repeat_penalty=1.0
        )
        
        # Model for technical/coding tasks (skills gap)
        self.llm_coder = ChatOllama(
            model="qwen2.5-coder:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.2,
            num_ctx=2048,
            num_thread=6,
            top_p=0.9,
            repeat_penalty=1.05
        )
    
    def get_model(self, task_type: Literal["reasoning", "fast", "coding"]):
        """
        Return appropriate model based on task complexity.
        
        Args:
            task_type: "reasoning" (complex tasks), "fast" (simple tasks), 
                      "coding" (technical analysis)
        """
        if task_type == "reasoning":
            return self.llm_reasoning
        elif task_type == "coding":
            return self.llm_coder
        else:
            return self.llm_fast
    
    async def health_check(self) -> bool:
        """Check if Ollama service is healthy"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except:
            return False

# Global instance
ollama_client = OllamaClient()
```

**Main FastAPI Application**:

```python
# main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio
from integrations.ollama_client import ollama_client
from orchestration.workflow import build_careergini_workflow

app = FastAPI(
    title="CareerGini AI Service",
    description="Local LLM-powered AI agent system using Ollama",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize workflow
workflow = build_careergini_workflow(ollama_client)

# Pydantic models
class ChatRequest(BaseModel):
    user_id: str
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = None
    session_id: str
    agent_used: Optional[str] = None

class ResumeRequest(BaseModel):
    user_id: str
    job_description: str
    template: str = "modern"

class SkillsAnalysisRequest(BaseModel):
    user_id: str
    target_role: Optional[str] = None

# Health check
@app.get("/health")
async def health_check():
    ollama_healthy = await ollama_client.health_check()
    return {
        "status": "healthy" if ollama_healthy else "degraded",
        "ollama": "connected" if ollama_healthy else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

# Chat endpoint with streaming
@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Process chat message through multi-agent workflow.
    Uses LOCAL Ollama models for all LLM operations.
    """
    try:
        # Initialize state
        state = {
            "user_id": request.user_id,
            "session_id": request.session_id or generate_session_id(),
            "messages": [{"role": "user", "content": request.message}],
            "profile_data": await get_user_profile(request.user_id),
            "agent_responses": {},
        }
        
        # Run workflow (uses Ollama models internally)
        result = await workflow.ainvoke(state)
        
        return ChatResponse(
            response=result["final_output"],
            suggestions=result.get("suggested_prompts", []),
            session_id=result["session_id"],
            agent_used=result.get("active_agent")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/resume/generate")
async def generate_resume(request: ResumeRequest):
    """
    Generate tailored resume using Qwen2.5 7B model.
    """
    try:
        from agents.resume_builder_agent import ResumeBuilderAgent
        
        # Initialize agent with Ollama model
        agent = ResumeBuilderAgent(ollama_client.get_model("reasoning"))
        
        # Fetch user profile
        profile = await get_user_profile(request.user_id)
        
        # Generate resume
        result = await agent.generate_resume(
            profile=profile,
            job_description=request.job_description,
            template=request.template
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/skills/analyze")
async def analyze_skills(request: SkillsAnalysisRequest):
    """
    Analyze skills gap using Qwen2.5-Coder model.
    """
    try:
        from agents.skills_gap_agent import SkillsGapAgent
        
        # Initialize agent with Ollama coding model
        agent = SkillsGapAgent(ollama_client.get_model("coding"))
        
        # Fetch user profile
        profile = await get_user_profile(request.user_id)
        
        # Analyze skills
        result = await agent.analyze_skills_gap(
            profile=profile,
            target_role=request.target_role
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/recommend")
async def recommend_jobs(user_id: str, limit: int = 10):
    """
    Get job recommendations using Phi3 Mini model.
    """
    try:
        from agents.job_search_agent import JobSearchAgent
        
        # Initialize agent with fast Ollama model
        agent = JobSearchAgent(ollama_client.get_model("fast"))
        
        # Fetch user profile
        profile = await get_user_profile(user_id)
        
        # Get recommendations
        result = await agent.recommend_jobs(
            profile=profile,
            limit=limit
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Database Design

### Complete PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url VARCHAR(500),
    auth_provider VARCHAR(50) NOT NULL,
    oauth_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(auth_provider, oauth_id);

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- LinkedIn data
    linkedin_data JSONB,
    linkedin_synced_at TIMESTAMP,
    
    -- GitHub data
    github_data JSONB,
    github_synced_at TIMESTAMP,
    
    -- Resume data
    resume_data JSONB,
    resume_uploaded_at TIMESTAMP,
    
    -- Aggregated data
    skills TEXT[],
    experience JSONB[],
    education JSONB[],
    certifications JSONB[],
    
    -- Metadata
    experience_level VARCHAR(50),
    career_goals TEXT[],
    job_preferences JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_skills ON profiles USING GIN(skills);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    messages JSONB[] NOT NULL DEFAULT '{}',
    context JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_session ON conversations(session_id);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    requirements TEXT[],
    salary_range VARCHAR(100),
    job_type VARCHAR(50),
    external_url VARCHAR(500),
    external_id VARCHAR(255),
    source VARCHAR(100),
    posted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_title ON jobs(title);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_external ON jobs(source, external_id);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'applied',
    resume_version JSONB,
    cover_letter TEXT,
    notes TEXT,
    applied_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Resumes table
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    title VARCHAR(255),
    content JSONB NOT NULL,
    template VARCHAR(50) DEFAULT 'modern',
    file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_job ON resumes(job_id);

-- Learning resources table
CREATE TABLE learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50),
    title VARCHAR(500),
    url VARCHAR(1000),
    source VARCHAR(100),
    completed BOOLEAN DEFAULT FALSE,
    bookmarked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_learning_user ON learning_resources(user_id);
CREATE INDEX idx_learning_skill ON learning_resources(skill);
```

---

## API Documentation

### Complete API Endpoints

#### Authentication Endpoints

**POST /api/v1/auth/oauth/:provider**
Initiate OAuth flow

Parameters:
- `provider`: google | github | linkedin

Response:
```json
{
  "redirectUrl": "https://oauth-provider.com/authorize?..."
}
```

**GET /api/v1/auth/oauth/:provider/callback**
OAuth callback handler

**POST /api/v1/auth/refresh**
Refresh access token

**POST /api/v1/auth/logout**
Logout user

---

### Profile Endpoints

**GET /api/v1/profile**
Get user profile

**PUT /api/v1/profile**
Update profile

**POST /api/v1/profile/linkedin/sync**
Sync LinkedIn data

**POST /api/v1/profile/github/sync**
Sync GitHub data

**POST /api/v1/profile/resume/upload**
Upload and parse resume

---

### Chat Endpoints

**POST /api/v1/chat/message**
Send chat message

**GET /api/v1/chat/history/:sessionId**
Get conversation history

---

### Resume Endpoints

**POST /api/v1/resume/generate**
Generate tailored resume

**GET /api/v1/resume/:id/download**
Download resume file

---

### Job Endpoints

**GET /api/v1/jobs/search**
Search jobs

**GET /api/v1/jobs/recommendations**
Get personalized job recommendations

**POST /api/v1/jobs/apply**
Track job application

---

## Deployment Guide

### Docker Compose Production Configuration

```yaml
version: '3.8'

services:
  # Ollama - LOCAL LLM Service
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    environment:
      - OLLAMA_NUM_THREADS=6
      - OLLAMA_NUM_GPU=0
      - OLLAMA_MAX_LOADED_MODELS=2
    deploy:
      resources:
        limits:
          cpus: '7'
          memory: 16G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ... (other services)

volumes:
  postgres_data:
  redis_data:
  ollama_models:
  chroma_data:
```

---

**Document Version**: 1.0 (Complete Backend Guide with CPU-Optimized Ollama Integration)  
**Last Updated**: February 17, 2026  
**Maintained By**: CareerGini Development Team