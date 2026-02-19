# Antigravity Build Prompt: CareerGini - Complete Implementation Guide

## 🎯 Project Overview

**Project Name:** CareerGini  
**Type:** Full-stack AI-powered career advisory application  
**Architecture:** Microservices with multi-agent AI system  
**LLM Approach:** 100% LOCAL using CPU-optimized Ollama (NO paid APIs)  
**Deployment:** Dockerized, scalable, production-ready  
**Infrastructure:** OVH B2-30 (8 vCPUs, 30 GB RAM) or equivalent

---

## 📚 Documentation Context

You have been provided with comprehensive documentation files:

1. **CareerGini-Architecture.md** - CPU-optimized system architecture, hardware specs, data flows
2. **AI-Agents-Guide.md** - Multi-agent system design, LangGraph orchestration
3. **Frontend-Guide.md** - React/TypeScript frontend structure, components
4. **Backend-Guide.md** - Microservices, API specs, database schemas

**CRITICAL:** Read ALL documentation thoroughly. They contain detailed specifications you MUST follow.

---

## 🔄 CRITICAL ARCHITECTURE REQUIREMENT: Local LLMs Only

### ⚠️ ABSOLUTE REQUIREMENT: NO Paid LLM APIs

**FORBIDDEN:**
- ❌ OpenAI APIs (GPT-4, GPT-3.5, etc.)
- ❌ Anthropic APIs (Claude, etc.)
- ❌ Google AI APIs (Gemini, PaLM, etc.)
- ❌ Any external paid LLM service

**REQUIRED:**
- ✅ Ollama for 100% local LLM inference
- ✅ CPU-optimized quantized models (Q4_K_M)
- ✅ No external API calls for AI operations
- ✅ Privacy-first, cost-free inference

---

## 🤖 Model Configuration (MANDATORY)

### LLM Model Assignment by Agent

```yaml
Supervisor Agent:
  Model: qwen2.5:7b-instruct-q4_K_M
  Size: ~4.5 GB
  Performance: 18-22 tokens/second on 8 vCPU
  Purpose: Complex reasoning and agent routing
  Temperature: 0.7

Profile Analysis Agent:
  Model: phi3:3.8b-mini-instruct-q4_K_M
  Size: ~2.5 GB
  Performance: 28-32 tokens/second
  Purpose: Fast data extraction and structuring
  Temperature: 0.3

Skills Gap Agent:
  Model: qwen2.5-coder:7b-instruct-q4_K_M
  Size: ~4.5 GB
  Performance: 20-25 tokens/second
  Purpose: Technical skill analysis and recommendations
  Temperature: 0.2

Job Search Agent:
  Model: phi3:3.8b-mini-instruct-q4_K_M
  Size: ~2.5 GB
  Performance: 28-32 tokens/second
  Purpose: Fast job matching and ranking
  Temperature: 0.3

Resume Builder Agent:
  Model: qwen2.5:7b-instruct-q4_K_M
  Size: ~4.5 GB
  Performance: 18-22 tokens/second
  Purpose: Professional content generation
  Temperature: 0.7

Learning Resource Agent:
  Model: phi3:3.8b-mini-instruct-q4_K_M
  Size: ~2.5 GB
  Performance: 28-32 tokens/second
  Purpose: Resource curation and ranking
  Temperature: 0.3
```

### Ollama Configuration

```bash
# Environment variables (MANDATORY)
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_NUM_THREADS=6              # 75% of 8 vCores
OLLAMA_NUM_GPU=0                  # Force CPU-only mode
OLLAMA_MAX_LOADED_MODELS=2        # Memory optimization
OLLAMA_MODEL_REASONING=qwen2.5:7b-instruct-q4_K_M
OLLAMA_MODEL_FAST=phi3:3.8b-mini-instruct-q4_K_M
OLLAMA_MODEL_CODER=qwen2.5-coder:7b-instruct-q4_K_M
```

---

## 🎯 Build Objectives & Deliverables

### Phase 1: Project Structure Setup

Create complete directory structure:

```
careergini/
├── frontend/                   # React 18 + TypeScript + Vite
├── api-gateway/               # Node.js/Express (Port 3000)
├── ai-service/                # Python/FastAPI (Port 8000)
├── profile-service/           # Node.js/Express (Port 3001)
├── job-service/               # Node.js/Express (Port 3002)
├── learning-service/          # Node.js/Express (Port 3003)
├── docker/                    # Dockerfiles for each service
├── scripts/
│   ├── download-models.sh     # Ollama model download script
│   ├── init-db.sh            # Database initialization
│   └── deploy.sh             # Production deployment
├── docs/                      # Documentation (provided)
├── docker-compose.yml         # Development compose
├── docker-compose.prod.yml    # Production compose
├── .env.example              # Environment template
├── Makefile                  # Common commands
└── README.md                 # Setup instructions
```

---

## 📋 Detailed Implementation Phases

### Phase 1: Infrastructure Setup (Critical First)

**1.1 Docker Compose Configuration**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Ollama - LOCAL LLM Service (CRITICAL)
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
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=careergini
      - POSTGRES_USER=careergini
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-changeme}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U careergini"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ChromaDB - Vector Database (Free Pinecone alternative)
  chromadb:
    image: ghcr.io/chroma-core/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - ALLOW_RESET=TRUE
      - ANONYMIZED_TELEMETRY=FALSE
    restart: unless-stopped

  # Frontend (React + Vite)
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend.Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - api-gateway
    restart: unless-stopped

  # API Gateway
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: ../docker/api-gateway.Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://careergini:changeme@postgres:5432/careergini
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET:-change-in-production}
      - AI_SERVICE_URL=http://ai-service:8000
      - PROFILE_SERVICE_URL=http://profile-service:3001
      - JOB_SERVICE_URL=http://job-service:3002
      - LEARNING_SERVICE_URL=http://learning-service:3003
    volumes:
      - ./api-gateway:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # AI Service (CRITICAL - Uses Ollama)
  ai-service:
    build:
      context: ./ai-service
      dockerfile: ../docker/ai-service.Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_NUM_THREADS=6
      - DATABASE_URL=postgresql://careergini:changeme@postgres:5432/careergini
      - REDIS_URL=redis://redis:6379
      - CHROMA_HOST=chromadb
      - CHROMA_PORT=8000
    volumes:
      - ./ai-service:/app
    depends_on:
      - ollama
      - postgres
      - redis
      - chromadb
    restart: unless-stopped

  # Profile Service
  profile-service:
    build:
      context: ./profile-service
      dockerfile: ../docker/profile-service.Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://careergini:changeme@postgres:5432/careergini
      - REDIS_URL=redis://redis:6379
      - LINKEDIN_CLIENT_ID=${LINKEDIN_CLIENT_ID}
      - LINKEDIN_CLIENT_SECRET=${LINKEDIN_CLIENT_SECRET}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    volumes:
      - ./profile-service:/app
      - /app/node_modules
    depends_on:
      - postgres
    restart: unless-stopped

  # Job Service
  job-service:
    build:
      context: ./job-service
      dockerfile: ../docker/job-service.Dockerfile
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://careergini:changeme@postgres:5432/careergini
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./job-service:/app
      - /app/node_modules
    depends_on:
      - postgres
    restart: unless-stopped

  # Learning Service
  learning-service:
    build:
      context: ./learning-service
      dockerfile: ../docker/learning-service.Dockerfile
    ports:
      - "3003:3003"
    environment:
      - DATABASE_URL=postgresql://careergini:changeme@postgres:5432/careergini
      - REDIS_URL=redis://redis:6379
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
    volumes:
      - ./learning-service:/app
      - /app/node_modules
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  ollama_models:
  chroma_data:
```

**1.2 Model Download Script**

Create `scripts/download-models.sh`:

```bash
#!/bin/bash
set -e

echo "🤖 Downloading Ollama models for CareerGini..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama is not running. Starting Ollama service..."
    docker-compose up -d ollama
    echo "⏳ Waiting for Ollama to be ready..."
    sleep 15
fi

echo "📥 Downloading Qwen2.5 7B Instruct (Q4_K_M) - Complex reasoning..."
docker-compose exec ollama ollama pull qwen2.5:7b-instruct-q4_K_M || ollama pull qwen2.5:7b-instruct-q4_K_M

echo "📥 Downloading Phi3 Mini 3.8B (Q4_K_M) - Fast tasks..."
docker-compose exec ollama ollama pull phi3:3.8b-mini-instruct-q4_K_M || ollama pull phi3:3.8b-mini-instruct-q4_K_M

echo "📥 Downloading Qwen2.5-Coder 7B (Q4_K_M) - Technical analysis..."
docker-compose exec ollama ollama pull qwen2.5-coder:7b-instruct-q4_K_M || ollama pull qwen2.5-coder:7b-instruct-q4_K_M

echo "✅ All models downloaded successfully!"
echo ""
echo "📊 Available models:"
docker-compose exec ollama ollama list || ollama list

echo ""
echo "💾 Total storage used: ~12 GB"
echo "🎯 Models ready for inference!"
```

Make executable:
```bash
chmod +x scripts/download-models.sh
```

---

### Phase 2: AI Service Implementation (CRITICAL)

**2.1 Ollama Client (MANDATORY IMPLEMENTATION)**

Create `ai-service/integrations/ollama_client.py`:

```python
"""
Ollama Client for CareerGini
100% Local LLM Inference - NO External APIs
"""

from langchain_community.chat_models import ChatOllama
from typing import Literal
import os
import logging

logger = logging.getLogger(__name__)

class OllamaClient:
    """
    Centralized Ollama client for all LLM operations.
    Supports three model types for different task complexities.
    """
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        num_threads = int(os.getenv("OLLAMA_NUM_THREADS", "6"))
        
        logger.info(f"Initializing Ollama client with base_url: {self.base_url}")
        
        # Model 1: Complex Reasoning (Supervisor, Resume Builder)
        self.llm_reasoning = ChatOllama(
            model="qwen2.5:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.7,
            num_ctx=2048,
            num_thread=num_threads,
            top_p=0.9,
            repeat_penalty=1.1,
            verbose=False
        )
        logger.info("✓ Loaded reasoning model: qwen2.5:7b-instruct-q4_K_M")
        
        # Model 2: Fast Tasks (Profile, Jobs, Learning)
        self.llm_fast = ChatOllama(
            model="phi3:3.8b-mini-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.3,
            num_ctx=2048,
            num_thread=num_threads,
            top_p=0.95,
            repeat_penalty=1.0,
            verbose=False
        )
        logger.info("✓ Loaded fast model: phi3:3.8b-mini-instruct-q4_K_M")
        
        # Model 3: Technical/Coding Tasks (Skills Gap)
        self.llm_coder = ChatOllama(
            model="qwen2.5-coder:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.2,
            num_ctx=2048,
            num_thread=num_threads,
            top_p=0.9,
            repeat_penalty=1.05,
            verbose=False
        )
        logger.info("✓ Loaded coder model: qwen2.5-coder:7b-instruct-q4_K_M")
    
    def get_model(self, task_type: Literal["reasoning", "fast", "coding"]):
        """
        Get appropriate model for task type.
        
        Args:
            task_type: 
                - "reasoning": Complex tasks (supervisor, resume)
                - "fast": Simple tasks (profile, jobs, learning)
                - "coding": Technical analysis (skills gap)
        
        Returns:
            ChatOllama instance
        """
        if task_type == "reasoning":
            return self.llm_reasoning
        elif task_type == "coding":
            return self.llm_coder
        else:
            return self.llm_fast
    
    async def health_check(self) -> dict:
        """Check Ollama service health"""
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    return {
                        "status": "healthy",
                        "models_available": len(models),
                        "base_url": self.base_url
                    }
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "base_url": self.base_url
            }

# Global singleton instance
_ollama_client = None

def get_ollama_client() -> OllamaClient:
    """Get or create global Ollama client instance"""
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient()
    return _ollama_client
```

**2.2 LangGraph Workflow Integration**

Create `ai-service/orchestration/workflow.py`:

```python
"""
LangGraph Multi-Agent Workflow
Orchestrates 6 specialized agents using LOCAL Ollama models
"""

from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any
from integrations.ollama_client import get_ollama_client
from agents.supervisor import SupervisorAgent
from agents.profile_agent import ProfileAgent
from agents.skills_gap_agent import SkillsGapAgent
from agents.job_search_agent import JobSearchAgent
from agents.resume_builder_agent import ResumeBuilderAgent
from agents.learning_agent import LearningAgent

class CareerGiniState(TypedDict):
    """State passed between agents"""
    user_id: str
    session_id: str
    messages: List[Dict[str, str]]
    profile_data: Dict[str, Any]
    agent_responses: Dict[str, Any]
    final_output: str
    suggested_prompts: List[str]
    active_agent: str

def build_careergini_workflow():
    """
    Build LangGraph workflow with LOCAL Ollama models.
    NO external LLM APIs used.
    """
    
    # Get Ollama client
    ollama_client = get_ollama_client()
    
    # Initialize agents with appropriate models
    supervisor = SupervisorAgent(ollama_client.get_model("reasoning"))
    profile_agent = ProfileAgent(ollama_client.get_model("fast"))
    skills_gap = SkillsGapAgent(ollama_client.get_model("coding"))
    job_search = JobSearchAgent(ollama_client.get_model("fast"))
    resume_builder = ResumeBuilderAgent(ollama_client.get_model("reasoning"))
    learning_agent = LearningAgent(ollama_client.get_model("fast"))
    
    # Define workflow
    workflow = StateGraph(CareerGiniState)
    
    # Add nodes
    workflow.add_node("supervisor", supervisor.run)
    workflow.add_node("profile", profile_agent.run)
    workflow.add_node("skills_gap", skills_gap.run)
    workflow.add_node("job_search", job_search.run)
    workflow.add_node("resume", resume_builder.run)
    workflow.add_node("learning", learning_agent.run)
    
    # Define routing function
    def route_to_agent(state: CareerGiniState) -> str:
        """Route to appropriate agent based on supervisor decision"""
        # Supervisor determines which agent should handle the request
        # This uses LOCAL Ollama model - no external API calls
        return state.get("active_agent", END)
    
    # Set entry point
    workflow.set_entry_point("supervisor")
    
    # Add conditional edges from supervisor to other agents
    workflow.add_conditional_edges(
        "supervisor",
        route_to_agent,
        {
            "profile": "profile",
            "skills_gap": "skills_gap",
            "job_search": "job_search",
            "resume": "resume",
            "learning": "learning",
            END: END
        }
    )
    
    # All agents return to END
    for agent in ["profile", "skills_gap", "job_search", "resume", "learning"]:
        workflow.add_edge(agent, END)
    
    return workflow.compile()
```

---

### Phase 3: Makefile for Easy Commands

Create `Makefile`:

```makefile
.PHONY: help setup models dev down build logs clean deploy test

help: ## Show this help message
	@echo "CareerGini Development Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\\033[36m%-20s\\033[0m %s\\n", $$1, $$2}'

setup: ## Initial setup - copy env and start infrastructure
	@echo "🚀 Setting up CareerGini..."
	@cp -n .env.example .env || true
	@echo "📝 Please edit .env with your configuration"
	@echo "🐳 Starting infrastructure services..."
	@docker-compose up -d postgres redis chromadb ollama
	@echo "⏳ Waiting for services to be ready..."
	@sleep 15
	@echo "✅ Infrastructure ready!"

models: ## Download Ollama models (~12 GB)
	@./scripts/download-models.sh

dev: models ## Start all services in development mode
	@echo "🚀 Starting CareerGini in development mode..."
	@docker-compose up

down: ## Stop all services
	@docker-compose down

build: ## Build all Docker images
	@docker-compose build

logs: ## Show logs from all services
	@docker-compose logs -f

clean: ## Remove all containers, volumes, and images
	@echo "⚠️  This will delete all data. Press Ctrl+C to cancel..."
	@sleep 5
	@docker-compose down -v --rmi all

deploy: ## Deploy to production
	@./scripts/deploy.sh

test: ## Run tests for all services
	@echo "🧪 Running tests..."
	@cd frontend && npm test
	@cd api-gateway && npm test
	@cd ai-service && pytest

db-init: ## Initialize database
	@docker-compose exec postgres psql -U careergini -d careergini -f /docker-entrypoint-initdb.d/init.sql

db-reset: ## Reset database (WARNING: DELETES ALL DATA)
	@echo "⚠️  Resetting database - all data will be lost!"
	@docker-compose down postgres
	@docker volume rm careergini_postgres_data || true
	@docker-compose up -d postgres
	@sleep 5
	@make db-init
```

---

## ✅ Acceptance Criteria

### Functional Completeness
- [ ] All services start with `make dev`
- [ ] Ollama models download successfully
- [ ] User can login with OAuth
- [ ] Chat interface responds using LOCAL models
- [ ] Profile sync works (LinkedIn/GitHub)
- [ ] Resume generation works
- [ ] Job recommendations work
- [ ] Skills gap analysis works

### Local LLM Integration (CRITICAL)
- [ ] Ollama service runs and responds
- [ ] All 3 models available (qwen2.5, phi3, qwen2.5-coder)
- [ ] ZERO calls to OpenAI/Anthropic APIs
- [ ] All agents use Ollama models
- [ ] LangGraph workflow executes
- [ ] Inference speed: 15-25 tokens/second

### Database & Persistence
- [ ] PostgreSQL schema created
- [ ] All indexes present
- [ ] Data persists across restarts
- [ ] Redis caching works

### Docker & Deployment
- [ ] `make setup` initializes everything
- [ ] `make models` downloads models
- [ ] `make dev` starts all services
- [ ] All health checks pass

---

## 🚨 Critical Success Factors

1. **NO External LLM APIs** - All inference LOCAL via Ollama
2. **Model Downloads Work** - 12 GB models download successfully
3. **CPU Performance** - 15-25 tokens/second achieved
4. **Memory Management** - Stays under 30 GB RAM
5. **End-to-End Flow** - User can chat and get responses
6. **Production Ready** - Docker Compose production config included

---

**Build Version**: 2.0 (CPU-Optimized, Local LLMs Only)  
**Target Infrastructure**: OVH B2-30 (8 vCPUs, 30 GB RAM)  
**Total Model Size**: ~12 GB (quantized)  
**Zero API Costs**: 100% local inference  

**Remember**: This build MUST use ONLY local Ollama models. Any external LLM API calls are strictly forbidden.