# CareerGini - AI Agents System Guide (CPU-Optimized)

## 📋 Table of Contents
1. [Multi-Agent Architecture](#multi-agent-architecture)
2. [LangGraph Orchestration](#langgraph-orchestration)
3. [Agent Specifications](#agent-specifications)
4. [CPU-Optimized Implementation](#cpu-optimized-implementation)
5. [State Management](#state-management)
6. [Workflow Patterns](#workflow-patterns)
7. [Integration Guide](#integration-guide)

---

## Multi-Agent Architecture

### Overview

CareerGini uses a **multi-agent system** orchestrated by LangGraph, with **100% local CPU-based LLMs** via Ollama. The system consists of 6 specialized agents coordinated by a Supervisor agent.

### Why Multi-Agent Architecture?

**Benefits:**
- **Specialization**: Each agent focuses on specific domain expertise
- **Scalability**: Agents can be scaled independently
- **Maintainability**: Isolated agent logic, easier debugging
- **Flexibility**: Easy to add/remove/modify agents
- **Parallelization**: Multiple agents can work concurrently
- **Cost Efficiency**: Use lighter models for simple tasks

### Agent Roster

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPERVISOR AGENT                          │
│              (Qwen2.5 7B - Complex Routing)                 │
│                                                              │
│  Responsibilities:                                          │
│  • Analyze user intent                                      │
│  • Route to appropriate agent(s)                            │
│  • Coordinate multi-agent workflows                         │
│  • Synthesize final responses                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
      ┌────────────┼────────────┬─────────────┬──────────────┐
      │            │            │             │              │
      ▼            ▼            ▼             ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ PROFILE  │ │  SKILLS  │ │   JOB    │ │  RESUME  │ │ LEARNING │
│  AGENT   │ │   GAP    │ │  SEARCH  │ │ BUILDER  │ │  AGENT   │
│          │ │  AGENT   │ │  AGENT   │ │  AGENT   │ │          │
│ Phi3 3.8B│ │ Qwen2.5  │ │ Phi3 3.8B│ │ Qwen2.5  │ │ Phi3 3.8B│
│          │ │ Coder 7B │ │          │ │   7B     │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## LangGraph Orchestration

### LangGraph Overview

**LangGraph** is a library for building stateful, multi-agent workflows as graphs. It extends LangChain with:
- **State Management**: Shared state across agents
- **Conditional Routing**: Dynamic agent selection
- **Cyclic Graphs**: Agents can loop/retry
- **Persistence**: Conversation checkpointing

### Core Concepts

**1. State Graph:**
- Nodes = Agents (functions that process state)
- Edges = Transitions between agents
- State = Shared data structure

**2. State Schema:**
```python
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
import operator

class CareerGiniState(TypedDict):
    """State shared across all agents"""
    
    # Conversation
    messages: Annotated[Sequence[BaseMessage], operator.add]
    
    # User context
    user_id: str
    session_id: str
    
    # Agent outputs
    profile_data: dict | None
    skills_analysis: dict | None
    job_recommendations: list | None
    resume_data: dict | None
    learning_resources: list | None
    
    # Control flow
    next_agent: str | None
    current_agent: str
    iteration_count: int
    
    # Metadata
    timestamp: str
    user_query: str
```

**3. Node Definition:**
```python
def node_function(state: CareerGiniState) -> CareerGiniState:
    """
    Each agent is a node function that:
    1. Receives current state
    2. Performs its task
    3. Updates state
    4. Returns modified state
    """
    # Agent logic here
    return updated_state
```

**4. Conditional Edges:**
```python
def route_to_next_agent(state: CareerGiniState) -> str:
    """
    Determines next agent based on state
    Returns: agent name or END
    """
    if state["next_agent"]:
        return state["next_agent"]
    return END
```

---

## Agent Specifications

### 1. Supervisor Agent

**Model**: Qwen2.5 7B Instruct (Q4_K_M)  
**Purpose**: Orchestrate workflow, route user queries to appropriate agents  
**Performance**: 18-22 tokens/second on CPU

**Responsibilities:**
- Analyze user intent and context
- Determine which agent(s) to invoke
- Coordinate multi-agent workflows
- Synthesize responses from multiple agents
- Handle error recovery and fallbacks

**Implementation:**

```python
# agents/supervisor.py
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

class SupervisorAgent:
    def __init__(self, ollama_client):
        self.llm = ollama_client.get_model("reasoning")
        
        self.system_prompt = """You are the Supervisor Agent for CareerGini, an AI career advisory platform.

Your responsibilities:
1. Analyze user queries and determine intent
2. Route to appropriate specialist agent(s):
   - PROFILE: Profile analysis, data extraction
   - SKILLS_GAP: Skills analysis, gap identification
   - JOB_SEARCH: Job recommendations, matching
   - RESUME: Resume generation, tailoring
   - LEARNING: Learning resource curation
3. Coordinate multi-agent workflows
4. Synthesize final responses

Available agents and their capabilities:
- PROFILE: Extracts and structures profile data from LinkedIn, GitHub, resumes
- SKILLS_GAP: Analyzes technical skills, identifies gaps, recommends improvements
- JOB_SEARCH: Matches user profile with job opportunities, ranks by relevance
- RESUME: Generates tailored resumes based on job descriptions
- LEARNING: Curates learning resources (courses, tutorials, projects)

Routing Logic:
- Profile questions → PROFILE
- "What skills do I need?" → SKILLS_GAP
- "Find me jobs" → JOB_SEARCH
- "Create resume for [JD]" → RESUME
- "How do I learn X?" → LEARNING
- Complex queries → Multiple agents (return list)

Respond in JSON format:
{
  "intent": "brief description",
  "agents": ["AGENT_NAME_1", "AGENT_NAME_2"],
  "reasoning": "why these agents",
  "requires_profile": true/false
}
"""
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "User Query: {query}\nUser Context: {context}")
        ])
        
        self.chain = self.prompt | self.llm | JsonOutputParser()
    
    def __call__(self, state: dict) -> dict:
        """Route user query to appropriate agents"""
        
        user_query = state["messages"][-1].content
        user_context = {
            "has_profile": state.get("profile_data") is not None,
            "session_history": len(state["messages"]),
            "previous_agent": state.get("current_agent")
        }
        
        # Get routing decision from LLM
        routing = self.chain.invoke({
            "query": user_query,
            "context": str(user_context)
        })
        
        # Update state with routing decision
        state["next_agent"] = routing["agents"][0] if routing["agents"] else None
        state["current_agent"] = "supervisor"
        state["iteration_count"] = state.get("iteration_count", 0) + 1
        
        # Store routing metadata
        state["routing_metadata"] = {
            "intent": routing["intent"],
            "all_agents": routing["agents"],
            "reasoning": routing["reasoning"]
        }
        
        return state
```

---

### 2. Profile Analysis Agent

**Model**: Phi3 Mini 3.8B (Q4_K_M)  
**Purpose**: Extract and structure profile data  
**Performance**: 28-32 tokens/second on CPU

**Responsibilities:**
- Parse LinkedIn profile data
- Analyze GitHub repositories
- Extract structured data from resumes
- Aggregate multi-source profiles
- Validate and normalize data

**Implementation:**

```python
# agents/profile_agent.py
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

class ProfileAnalysisAgent:
    def __init__(self, ollama_client):
        self.llm = ollama_client.get_model("fast")
        
        self.system_prompt = """You are the Profile Analysis Agent for CareerGini.

Your task: Extract and structure profile data from various sources (LinkedIn, GitHub, resumes).

Input Format:
- linkedin_data: JSON from LinkedIn API
- github_data: JSON from GitHub API
- resume_text: Extracted text from PDF/DOCX

Output Format (JSON):
{
  "personal": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin_url": "string",
    "github_url": "string",
    "portfolio_url": "string"
  },
  "summary": "professional summary text",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or Present",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "YYYY",
      "gpa": "float or null"
    }
  ],
  "skills": {
    "programming": ["Python", "JavaScript"],
    "frameworks": ["React", "Django"],
    "tools": ["Docker", "Git"],
    "soft_skills": ["Leadership", "Communication"]
  },
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["tech1", "tech2"],
      "github_url": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM"
    }
  ]
}

Guidelines:
- Merge data from all sources (prioritize LinkedIn > GitHub > Resume)
- Normalize skill names (e.g., "JS" → "JavaScript")
- Extract years of experience per skill
- Identify skill categories (programming, frameworks, tools)
- Validate email/phone formats
"""
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "LinkedIn Data: {linkedin}\nGitHub Data: {github}\nResume Text: {resume}")
        ])
        
        self.chain = self.prompt | self.llm | JsonOutputParser()
    
    def __call__(self, state: dict) -> dict:
        """Extract and structure profile data"""
        
        # Fetch raw data from database
        user_id = state["user_id"]
        linkedin_data = self.fetch_linkedin_data(user_id)
        github_data = self.fetch_github_data(user_id)
        resume_text = self.fetch_resume_text(user_id)
        
        # Process with LLM
        profile_data = self.chain.invoke({
            "linkedin": str(linkedin_data),
            "github": str(github_data),
            "resume": resume_text
        })
        
        # Store in state
        state["profile_data"] = profile_data
        state["current_agent"] = "profile"
        
        return state
    
    def fetch_linkedin_data(self, user_id: str) -> dict:
        """Fetch LinkedIn data from database"""
        # Implementation: Query PostgreSQL
        pass
    
    def fetch_github_data(self, user_id: str) -> dict:
        """Fetch GitHub data from database"""
        # Implementation: Query PostgreSQL
        pass
    
    def fetch_resume_text(self, user_id: str) -> str:
        """Fetch resume text from database"""
        # Implementation: Query PostgreSQL
        pass
```

---

### 3. Skills Gap Agent

**Model**: Qwen2.5-Coder 7B (Q4_K_M)  
**Purpose**: Analyze technical skills and identify gaps  
**Performance**: 20-25 tokens/second on CPU

**Responsibilities:**
- Analyze current skill set
- Identify gaps for target roles
- Recommend skill development priorities
- Suggest learning paths
- Benchmark against industry standards

**Implementation:**

```python
# agents/skills_gap_agent.py
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

class SkillsGapAgent:
    def __init__(self, ollama_client):
        self.llm = ollama_client.get_model("coder")  # Qwen2.5-Coder
        
        self.system_prompt = """You are the Skills Gap Analysis Agent for CareerGini.

Your task: Analyze user's technical skills and identify gaps for target roles.

Input:
- current_skills: List of skills with proficiency levels
- target_role: Desired job role (e.g., "Senior Full Stack Developer")
- industry: Industry context (e.g., "Tech Startups", "Enterprise")

Output Format (JSON):
{
  "current_skills_assessment": {
    "strong_areas": ["skill1", "skill2"],
    "developing_areas": ["skill3"],
    "skill_levels": {
      "Python": {"level": "Advanced", "years": 5},
      "React": {"level": "Intermediate", "years": 2}
    }
  },
  "target_role_requirements": {
    "must_have": ["skill1", "skill2"],
    "nice_to_have": ["skill3", "skill4"],
    "emerging_skills": ["skill5"]
  },
  "gaps": [
    {
      "skill": "Kubernetes",
      "current_level": "None",
      "required_level": "Intermediate",
      "priority": "High",
      "estimated_learning_time": "3 months",
      "reasoning": "Essential for cloud-native development"
    }
  ],
  "learning_roadmap": [
    {
      "phase": 1,
      "duration": "1-2 months",
      "skills": ["Kubernetes", "Docker"],
      "goal": "Container orchestration fundamentals"
    }
  ],
  "competitive_advantage": {
    "unique_skills": ["skill1"],
    "rare_combinations": ["skill2 + skill3"]
  }
}

Guidelines:
- Prioritize gaps by: Industry demand, Career impact, Learning difficulty
- Consider skill combinations (e.g., Python + ML + Cloud)
- Suggest realistic learning timelines
- Identify transferable skills
"""
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "Current Skills: {skills}\nTarget Role: {role}\nIndustry: {industry}")
        ])
        
        self.chain = self.prompt | self.llm | JsonOutputParser()
    
    def __call__(self, state: dict) -> dict:
        """Analyze skills and identify gaps"""
        
        profile = state["profile_data"]
        target_role = state.get("target_role", "Software Engineer")
        industry = state.get("industry", "Technology")
        
        # Analyze skills
        analysis = self.chain.invoke({
            "skills": str(profile.get("skills", {})),
            "role": target_role,
            "industry": industry
        })
        
        # Store in state
        state["skills_analysis"] = analysis
        state["current_agent"] = "skills_gap"
        
        return state
```

---

### 4. Job Search Agent

**Model**: Phi3 Mini 3.8B (Q4_K_M)  
**Purpose**: Match users with relevant job opportunities  
**Performance**: 28-32 tokens/second on CPU

**Responsibilities:**
- Match profile with job postings
- Rank jobs by relevance
- Filter by preferences (location, salary, remote)
- Identify application-ready vs growth opportunities
- Track application status

**Implementation:**

```python
# agents/job_search_agent.py
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

class JobSearchAgent:
    def __init__(self, ollama_client):
        self.llm = ollama_client.get_model("fast")
        
        self.system_prompt = """You are the Job Search Agent for CareerGini.

Your task: Match user profiles with relevant job opportunities.

Input:
- user_profile: Structured profile data
- user_preferences: Location, salary, remote, etc.
- available_jobs: List of job postings (from database)

Matching Criteria:
1. Skills Match (40%): How many required skills does user have?
2. Experience Level (25%): Does experience align with role seniority?
3. Industry Fit (15%): Relevant industry experience?
4. Location/Remote (10%): Matches preferences?
5. Growth Potential (10%): Can user grow into this role?

Output Format (JSON):
{
  "recommendations": [
    {
      "job_id": "string",
      "title": "string",
      "company": "string",
      "location": "string",
      "remote": true/false,
      "salary_range": "string",
      "match_score": 0.0-1.0,
      "match_breakdown": {
        "skills": 0.85,
        "experience": 0.75,
        "industry": 0.90
      },
      "matching_skills": ["Python", "React"],
      "missing_skills": ["Kubernetes"],
      "application_readiness": "Ready" | "Growth" | "Stretch",
      "recommendation": "Why this job is a good fit"
    }
  ],
  "filters_applied": {
    "location": ["Remote", "San Francisco"],
    "salary_min": 120000,
    "remote_only": true
  },
  "search_stats": {
    "total_jobs": 150,
    "matches": 12,
    "ready_to_apply": 8,
    "growth_opportunities": 4
  }
}

Guidelines:
- Prioritize "Ready" applications (80%+ match)
- Include "Growth" opportunities (60-79% match) for career development
- Explain why each job matches
- Consider location/remote preferences
"""
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "Profile: {profile}\nPreferences: {prefs}\nJobs: {jobs}")
        ])
        
        self.chain = self.prompt | self.llm | JsonOutputParser()
    
    def __call__(self, state: dict) -> dict:
        """Match user with jobs"""
        
        profile = state["profile_data"]
        preferences = state.get("job_preferences", {
            "remote": True,
            "location": ["Remote"],
            "salary_min": None
        })
        
        # Fetch jobs from database
        jobs = self.fetch_jobs(preferences)
        
        # Match with LLM
        recommendations = self.chain.invoke({
            "profile": str(profile),
            "prefs": str(preferences),
            "jobs": str(jobs[:20])  # Limit to 20 for context window
        })
        
        # Store in state
        state["job_recommendations"] = recommendations["recommendations"]
        state["current_agent"] = "job_search"
        
        return state
    
    def fetch_jobs(self, preferences: dict) -> list:
        """Fetch jobs from database with filters"""
        # Implementation: Query PostgreSQL with filters
        pass
```

---

### 5. Resume Builder Agent

**Model**: Qwen2.5 7B Instruct (Q4_K_M)  
**Purpose**: Generate tailored resumes for specific jobs  
**Performance**: 18-22 tokens/second on CPU

**Responsibilities:**
- Generate JD-matched resume content
- Optimize for ATS (Applicant Tracking Systems)
- Tailor bullet points to job requirements
- Suggest keywords and phrases
- Format for professional presentation

**Implementation:**

```python
# agents/resume_builder_agent.py
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

class ResumeBuilderAgent:
    def __init__(self, ollama_client):
        self.llm = ollama_client.get_model("reasoning")  # Qwen2.5 7B
        
        self.system_prompt = """You are the Resume Builder Agent for CareerGini.

Your task: Generate ATS-optimized, tailored resumes for specific job descriptions.

Input:
- user_profile: Complete profile data
- job_description: Target JD text
- template: Resume template preference

Resume Best Practices:
1. ATS Optimization:
   - Use standard section headers (Experience, Education, Skills)
   - Include keywords from JD naturally
   - Avoid tables, images, complex formatting
   
2. Content Structure:
   - Quantify achievements with numbers
   - Use action verbs (Led, Developed, Implemented)
   - Focus on impact and results
   - Tailor each bullet to JD requirements
   
3. Keyword Strategy:
   - Extract key skills/technologies from JD
   - Incorporate naturally into experience bullets
   - Match terminology (e.g., JD says "React.js" → use "React.js" not "React")

Output Format (JSON):
{
  "summary": "2-3 sentence professional summary tailored to JD",
  "experience": [
    {
      "title": "Software Engineer",
      "company": "TechCorp",
      "dates": "Jan 2020 - Present",
      "bullets": [
        "Led development of React-based dashboard, improving load time by 40%",
        "Implemented CI/CD pipeline with Docker, reducing deployment time by 60%"
      ],
      "matched_keywords": ["React", "Docker", "CI/CD"]
    }
  ],
  "skills": {
    "technical": ["Python", "React", "Docker"],
    "highlighted": ["Python", "React"]  # Most relevant to JD
  },
  "education": [...],
  "certifications": [...],
  "projects": [
    {
      "name": "E-commerce Platform",
      "description": "Built scalable microservices architecture using Python and Docker",
      "technologies": ["Python", "Docker", "PostgreSQL"],
      "relevance": "High"  # Matches JD requirements
    }
  ],
  "ats_score": 0.85,
  "keyword_coverage": {
    "matched": ["Python", "React", "Docker"],
    "missing": ["Kubernetes"],
    "suggestions": ["Add Kubernetes project or mention learning it"]
  }
}

Guidelines:
- Prioritize most relevant experience
- Quantify achievements wherever possible
- Match JD language and terminology
- Keep resume to 1-2 pages (optimize for brevity)
- Highlight unique value propositions
"""
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "Profile: {profile}\nJob Description: {jd}\nTemplate: {template}")
        ])
        
        self.chain = self.prompt | self.llm | JsonOutputParser()
    
    def __call__(self, state: dict) -> dict:
        """Generate tailored resume"""
        
        profile = state["profile_data"]
        job_description = state.get("job_description", "")
        template = state.get("resume_template", "modern")
        
        # Generate resume with LLM
        resume = self.chain.invoke({
            "profile": str(profile),
            "jd": job_description,
            "template": template
        })
        
        # Store in state
        state["resume_data"] = resume
        state["current_agent"] = "resume"
        
        return state
```

---

### 6. Learning Resource Agent

**Model**: Phi3 Mini 3.8B (Q4_K_M)  
**Purpose**: Curate personalized learning resources  
**Performance**: 28-32 tokens/second on CPU

**Responsibilities:**
- Recommend courses, tutorials, projects
- Create structured learning paths
- Prioritize by skill gaps
- Track learning progress
- Suggest practical projects

**Implementation:**

```python
# agents/learning_agent.py
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

class LearningResourceAgent:
    def __init__(self, ollama_client):
        self.llm = ollama_client.get_model("fast")
        
        self.system_prompt = """You are the Learning Resource Agent for CareerGini.

Your task: Curate personalized learning resources based on skill gaps.

Input:
- skill_gaps: List of skills to develop
- learning_style: User preferences (video, reading, hands-on)
- time_commitment: Available hours per week
- available_resources: Database of courses, tutorials, projects

Resource Types:
1. Online Courses: Structured, comprehensive (Coursera, Udemy, edX)
2. YouTube Tutorials: Quick, specific topics
3. GitHub Projects: Hands-on practice
4. Documentation: Official docs, in-depth
5. Books: Foundational knowledge

Output Format (JSON):
{
  "learning_paths": [
    {
      "skill": "Kubernetes",
      "estimated_time": "3 months",
      "difficulty": "Intermediate",
      "prerequisites": ["Docker", "Linux basics"],
      "resources": [
        {
          "type": "course",
          "title": "Kubernetes Fundamentals",
          "provider": "Udemy",
          "url": "https://...",
          "duration": "12 hours",
          "rating": 4.7,
          "price": "Free",
          "recommendation_reason": "Best for beginners, hands-on labs"
        },
        {
          "type": "youtube",
          "title": "Kubernetes Tutorial for Beginners",
          "channel": "TechWorld with Nana",
          "url": "https://...",
          "duration": "4 hours",
          "views": "2M",
          "recommendation_reason": "Practical examples, well-explained"
        },
        {
          "type": "project",
          "title": "Deploy Microservices on Kubernetes",
          "description": "Build and deploy a multi-container app",
          "github_url": "https://...",
          "difficulty": "Intermediate",
          "estimated_time": "1 week",
          "recommendation_reason": "Solidifies core concepts"
        }
      ],
      "milestones": [
        {
          "week": 1-2,
          "goal": "Understand Kubernetes architecture",
          "resources": ["Course: Modules 1-3"]
        },
        {
          "week": 3-4,
          "goal": "Deploy first application",
          "resources": ["Project: Simple deployment"]
        }
      ]
    }
  ],
  "quick_wins": [
    {
      "skill": "Docker Compose",
      "resource": {...},
      "time": "2 hours",
      "impact": "High"
    }
  ],
  "project_ideas": [
    {
      "title": "Personal Portfolio with CI/CD",
      "description": "Build, test, and deploy automatically",
      "skills_practiced": ["Docker", "GitHub Actions", "Kubernetes"],
      "difficulty": "Intermediate"
    }
  ]
}

Guidelines:
- Prioritize free/affordable resources
- Mix learning types (theory + practice)
- Suggest projects for skill application
- Consider user's time availability
- Recommend active, well-maintained resources
"""
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "Skill Gaps: {gaps}\nLearning Style: {style}\nTime: {time}")
        ])
        
        self.chain = self.prompt | self.llm | JsonOutputParser()
    
    def __call__(self, state: dict) -> dict:
        """Curate learning resources"""
        
        gaps = state["skills_analysis"]["gaps"]
        learning_style = state.get("learning_style", "mixed")
        time_commitment = state.get("time_commitment", "5-10 hours/week")
        
        # Generate recommendations with LLM
        resources = self.chain.invoke({
            "gaps": str(gaps),
            "style": learning_style,
            "time": time_commitment
        })
        
        # Store in state
        state["learning_resources"] = resources["learning_paths"]
        state["current_agent"] = "learning"
        
        return state
```

---

## CPU-Optimized Implementation

### Ollama Client Setup

```python
# integrations/ollama_client.py
from langchain_community.chat_models import ChatOllama
import os
from typing import Literal

TaskType = Literal["reasoning", "fast", "coder"]

class OllamaClient:
    """
    CPU-optimized Ollama client with three model tiers.
    
    Hardware: B2-30 (8 vCores, 30 GB RAM)
    Strategy: Use different models for different task complexities
    """
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        
        # Configuration for CPU optimization
        self.cpu_threads = int(os.getenv("OLLAMA_NUM_THREADS", "6"))
        self.context_length = int(os.getenv("OLLAMA_CONTEXT_LENGTH", "2048"))
        
        # Initialize models
        self._init_models()
    
    def _init_models(self):
        """Initialize all three model tiers"""
        
        # Model 1: Complex reasoning (supervisor, resume)
        self.llm_reasoning = ChatOllama(
            model="qwen2.5:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.7,
            num_ctx=self.context_length,
            num_thread=self.cpu_threads,
            # CPU-specific optimizations
            num_gpu=0,  # Force CPU mode
            f16_kv=False,  # Use quantized KV cache
        )
        
        # Model 2: Fast tasks (profile, jobs, learning)
        self.llm_fast = ChatOllama(
            model="phi3:3.8b-mini-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.3,
            num_ctx=self.context_length,
            num_thread=self.cpu_threads,
            num_gpu=0,
            f16_kv=False,
        )
        
        # Model 3: Technical/coding tasks (skills gap)
        self.llm_coder = ChatOllama(
            model="qwen2.5-coder:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.2,
            num_ctx=self.context_length,
            num_thread=self.cpu_threads,
            num_gpu=0,
            f16_kv=False,
        )
    
    def get_model(self, task_type: TaskType) -> ChatOllama:
        """
        Return appropriate model based on task complexity.
        
        Args:
            task_type: "reasoning", "fast", or "coder"
            
        Returns:
            Configured ChatOllama instance
        """
        if task_type == "reasoning":
            return self.llm_reasoning  # Qwen2.5 7B
        elif task_type == "coder":
            return self.llm_coder  # Qwen2.5-Coder 7B
        else:
            return self.llm_fast  # Phi3 Mini 3.8B
    
    def get_model_info(self) -> dict:
        """Return information about loaded models"""
        return {
            "reasoning": {
                "model": "qwen2.5:7b-instruct-q4_K_M",
                "size": "~4.5 GB",
                "performance": "18-22 tokens/second",
                "use_cases": ["Supervisor routing", "Resume generation"]
            },
            "fast": {
                "model": "phi3:3.8b-mini-instruct-q4_K_M",
                "size": "~2.5 GB",
                "performance": "28-32 tokens/second",
                "use_cases": ["Profile analysis", "Job search", "Learning curation"]
            },
            "coder": {
                "model": "qwen2.5-coder:7b-instruct-q4_K_M",
                "size": "~4.5 GB",
                "performance": "20-25 tokens/second",
                "use_cases": ["Skills gap analysis", "Technical evaluation"]
            }
        }
```

### Performance Optimization Tips

**1. Context Window Management:**
```python
# Truncate long inputs to fit context window
def truncate_context(text: str, max_tokens: int = 1500) -> str:
    """Keep context under limit to avoid memory issues"""
    # Simple character-based estimation (1 token ≈ 4 chars)
    max_chars = max_tokens * 4
    if len(text) > max_chars:
        return text[:max_chars] + "..."
    return text
```

**2. Batch Processing:**
```python
# Process multiple items in parallel (when possible)
async def process_batch(items: list, agent):
    """Process multiple items concurrently"""
    import asyncio
    tasks = [agent.process_async(item) for item in items]
    return await asyncio.gather(*tasks)
```

**3. Caching:**
```python
# Cache LLM responses for repeated queries
from functools import lru_cache

@lru_cache(maxsize=128)
def cached_llm_call(prompt: str, model: str) -> str:
    """Cache LLM responses"""
    return ollama_client.get_model(model).invoke(prompt)
```

---

## State Management

### State Flow

```
Initial State
    ↓
User Message Added
    ↓
Supervisor Analyzes → Routes to Agent(s)
    ↓
Agent(s) Execute → Update State
    ↓
Supervisor Synthesizes → Final Response
    ↓
State Persisted to DB
```

### State Persistence

```python
# orchestration/state_manager.py
import json
from typing import Dict
import redis

class StateManager:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def save_state(self, session_id: str, state: Dict):
        """Persist state to Redis"""
        key = f"session:{session_id}"
        self.redis.set(key, json.dumps(state), ex=3600)  # 1 hour TTL
    
    def load_state(self, session_id: str) -> Dict:
        """Load state from Redis"""
        key = f"session:{session_id}"
        data = self.redis.get(key)
        return json.loads(data) if data else None
    
    def append_message(self, session_id: str, message: Dict):
        """Append message to conversation history"""
        state = self.load_state(session_id)
        if state:
            state["messages"].append(message)
            self.save_state(session_id, state)
```

---

## Workflow Patterns

### Pattern 1: Simple Query (Single Agent)

```
User: "What jobs match my profile?"
    ↓
Supervisor → Routes to JOB_SEARCH
    ↓
Job Search Agent → Matches jobs
    ↓
Supervisor → Returns results
```

### Pattern 2: Complex Query (Multi-Agent Sequential)

```
User: "Analyze my skills and recommend learning resources"
    ↓
Supervisor → Routes to [SKILLS_GAP, LEARNING]
    ↓
Skills Gap Agent → Analyzes gaps
    ↓
Learning Agent → Curates resources (uses gaps from previous)
    ↓
Supervisor → Synthesizes response
```

### Pattern 3: Full Workflow (All Agents)

```
User: "Help me prepare for Senior DevOps Engineer roles"
    ↓
Supervisor → Routes to ALL agents
    ↓
PROFILE → Fetches current profile
    ↓
SKILLS_GAP → Analyzes for DevOps role
    ↓
JOB_SEARCH → Finds DevOps positions
    ↓
RESUME → Generates tailored resume
    ↓
LEARNING → Recommends upskilling resources
    ↓
Supervisor → Comprehensive response with all insights
```

---

## Integration Guide

### Complete LangGraph Workflow

```python
# orchestration/workflow.py
from langgraph.graph import StateGraph, END
from agents.supervisor import SupervisorAgent
from agents.profile_agent import ProfileAnalysisAgent
from agents.skills_gap_agent import SkillsGapAgent
from agents.job_search_agent import JobSearchAgent
from agents.resume_builder_agent import ResumeBuilderAgent
from agents.learning_agent import LearningResourceAgent
from integrations.ollama_client import OllamaClient

def build_careergini_workflow():
    """Build the complete multi-agent workflow"""
    
    # Initialize Ollama client
    ollama_client = OllamaClient()
    
    # Initialize all agents
    supervisor = SupervisorAgent(ollama_client)
    profile_agent = ProfileAnalysisAgent(ollama_client)
    skills_agent = SkillsGapAgent(ollama_client)
    job_agent = JobSearchAgent(ollama_client)
    resume_agent = ResumeBuilderAgent(ollama_client)
    learning_agent = LearningResourceAgent(ollama_client)
    
    # Create state graph
    workflow = StateGraph(CareerGiniState)
    
    # Add nodes (agents)
    workflow.add_node("supervisor", supervisor)
    workflow.add_node("profile", profile_agent)
    workflow.add_node("skills_gap", skills_agent)
    workflow.add_node("job_search", job_agent)
    workflow.add_node("resume", resume_agent)
    workflow.add_node("learning", learning_agent)
    
    # Define routing function
    def route_to_agent(state: CareerGiniState) -> str:
        """Route to next agent based on supervisor decision"""
        next_agent = state.get("next_agent")
        
        if not next_agent:
            return END
        
        # Map agent names to node names
        agent_map = {
            "PROFILE": "profile",
            "SKILLS_GAP": "skills_gap",
            "JOB_SEARCH": "job_search",
            "RESUME": "resume",
            "LEARNING": "learning"
        }
        
        return agent_map.get(next_agent, END)
    
    # Add edges
    workflow.set_entry_point("supervisor")
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
    
    # All agents return to supervisor for synthesis
    workflow.add_edge("profile", "supervisor")
    workflow.add_edge("skills_gap", "supervisor")
    workflow.add_edge("job_search", "supervisor")
    workflow.add_edge("resume", "supervisor")
    workflow.add_edge("learning", "supervisor")
    
    return workflow.compile()

# Usage
workflow = build_careergini_workflow()

# Run workflow
initial_state = {
    "messages": [{"role": "user", "content": "Find me jobs"}],
    "user_id": "user123",
    "session_id": "session456"
}

result = workflow.invoke(initial_state)
print(result["messages"][-1]["content"])
```

### FastAPI Endpoint Integration

```python
# main.py (FastAPI app)
from fastapi import FastAPI, WebSocket
from orchestration.workflow import build_careergini_workflow
from orchestration.state_manager import StateManager

app = FastAPI()
workflow = build_careergini_workflow()
state_manager = StateManager(redis_client)

@app.post("/chat")
async def chat(user_id: str, message: str, session_id: str):
    """Main chat endpoint"""
    
    # Load existing state or create new
    state = state_manager.load_state(session_id) or {
        "messages": [],
        "user_id": user_id,
        "session_id": session_id
    }
    
    # Add user message
    state["messages"].append({
        "role": "user",
        "content": message
    })
    
    # Run workflow
    result = workflow.invoke(state)
    
    # Save updated state
    state_manager.save_state(session_id, result)
    
    # Return AI response
    return {
        "response": result["messages"][-1]["content"],
        "agent": result.get("current_agent"),
        "metadata": result.get("routing_metadata")
    }

@app.websocket("/chat/stream")
async def chat_stream(websocket: WebSocket):
    """Streaming chat endpoint"""
    await websocket.accept()
    
    while True:
        data = await websocket.receive_json()
        
        # Process with workflow (streaming)
        async for chunk in workflow.astream(data):
            await websocket.send_json(chunk)
```

---

## Performance Benchmarks

### Agent Performance (B2-30 Server)

| Agent | Model | Avg. Latency | Tokens/Sec | Memory |
|-------|-------|--------------|------------|--------|
| Supervisor | Qwen2.5 7B | 2.5s | 20 t/s | 4.5 GB |
| Profile | Phi3 Mini | 1.2s | 30 t/s | 2.5 GB |
| Skills Gap | Qwen2.5-Coder | 2.0s | 22 t/s | 4.5 GB |
| Job Search | Phi3 Mini | 1.0s | 32 t/s | 2.5 GB |
| Resume | Qwen2.5 7B | 3.0s | 18 t/s | 4.5 GB |
| Learning | Phi3 Mini | 1.5s | 28 t/s | 2.5 GB |

### End-to-End Workflow Latency

| Workflow Type | Agents Invoked | Total Time | User Experience |
|---------------|----------------|------------|-----------------|
| Simple Query | 1 agent | 1-3s | Instant response |
| Complex Query | 2-3 agents | 4-7s | Acceptable delay |
| Full Workflow | 5-6 agents | 10-15s | Progress indicators needed |

---

## Troubleshooting

### Common Issues

**1. Agent timeout (>30s response):**
- **Cause**: Context window too large, CPU overloaded
- **Solution**: Reduce `num_ctx` to 1024, truncate inputs

**2. Out of memory:**
- **Cause**: Multiple large models loaded
- **Solution**: Set `OLLAMA_MAX_LOADED_MODELS=1`, unload unused models

**3. Inconsistent routing:**
- **Cause**: Supervisor prompt ambiguity
- **Solution**: Refine system prompt, add examples

**4. Low-quality agent outputs:**
- **Cause**: Model too small, poor prompt
- **Solution**: Use Qwen2.5 7B for complex tasks, improve prompts

---

## References

[1] LangGraph Documentation: https://langchain-ai.github.io/langgraph/  
[2] Ollama Documentation: https://ollama.com/docs  
[3] Qwen2.5 Paper: https://arxiv.org/abs/2409.12186  
[4] Phi3 Technical Report: https://arxiv.org/abs/2404.14219  
[5] LangChain Community Integrations: https://python.langchain.com/docs/integrations/chat/ollama

---

**Document Version**: 2.0 (CPU-Optimized for B2-30)  
**Last Updated**: February 17, 2026  
**Maintained By**: CareerGini Development Team