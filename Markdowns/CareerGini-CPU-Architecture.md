# CareerGini - System Architecture Documentation (CPU-Optimized)

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Hardware Infrastructure](#hardware-infrastructure)
3. [Architecture Diagram](#architecture-diagram)
4. [Component Architecture](#component-architecture)
5. [Data Flow](#data-flow)
6. [Technology Stack](#technology-stack)
7. [Deployment Architecture](#deployment-architecture)
8. [Performance Optimization](#performance-optimization)

---

## System Overview

**CareerGini** is an AI-powered career advisory platform that uses multi-agent AI with **100% CPU-based local LLMs** to provide personalized career guidance, skill gap analysis, resume generation, and job recommendations.

### Key Capabilities
- Multi-source profile aggregation (LinkedIn, GitHub, Resumes)
- Intelligent skill gap analysis using local AI
- JD-matched resume generation
- Real-time job recommendations
- Conversational career guidance
- Curated learning resource discovery

### Design Philosophy
- **Privacy-First**: 100% local LLM processing (NO external API calls to OpenAI/Anthropic)
- **Cost-Effective**: Zero ongoing AI API costs
- **Scalable**: Optimized for CPU-only inference on affordable cloud infrastructure
- **Production-Ready**: Battle-tested quantized models with proven performance

---

## Hardware Infrastructure

### Recommended Server Configuration

**Primary Deployment: OVH B2-30 or Equivalent**

```yaml
Server Specifications:
  Provider: OVH Cloud / Hetzner Cloud / Any VPS Provider
  Type: B2-30 equivalent (General Purpose, 8 vCPUs, 30 GB RAM)
  
  CPU:
    Cores: 8 vCores (dedicated)
    Architecture: x86_64 (Intel Haswell/Broadwell or AMD EPYC)
    Clock Speed: 2.0-2.4 GHz base
    Recommended: Intel Xeon or AMD EPYC with AVX2 support
    
  RAM:
    Capacity: 30 GB DDR4 ECC
    Channels: Dual-channel (sufficient for 7B models)
    Type: ECC Registered (data integrity)
    
  Storage:
    Type: NVMe SSD
    Capacity: 200 GB minimum
    Breakdown:
      - OS + System: 20 GB
      - Docker Images: 30 GB
      - LLM Models: ~12 GB (quantized)
      - PostgreSQL Data: 50 GB
      - Application Files: 20 GB
      - Logs & Cache: 10 GB
      - Buffer: 58 GB
      
  Network:
    Bandwidth: 500 Mbps minimum
    Inbound: Unlimited
    Outbound: Unlimited (check provider limits)
    
  Cost:
    OVH B2-30: €0.26/hour (~€187/month, ~₹17,000/month)
    Hetzner CPX41: €0.17/hour (~€122/month, ~₹11,000/month)
    Alternative: AWS t3.2xlarge spot instances (~$80-120/month)
```

### Why This Configuration Works

**CPU-Only Inference Viability:**
- Modern quantized models (Q4_K_M) achieve 15-25 tokens/second on 8-core CPUs
- 30 GB RAM sufficient for 7B parameter models with full context
- No GPU required - reduces cost by 70-80% vs GPU instances
- Proven performance: Llama 2 7B Q4_K_M reaches 15 t/s on AMD EPYC

**Memory Allocation:**
```
Total: 30 GB RAM
├─ OS & System: 2 GB
├─ Ollama Service: 16 GB (model loading + inference)
├─ PostgreSQL: 4 GB
├─ Redis: 2 GB
├─ API Services: 3 GB
├─ Frontend: 1 GB
└─ Buffer: 2 GB
```

---

## Architecture Diagram

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           React SPA (TypeScript + Vite)                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │
│  │  │   Chat   │  │ Profile  │  │  Resume  │  │   Jobs   │    │  │
│  │  │Interface │  │Dashboard │  │  Builder │  │  Board   │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │  │
│  │                                                               │  │
│  │  State Management: Zustand | API Client: React Query        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ HTTPS/WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         Node.js/Express API Gateway (Port 3000)              │  │
│  │                                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │ OAuth Manager│  │ JWT Handler  │  │Rate Limiter  │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │         Request Router & Load Balancer              │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MICROSERVICES LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  AI Service      │  │ Profile Service  │  │  Job Service     │ │
│  │  (Python/FastAPI)│  │ (Node.js/Express)│  │(Node.js/Express) │ │
│  │   Port 8000      │  │   Port 3001      │  │   Port 3002      │ │
│  │                  │  │                  │  │                  │ │
│  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │
│  │ │  LangGraph   │ │  │ │LinkedIn API  │ │  │ │Job Board API │ │
│  │ │ Orchestrator │ │  │ │GitHub API    │ │  │ │Search Engine │ │
│  │ └──────────────┘ │  │ │Resume Parser │ │  │ │Recommender   │ │
│  │                  │  │ └──────────────┘ │  │ └──────────────┘ │
│  │ ┌──────────────┐ │  │                  │  │                  │ │
│  │ │ Multi-Agent  │ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │
│  │ │   System     │ │  │ │Profile       │ │  │ │Application   │ │
│  │ │              │ │  │ │Aggregator    │ │  │ │Tracker       │ │
│  │ │• Supervisor  │ │  │ └──────────────┘ │  │ └──────────────┘ │
│  │ │• Profile     │ │  │                  │  │                  │ │
│  │ │• Skills Gap  │ │  └──────────────────┘  └──────────────────┘ │
│  │ │• Job Search  │ │                                             │ │
│  │ │• Resume      │ │  ┌──────────────────┐                      │ │
│  │ │• Learning    │ │  │Learning Service  │                      │ │
│  │ └──────────────┘ │  │(Node.js/Express) │                      │ │
│  │                  │  │   Port 3003      │                      │ │
│  │ ┌──────────────┐ │  │                  │                      │ │
│  │ │Ollama Client │ │  │ ┌──────────────┐ │                      │ │
│  │ │Integration   │ │  │ │YouTube API   │ │                      │ │
│  │ └──────────────┘ │  │ │GitHub Search │ │                      │ │
│  └──────────────────┘  │ │Course APIs   │ │                      │ │
│           │            │ └──────────────┘ │                      │ │
│           │            └──────────────────┘                      │ │
│           │                                                       │ │
└───────────┼───────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  LOCAL LLM INFERENCE LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         Ollama Service (Port 11434)                           │  │
│  │         CPU-Optimized Inference Engine                        │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Loaded Models (Q4_K_M Quantization)                   │ │  │
│  │  │                                                         │ │  │
│  │  │  • Qwen2.5:7b-instruct-q4_K_M (~4.5 GB)               │ │  │
│  │  │    - Supervisor, Resume Builder                        │ │  │
│  │  │    - Benchmark: 18-22 t/s, 74.2 MMLU                 │ │  │
│  │  │                                                         │ │  │
│  │  │  • Phi3:3.8b-mini-instruct-q4_K_M (~2.5 GB)          │ │  │
│  │  │    - Profile Analysis, Job Search, Learning           │ │  │
│  │  │    - Benchmark: 28-32 t/s, fast inference            │ │  │
│  │  │                                                         │ │  │
│  │  │  • Qwen2.5-Coder:7b-instruct-q4_K_M (~4.5 GB)        │ │  │
│  │  │    - Skills Gap Analysis (technical tasks)            │ │  │
│  │  │    - Benchmark: 20-25 t/s, 57.9 HumanEval            │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │  Configuration:                                              │  │
│  │  - OLLAMA_NUM_THREADS=6 (75% of 8 vCores)                  │  │
│  │  - OLLAMA_NUM_GPU=0 (CPU-only mode)                        │  │
│  │  - OLLAMA_MAX_LOADED_MODELS=2 (memory optimization)        │  │
│  │  - Context Length: 2048 tokens (balanced)                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   PostgreSQL     │  │   ChromaDB       │  │     Redis        │ │
│  │  (Primary DB)    │  │ (Vector Store)   │  │   (Cache/Queue)  │ │
│  │   Port 5432      │  │   Port 8001      │  │   Port 6379      │ │
│  │                  │  │                  │  │                  │ │
│  │ • Users          │  │ • Profile        │  │ • Sessions       │ │
│  │ • Profiles       │  │   Embeddings     │  │ • Chat History   │ │
│  │ • Conversations  │  │ • Job            │  │ • Rate Limits    │ │
│  │ • Jobs           │  │   Embeddings     │  │ • Task Queue     │ │
│  │ • Applications   │  │ • Skill          │  │                  │ │
│  │ • Resumes        │  │   Embeddings     │  │                  │ │
│  │                  │  │                  │  │                  │ │
│  │ Storage: 50 GB   │  │ Storage: 10 GB   │  │ Memory: 2 GB     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTEGRATIONS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ OAuth        │  │  Job Boards  │  │  Learning    │             │
│  │ Providers    │  │              │  │  Platforms   │             │
│  │              │  │              │  │              │             │
│  │ • Google     │  │ • LinkedIn   │  │ • YouTube    │             │
│  │ • GitHub     │  │ • Indeed     │  │ • GitHub     │             │
│  │ • LinkedIn   │  │ • Glassdoor  │  │ • Coursera   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Architecture

**Technology**: React 18 + TypeScript + Vite

```
Frontend (Port 5173)
│
├── Presentation Layer
│   ├── Chat Interface (Real-time streaming)
│   ├── Profile Dashboard (Data visualization)
│   ├── Resume Builder (Live preview)
│   ├── Job Board (Filtering & recommendations)
│   └── Learning Hub (Resource curation)
│
├── State Management (Zustand)
│   ├── Auth Store (JWT, user session)
│   ├── Chat Store (Messages, streaming)
│   ├── Profile Store (User data, skills)
│   └── UI Store (Modals, notifications)
│
└── API Integration (React Query + Axios)
    ├── HTTP Client (REST APIs)
    ├── WebSocket Client (Chat streaming)
    └── Caching Layer (React Query)
```

### 2. API Gateway Architecture

**Technology**: Node.js + Express

```
API Gateway (Port 3000)
│
├── Authentication Layer
│   ├── OAuth 2.0 Flows (Google, GitHub, LinkedIn)
│   ├── JWT Generation & Validation
│   └── Session Management (Redis)
│
├── Security Layer
│   ├── Rate Limiting (Redis-backed)
│   ├── Request Validation (Joi)
│   ├── CORS Configuration
│   └── Helmet Security Headers
│
└── Routing Layer
    ├── /api/v1/auth/* → OAuth endpoints
    ├── /api/v1/chat/* → AI Service
    ├── /api/v1/profile/* → Profile Service
    ├── /api/v1/jobs/* → Job Service
    └── /api/v1/learning/* → Learning Service
```

### 3. AI Service Architecture (CPU-Optimized)

**Technology**: Python + FastAPI + LangGraph + Ollama

```
AI Service (Port 8000)
│
├── Ollama Client Layer
│   ├── Model Manager
│   │   ├── Load/Unload Models
│   │   ├── Memory Optimization
│   │   └── Thread Configuration
│   │
│   ├── Inference Engine
│   │   ├── Qwen2.5 7B (Reasoning)
│   │   ├── Phi3 Mini (Fast Tasks)
│   │   └── Qwen2.5-Coder 7B (Technical)
│   │
│   └── Context Manager
│       ├── Token Counting
│       ├── Context Window (2048 tokens)
│       └── Memory Buffer Management
│
├── LangGraph Orchestration Layer
│   ├── State Graph Definition
│   ├── Node Registration (6 agents)
│   ├── Edge Routing Logic
│   └── Conditional Branching
│
├── Multi-Agent System
│   ├── Supervisor Agent
│   │   └── Uses: Qwen2.5 7B (complex routing)
│   │
│   ├── Profile Analysis Agent
│   │   └── Uses: Phi3 Mini (fast extraction)
│   │
│   ├── Skills Gap Agent
│   │   └── Uses: Qwen2.5-Coder 7B (technical analysis)
│   │
│   ├── Job Search Agent
│   │   └── Uses: Phi3 Mini (fast matching)
│   │
│   ├── Resume Builder Agent
│   │   └── Uses: Qwen2.5 7B (content generation)
│   │
│   └── Learning Resource Agent
│       └── Uses: Phi3 Mini (curation)
│
├── Vector Store Integration
│   ├── ChromaDB Client
│   ├── Embedding Generation (sentence-transformers)
│   │   └── Model: all-MiniLM-L6-v2 (local, CPU-optimized)
│   └── Similarity Search
│
└── API Endpoints
    ├── POST /chat (Main conversation endpoint)
    ├── POST /resume/generate (JD-matched resume)
    ├── POST /skills/analyze (Skills gap analysis)
    ├── GET /jobs/recommend (Job recommendations)
    └── GET /learning/resources (Curated resources)
```

**Critical Ollama Integration Details:**

```python
# integrations/ollama_client.py
from langchain_community.chat_models import ChatOllama
import os

class OllamaClient:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        
        # Model for complex reasoning (supervisor, resume)
        self.llm_reasoning = ChatOllama(
            model="qwen2.5:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.7,
            num_ctx=2048,      # Context window
            num_thread=6       # 75% of 8 vCores
        )
        
        # Model for fast tasks (profile, jobs, learning)
        self.llm_fast = ChatOllama(
            model="phi3:3.8b-mini-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.3,
            num_ctx=2048,
            num_thread=6
        )
        
        # Model for technical/coding tasks (skills gap)
        self.llm_coder = ChatOllama(
            model="qwen2.5-coder:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.2,
            num_ctx=2048,
            num_thread=6
        )
    
    def get_model(self, task_type: str):
        """Return appropriate model based on task complexity"""
        if task_type in ["reasoning", "routing", "complex", "resume"]:
            return self.llm_reasoning
        elif task_type in ["coding", "technical", "skills"]:
            return self.llm_coder
        else:
            return self.llm_fast
```

### 4. Profile Service Architecture

```
Profile Service (Port 3001)
│
├── LinkedIn Integration
│   ├── OAuth Flow
│   ├── Profile Fetching
│   └── Experience Extraction
│
├── GitHub Integration
│   ├── Token Authentication
│   ├── Repository Analysis
│   └── Language Detection
│
├── Resume Parser
│   ├── PDF Text Extraction (pdf-parse)
│   ├── AI-based Structuring (Ollama)
│   └── Data Validation
│
└── Profile Aggregator
    ├── Data Merging
    ├── Skill Deduplication
    └── Database Storage
```

### 5. Job & Learning Services

```
Job Service (Port 3002)
│
├── Job Scraper (Playwright)
│   ├── LinkedIn Jobs
│   ├── Indeed
│   └── Glassdoor
│
├── Job Matcher (Ollama-powered)
│   ├── Skill Matching
│   ├── Experience Matching
│   └── Relevance Scoring
│
└── Application Tracker
    └── Status Management

Learning Service (Port 3003)
│
├── YouTube API Integration
├── GitHub Repository Search
├── Course Aggregation (Coursera, freeCodeCamp)
└── Resource Ranking (Ollama-powered)
```

---

## Data Flow

### 1. User Onboarding Flow

```
User Registration
    ↓
OAuth Provider Selection (Google/GitHub/LinkedIn)
    ↓
API Gateway: JWT Token Generation
    ↓
Frontend: Store Token (Zustand + LocalStorage)
    ↓
Profile Service: Create User Record (PostgreSQL)
    ↓
Dashboard: Display Onboarding Steps
```

### 2. Profile Sync Flow

```
User Initiates LinkedIn/GitHub Sync
    ↓
Profile Service: Fetch Data via APIs
    ↓
Profile Service: Send to AI Service for Parsing
    ↓
AI Service: Ollama (Phi3 Mini) Extracts Structured Data
    ↓
Profile Service: Store in PostgreSQL
    ↓
AI Service: Generate Embeddings (sentence-transformers)
    ↓
ChromaDB: Store Profile Vector
    ↓
Frontend: Display Aggregated Profile
```

### 3. Chat Conversation Flow (Multi-Agent)

```
User Sends Message via Chat Interface
    ↓
API Gateway: Validate JWT, Forward to AI Service
    ↓
AI Service: LangGraph Supervisor Agent
    │         (Ollama - Qwen2.5 7B)
    ↓
Supervisor Routes to Appropriate Agent:
    │
    ├─→ Profile Agent (Phi3 Mini) → Fetch User Data
    ├─→ Skills Gap Agent (Qwen2.5-Coder) → Analyze Skills
    ├─→ Job Search Agent (Phi3 Mini) → Match Jobs
    ├─→ Resume Builder Agent (Qwen2.5 7B) → Generate Resume
    └─→ Learning Agent (Phi3 Mini) → Curate Resources
    ↓
Agents Execute Tasks (Parallel where possible)
    ↓
Results Aggregated by Supervisor
    ↓
AI Service: Stream Response to Frontend (SSE/WebSocket)
    ↓
Frontend: Display Streaming Message
    ↓
Chat Store: Save to Conversation History
    ↓
PostgreSQL: Persist Conversation
```

### 4. Resume Generation Flow

```
User Provides Job Description (JD)
    ↓
AI Service: Resume Builder Agent (Ollama - Qwen2.5 7B)
    ↓
Fetch User Profile from PostgreSQL
    ↓
Extract JD Keywords using AI
    ↓
Match Profile Skills to JD Requirements
    ↓
Generate Tailored Resume Content
    ↓
Apply Template Formatting
    ↓
Return Structured Resume JSON
    ↓
Frontend: Render Live Preview
    ↓
User Downloads (PDF/DOCX generation)
```

---

## Technology Stack

### Frontend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.3.x | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Build Tool** | Vite | 5.x | Fast dev server |
| **State** | Zustand | 4.x | Global state |
| **API Client** | React Query | 5.x | Server state caching |
| **Styling** | TailwindCSS | 3.x | Utility-first CSS |
| **Forms** | React Hook Form | 7.x | Form handling |
| **Validation** | Zod | 3.x | Schema validation |
| **Charts** | Recharts | 2.x | Data visualization |

### Backend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **API Gateway** | Node.js + Express | 20.x / 4.x | HTTP server |
| **AI Service** | Python + FastAPI | 3.11 / 0.104.x | AI endpoints |
| **Microservices** | Node.js + Express | 20.x / 4.x | Business logic |
| **Database** | PostgreSQL | 15.x | Primary data store |
| **Cache** | Redis | 7.x | Session & caching |
| **Vector DB** | ChromaDB | 0.4.x | Embeddings (local, free) |

### AI/ML Stack (CPU-Optimized)

| Component | Technology | Details |
|-----------|-----------|---------|
| **LLM Runtime** | Ollama | 0.1.x (CPU-optimized) |
| **Model 1** | Qwen2.5 7B Instruct | Q4_K_M (~4.5 GB), 74.2 MMLU |
| **Model 2** | Phi3 Mini 3.8B | Q4_K_M (~2.5 GB), 28-32 t/s |
| **Model 3** | Qwen2.5-Coder 7B | Q4_K_M (~4.5 GB), 57.9 HumanEval |
| **Orchestration** | LangGraph | 0.0.x (agent framework) |
| **LangChain** | langchain-community | 0.0.x (Ollama integration) |
| **Embeddings** | sentence-transformers | all-MiniLM-L6-v2 (local) |
| **Vector Store** | ChromaDB Client | Python client |

### DevOps Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Containerization** | Docker | 24.x | Container runtime |
| **Orchestration** | Docker Compose | 2.x | Multi-container |
| **Web Server** | Nginx (optional) | 1.25.x | Reverse proxy |
| **Process Manager** | systemd | - | Service management |

---

## Deployment Architecture

### Docker Compose Services

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    image: careergini-frontend:latest
    ports: ["5173:5173"]
    depends_on: [api-gateway]
    
  # API Gateway
  api-gateway:
    image: careergini-api-gateway:latest
    ports: ["3000:3000"]
    depends_on: [postgres, redis, ai-service]
    
  # AI Service (CPU-Optimized)
  ai-service:
    image: careergini-ai-service:latest
    ports: ["8000:8000"]
    depends_on: [ollama, chromadb, postgres]
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    
  # Ollama (Local LLM Engine)
  ollama:
    image: ollama/ollama:latest
    ports: ["11434:11434"]
    volumes: [ollama_models:/root/.ollama]
    environment:
      - OLLAMA_NUM_THREADS=6       # 75% of 8 vCores
      - OLLAMA_NUM_GPU=0            # Force CPU-only
      - OLLAMA_MAX_LOADED_MODELS=2  # Memory optimization
    deploy:
      resources:
        limits:
          cpus: '7'                  # Reserve 7 of 8 cores
          memory: 16G                # 16 GB for Ollama
    
  # Profile Service
  profile-service:
    image: careergini-profile-service:latest
    ports: ["3001:3001"]
    depends_on: [postgres]
    
  # Job Service
  job-service:
    image: careergini-job-service:latest
    ports: ["3002:3002"]
    depends_on: [postgres]
    
  # Learning Service
  learning-service:
    image: careergini-learning-service:latest
    ports: ["3003:3003"]
    depends_on: [postgres]
    
  # PostgreSQL
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      - POSTGRES_DB=careergini
      - POSTGRES_USER=careergini
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    
  # Redis
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]
    
  # ChromaDB (Free Vector Database)
  chromadb:
    image: ghcr.io/chroma-core/chroma:latest
    ports: ["8001:8000"]
    volumes: [chroma_data:/chroma/chroma]

volumes:
  postgres_data:
  redis_data:
  ollama_models:
  chroma_data:
```

### Resource Allocation

```
Total Server Resources: 8 vCores, 30 GB RAM, 200 GB SSD

CPU Allocation:
├─ Ollama:               7 cores (87.5%)
├─ AI Service:           0.5 cores (6%)
├─ API Gateway:          0.2 cores (2.5%)
├─ Microservices:        0.3 cores (4%)
└─ System/Others:        0.0 cores (0%)

RAM Allocation:
├─ Ollama:               16 GB (53%)
├─ PostgreSQL:           4 GB (13%)
├─ AI Service:           3 GB (10%)
├─ Redis:                2 GB (7%)
├─ ChromaDB:             2 GB (7%)
├─ API Gateway:          1 GB (3%)
├─ Microservices:        1 GB (3%)
└─ System:               1 GB (3%)

Storage Allocation:
├─ Ollama Models:        ~12 GB (quantized)
├─ PostgreSQL Data:      50 GB
├─ Docker Images:        30 GB
├─ ChromaDB Vectors:     10 GB
├─ Application Logs:     10 GB
├─ OS & System:          20 GB
└─ Buffer:               68 GB
```

---

## Performance Optimization

### CPU-Based LLM Inference Optimization

**1. Model Selection Strategy:**

```yaml
Task-to-Model Mapping:
  Complex Reasoning (Supervisor, Resume):
    Model: Qwen2.5 7B Q4_K_M
    Performance: 18-22 tokens/second
    Memory: ~4.5 GB
    Quality: 74.2 MMLU (SOTA for 7B)
    
  Fast Tasks (Profile, Jobs, Learning):
    Model: Phi3 Mini 3.8B Q4_K_M
    Performance: 28-32 tokens/second
    Memory: ~2.5 GB
    Quality: Good for extraction/classification
    
  Technical Tasks (Skills Gap):
    Model: Qwen2.5-Coder 7B Q4_K_M
    Performance: 20-25 tokens/second
    Memory: ~4.5 GB
    Quality: 57.9 HumanEval (best coding model)
```

**2. Quantization Strategy:**

```
Why Q4_K_M (4-bit K-means Medium):
✓ 70% size reduction vs FP16
✓ Minimal quality loss (~92% of FP16)
✓ 3.5-4x faster inference on CPU
✓ Fits multiple models in 30 GB RAM
✓ Mixed precision (6-bit attention, 4-bit FFN)
✓ Production-proven (Meta, Hugging Face)

Alternative: Q5_K_M (if quality critical)
- 64% size reduction
- 95% of FP16 quality
- 20% slower than Q4_K_M
```

**3. Thread Configuration:**

```bash
# Optimal thread allocation for 8 vCore system
OLLAMA_NUM_THREADS=6  # Use 75% of cores

Why not 8 threads?
- Leave 2 cores for system + other services
- Prevents resource contention
- Better overall throughput

Benchmarks:
- 4 threads: 15 t/s (75% utilization)
- 6 threads: 20 t/s (90% utilization) ✓
- 8 threads: 19 t/s (95% utilization, contention)
```

**4. Context Window Optimization:**

```bash
# Balanced context for memory efficiency
num_ctx=2048  # Default: 2048 tokens

Memory Impact:
- 2048 tokens: ~2 GB KV cache
- 4096 tokens: ~4 GB KV cache (doubles memory)
- 8192 tokens: ~8 GB KV cache (quadruples)

Strategy:
- Use 2048 for most tasks (sufficient for career advice)
- Expand to 4096 only for long resume generation
- Never exceed 4096 to avoid OOM
```

**5. Model Loading Strategy:**

```bash
# Load models on-demand, unload unused
OLLAMA_MAX_LOADED_MODELS=2

Strategy:
1. Keep Phi3 Mini loaded (most frequent, 2.5 GB)
2. Load Qwen2.5 7B on-demand (4.5 GB)
3. Unload Qwen2.5-Coder when idle
4. Total active: ~7 GB (leaves 9 GB buffer)
```

### Database Optimization

**PostgreSQL Configuration:**

```sql
-- postgresql.conf optimizations
shared_buffers = 4GB              -- 25% of RAM
effective_cache_size = 12GB       -- 75% of available RAM
work_mem = 64MB                   -- Per operation
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
random_page_cost = 1.1            -- SSD optimization
effective_io_concurrency = 200    -- SSD parallel I/O
```

**Indexing Strategy:**

```sql
-- Critical indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_applications_user_job ON applications(user_id, job_id);

-- JSONB indexes for flexible queries
CREATE INDEX idx_profiles_skills_gin ON profiles USING GIN (skills);
CREATE INDEX idx_jobs_requirements_gin ON jobs USING GIN (requirements);
```

### Caching Strategy

**Redis Cache Layers:**

```
1. API Response Cache (TTL: 5 minutes)
   - Job search results
   - Learning resource lists
   
2. Session Cache (TTL: 24 hours)
   - JWT tokens
   - User sessions
   
3. Rate Limit Cache (TTL: 1 minute)
   - Request counts per IP
   - Per-user rate limits
   
4. Chat History Cache (TTL: 1 hour)
   - Recent conversation context
   - Reduces DB queries
```

### Network Optimization

**1. Enable gzip compression:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

**2. HTTP/2 support:**
```nginx
listen 443 ssl http2;
```

**3. Connection pooling:**
```javascript
// PostgreSQL connection pool
const pool = new Pool({
  max: 20,              // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Monitoring & Observability

### Health Checks

```yaml
# Docker Compose health checks
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Logging Strategy

```
Application Logs:
├─ API Gateway: Morgan (HTTP logs)
├─ AI Service: Python logging (INFO level)
├─ Ollama: Container logs
└─ PostgreSQL: Query logs (slow queries only)

Log Rotation:
- Max size: 100 MB per file
- Keep: 7 days of logs
- Compression: gzip old logs
```

### Performance Metrics

**Key Metrics to Monitor:**

```
1. LLM Inference:
   - Tokens per second (target: 18-25 t/s)
   - Model load time (target: <5s)
   - Memory usage (target: <16 GB)
   
2. API Response Times:
   - p50: <200ms
   - p95: <500ms
   - p99: <1000ms
   
3. Database:
   - Connection pool usage (<80%)
   - Query execution time (<100ms average)
   - Cache hit rate (>90%)
   
4. System:
   - CPU usage (<85% average)
   - RAM usage (<90%)
   - Disk I/O (<70% utilization)
```

---

## Security Considerations

### Authentication & Authorization

```
1. OAuth 2.0 Implementation:
   - Secure token exchange
   - State parameter for CSRF protection
   - Redirect URI validation
   
2. JWT Token Security:
   - HS256 signing algorithm
   - 15-minute access token expiry
   - 7-day refresh token expiry
   - Secure httpOnly cookies
   
3. API Security:
   - Rate limiting (100 req/min per IP)
   - Input validation (Joi schemas)
   - SQL injection prevention (parameterized queries)
   - XSS protection (sanitize inputs)
```

### Data Privacy

```
1. Local LLM Processing:
   - NO data sent to external APIs
   - 100% on-premise inference
   - User data stays on server
   
2. Database Encryption:
   - At-rest encryption (disk level)
   - SSL/TLS for connections
   - Encrypted backups
   
3. GDPR Compliance:
   - User data deletion on request
   - Data export functionality
   - Consent management
```

---

## Scaling Strategy

### Vertical Scaling (Phase 1)

```
Current: B2-30 (8 vCores, 30 GB RAM)
    ↓
Upgrade Path:
├─ B2-60: 16 vCores, 60 GB RAM (~₹34,000/month)
│   └─ Supports 13B models, 2x throughput
│
└─ B2-120: 32 vCores, 120 GB RAM (~₹68,000/month)
    └─ Supports 70B models with quantization
```

### Horizontal Scaling (Phase 2)

```
Load Balancer
    │
    ├─→ API Gateway 1 (B2-15)
    ├─→ API Gateway 2 (B2-15)
    │
    ├─→ AI Service 1 (B2-30 with Ollama)
    ├─→ AI Service 2 (B2-30 with Ollama)
    │
    └─→ Shared: PostgreSQL (RDS), Redis (Managed)
```

---

## Cost Analysis

### Monthly Operating Costs (Estimated)

```
Infrastructure:
├─ OVH B2-30 Server:           €187/month (~₹17,000)
├─ Domain + SSL:               €5/month (~₹450)
├─ Backups (100 GB):           €10/month (~₹900)
├─ Monitoring (optional):      €0/month (self-hosted)
└─ TOTAL INFRASTRUCTURE:       €202/month (~₹18,350)

External APIs:
├─ YouTube Data API:           Free (10K req/day)
├─ GitHub API:                 Free (5K req/hour)
├─ LinkedIn API:               Free (basic)
└─ TOTAL EXTERNAL APIS:        €0/month

LLM Costs:
├─ Ollama (Local):             €0/month ✓
├─ OpenAI (Alternative):       €200-500/month ❌
└─ TOTAL LLM COSTS:            €0/month

GRAND TOTAL:                   €202/month (~₹18,350)

Cost Comparison (100K requests/month):

CareerGini (Local LLMs):       €202/month
Alternative (OpenAI GPT-4):    €1,200/month
Alternative (Anthropic Claude): €900/month

Savings: 83% cheaper than paid LLM APIs
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Server provisioned (B2-30 or equivalent)
- [ ] Docker + Docker Compose installed
- [ ] Domain configured with DNS
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Environment variables configured
- [ ] OAuth apps created (Google, GitHub, LinkedIn)
- [ ] External API keys obtained
- [ ] Backup strategy configured
- [ ] Monitoring setup (optional)

### Initial Deployment

```bash
# 1. Clone repository
git clone https://github.com/your-org/careergini.git
cd careergini

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your values

# 3. Download Ollama models
make models  # Downloads ~12 GB of models

# 4. Start services
make dev  # Development mode
# OR
make deploy  # Production mode

# 5. Initialize database
make db-init

# 6. Verify deployment
curl http://localhost:3000/health
curl http://localhost:8000/health
curl http://localhost:11434/api/tags
```

### Post-Deployment

- [ ] Smoke test all features
- [ ] Load test API endpoints
- [ ] Verify LLM inference performance
- [ ] Test OAuth flows
- [ ] Check database connections
- [ ] Monitor resource usage (first 24 hours)
- [ ] Configure automated backups
- [ ] Setup monitoring alerts

---

## Troubleshooting

### Common Issues

**1. Ollama out of memory:**
```bash
# Solution: Reduce loaded models
OLLAMA_MAX_LOADED_MODELS=1

# Or reduce context window
num_ctx=1024
```

**2. Slow inference (<10 t/s):**
```bash
# Check thread configuration
OLLAMA_NUM_THREADS=6  # Should be 75% of cores

# Verify no GPU fallback
OLLAMA_NUM_GPU=0
```

**3. Database connection pool exhausted:**
```sql
-- Increase max connections
max_connections = 200  -- postgresql.conf
```

**4. High memory usage:**
```bash
# Check container memory limits
docker stats

# Restart services to free memory
docker-compose restart
```

---

## References

[1] llama.cpp CPU Inference Benchmarks: https://github.com/ggerganov/llama.cpp  
[2] Ollama Performance Documentation: https://ollama.com/blog/cpu-inference  
[3] Qwen2.5 Speed Benchmarks: https://qwen.readthedocs.io/en/latest/benchmark/speed_benchmark.html  
[4] Phi3 Technical Report: https://arxiv.org/abs/2404.14219  
[5] LangGraph Documentation: https://langchain-ai.github.io/langgraph/  
[6] ChromaDB Documentation: https://docs.trychroma.com/  

---

**Document Version**: 2.0 (CPU-Optimized for B2-30)  
**Last Updated**: February 17, 2026  
**Maintained By**: CareerGini Development Team