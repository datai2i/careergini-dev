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

```
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
    
  # PostgreSQL
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    
  # Redis
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]
    
  # ChromaDB
  chromadb:
    image: ghcr.io/chroma-core/chroma:latest
    ports: ["8001:8000"]
    volumes: [chroma_data:/chroma/chroma]
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
```

---

## Performance Optimization

### CPU-Based LLM Inference Optimization

**1. Model Selection Strategy:**

```
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
```

---

## Cost Analysis

### Monthly Operating Costs (Estimated)

```
Infrastructure:
├─ OVH B2-30 Server:           €187/month (~₹17,000)
├─ Domain + SSL:               €5/month (~₹450)
├─ Backups (100 GB):           €10/month (~₹900)
└─ TOTAL INFRASTRUCTURE:       €202/month (~₹18,350)

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

**Document Version**: 2.0 (CPU-Optimized for B2-30)  
**Last Updated**: February 17, 2026  
**Maintained By**: CareerGini Development Team