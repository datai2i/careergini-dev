# CareerGini - AI Agents Implementation Guide

## 📋 Table of Contents
1. [Multi-Agent Architecture](#multi-agent-architecture)
2. [LangGraph Workflow](#langgraph-workflow)
3. [Agent Implementations](#agent-implementations)
4. [State Management](#state-management)
5. [Routing Logic](#routing-logic)
6. [Integration with Ollama](#integration-with-ollama)
7. [Testing & Debugging](#testing--debugging)

---

## Multi-Agent Architecture

CareerGini uses **LangGraph** to orchestrate 6 specialized AI agents that collaborate to provide comprehensive career guidance. Each agent is optimized for specific tasks using CPU-based local LLMs via Ollama.

### Agent Hierarchy

```
                    ┌─────────────────┐
                    │  Supervisor     │
                    │  Agent          │
                    │  (Orchestrator) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Profile     │   │  Skills Gap   │   │  Job Search   │
│   Agent       │   │  Agent        │   │  Agent        │
└───────────────┘   └───────────────┘   └───────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐
│   Resume      │   │  Learning     │
│   Builder     │   │  Resource     │
│   Agent       │   │  Agent        │
└───────────────┘   └───────────────┘
```

### Agent Responsibilities

| Agent | Model | Purpose | CPU Perf |
|-------|-------|---------|----------|
| **Supervisor** | Qwen2.5 7B | Route user queries to appropriate agents | 18-22 t/s |
| **Profile Agent** | Phi3 Mini 3.8B | Analyze and extract profile data | 28-32 t/s |
| **Skills Gap Agent** | Qwen2.5-Coder 7B | Identify skill gaps and learning paths | 20-25 t/s |
| **Job Search Agent** | Phi3 Mini 3.8B | Match jobs to user profile | 28-32 t/s |
| **Resume Builder** | Qwen2.5 7B | Generate tailored resumes | 18-22 t/s |
| **Learning Agent** | Phi3 Mini 3.8B | Curate learning resources | 28-32 t/s |

---

## LangGraph Workflow

### Workflow Graph Structure

```python
# orchestration/workflow.py
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, Sequence
import operator

class CareerGiniState(TypedDict):
    """Workflow state shared across agents"""
    user_id: str
    session_id: str
    messages: Annotated[Sequence[dict], operator.add]
    profile_data: dict
    current_agent: str
    agent_outputs: dict
    final_output: str
    suggested_prompts: list[str]

def build_careergini_workflow():
    """Build the LangGraph workflow"""
    
    workflow = StateGraph(CareerGiniState)
    
    # Add nodes (agents)
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("profile_agent", profile_agent_node)
    workflow.add_node("skills_gap_agent", skills_gap_node)
    workflow.add_node("job_search_agent", job_search_node)
    workflow.add_node("resume_builder_agent", resume_builder_node)
    workflow.add_node("learning_agent", learning_agent_node)
    workflow.add_node("aggregator", aggregator_node)
    
    # Set entry point
    workflow.set_entry_point("supervisor")
    
    # Add conditional edges from supervisor
    workflow.add_conditional_edges(
        "supervisor",
        route_to_agent,
        {
            "profile": "profile_agent",
            "skills": "skills_gap_agent",
            "jobs": "job_search_agent",
            "resume": "resume_builder_agent",
            "learning": "learning_agent",
            "aggregator": "aggregator",
            "end": END
        }
    )
    
    # All agents return to supervisor
    for agent in ["profile_agent", "skills_gap_agent", "job_search_agent", 
                  "resume_builder_agent", "learning_agent"]:
        workflow.add_edge(agent, "supervisor")
    
    # Aggregator goes to END
    workflow.add_edge("aggregator", END)
    
    return workflow.compile()
```

### State Flow Diagram

```
User Query
    ↓
[Supervisor] ──→ Analyze intent
    │            Determine routing
    │
    ├──→ [Profile Agent] ──→ Fetch/update profile
    │            │
    │            └──→ [Supervisor]
    │
    ├──→ [Skills Gap] ──→ Identify gaps
    │            │
    │            └──→ [Supervisor]
    │
    ├──→ [Job Search] ──→ Find matches
    │            │
    │            └──→ [Supervisor]
    │
    ├──→ [Resume Builder] ──→ Generate resume
    │            │
    │            └──→ [Supervisor]
    │
    └──→ [Learning Agent] ──→ Curate resources
                 │
                 └──→ [Supervisor]
                          │
                          ↓
                    [Aggregator] ──→ Combine outputs
                          │
                          ↓
                    Final Response
```

---

## Agent Implementations

### 1. Supervisor Agent (Orchestrator)

**Purpose**: Analyze user queries and route to appropriate specialized agents.

**Model**: Qwen2.5 7B Q4_K_M (complex reasoning required)

```python
# agents/supervisor.py
from integrations.ollama_client import OllamaClient
from langchain.prompts import ChatPromptTemplate

class SupervisorAgent:
    def __init__(self):
        self.ollama = OllamaClient()
        self.llm = self.ollama.get_model("reasoning")
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a supervisor agent that routes user queries to specialized agents.

Available agents:
- profile: Get/update user profile information
- skills: Analyze skill gaps and career progression
- jobs: Search and recommend jobs
- resume: Generate tailored resumes
- learning: Find learning resources

Analyze the user's message and determine which agent(s) should handle it.
Return a JSON with: {{"agent": "agent_name", "reason": "explanation"}}

If multiple agents needed, return: {{"agents": ["agent1", "agent2"], "sequence": "parallel|sequential"}}
If ready to respond, return: {{"agent": "aggregator"}}"""),
            ("human", "{input}")
        ])
        
        self.chain = self.prompt | self.llm
    
    async def route(self, state: dict) -> dict:
        """Determine next agent to call"""
        
        # Get last user message
        last_message = state["messages"][-1]["content"]
        
        # Check if we have all needed data
        if state.get("agent_outputs"):
            # We have agent outputs, aggregate
            return {
                "current_agent": "aggregator",
                "messages": state["messages"]
            }
        
        # Route to appropriate agent
        result = await self.chain.ainvoke({
            "input": last_message
        })
        
        routing = self._parse_routing(result.content)
        
        return {
            "current_agent": routing["agent"],
            "messages": state["messages"] + [{
                "role": "system",
                "content": f"Routing to {routing['agent']}: {routing['reason']}"
            }]
        }
    
    def _parse_routing(self, response: str) -> dict:
        """Parse LLM routing decision"""
        import json
        try:
            return json.loads(response)
        except:
            # Fallback to profile agent
            return {"agent": "profile", "reason": "Default routing"}

def supervisor_node(state: dict) -> dict:
    """LangGraph node wrapper"""
    agent = SupervisorAgent()
    return agent.route(state)

def route_to_agent(state: dict) -> str:
    """Conditional edge function"""
    return state.get("current_agent", "profile")
```

---

### 2. Profile Agent (Data Extraction)

**Purpose**: Fetch, parse, and analyze user profile data.

**Model**: Phi3 Mini 3.8B Q4_K_M (fast extraction/classification)

```python
# agents/profile_agent.py
from integrations.ollama_client import OllamaClient
from integrations.postgres_client import PostgresClient
from langchain.prompts import ChatPromptTemplate

class ProfileAnalysisAgent:
    def __init__(self):
        self.ollama = OllamaClient()
        self.llm = self.ollama.get_model("fast")  # Phi3 Mini
        self.db = PostgresClient()
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a profile analysis expert. Analyze the user's profile and provide insights.

Focus on:
1. Current experience level
2. Core skills and competencies
3. Career trajectory
4. Strengths and areas for growth

Provide structured analysis in JSON format."""),
            ("human", "{profile_data}")
        ])
        
        self.chain = self.prompt | self.llm
    
    async def analyze(self, state: dict) -> dict:
        """Analyze user profile"""
        
        user_id = state["user_id"]
        
        # Fetch profile from database
        profile = await self.db.get_profile(user_id)
        
        if not profile:
            return {
                "agent_outputs": {
                    "profile": {
                        "error": "No profile found",
                        "suggestion": "Please sync your LinkedIn or upload a resume"
                    }
                },
                "messages": state["messages"]
            }
        
        # Analyze with LLM
        analysis = await self.chain.ainvoke({
            "profile_data": self._format_profile(profile)
        })
        
        return {
            "agent_outputs": {
                **state.get("agent_outputs", {}),
                "profile": self._parse_analysis(analysis.content)
            },
            "profile_data": profile,
            "messages": state["messages"]
        }
    
    def _format_profile(self, profile: dict) -> str:
        """Format profile for LLM"""
        return f"""
Skills: {', '.join(profile.get('skills', []))}
Experience: {len(profile.get('experience', []))} roles
Education: {profile.get('education', [])}
Career Level: {profile.get('experience_level', 'unknown')}
Goals: {profile.get('career_goals', [])}
"""
    
    def _parse_analysis(self, response: str) -> dict:
        """Parse LLM analysis"""
        import json
        try:
            return json.loads(response)
        except:
            return {"raw": response}

async def profile_agent_node(state: dict) -> dict:
    """LangGraph node wrapper"""
    agent = ProfileAnalysisAgent()
    return await agent.analyze(state)
```

---

### 3. Skills Gap Agent (Technical Analysis)

**Purpose**: Identify skill gaps and recommend learning paths.

**Model**: Qwen2.5-Coder 7B Q4_K_M (technical/coding expertise)

```python
# agents/skills_gap_agent.py
from integrations.ollama_client import OllamaClient
from langchain.prompts import ChatPromptTemplate
from typing import List, Dict

class SkillsGapAgent:
    def __init__(self):
        self.ollama = OllamaClient()
        self.llm = self.ollama.get_model("coder")  # Qwen2.5-Coder
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a technical career advisor specializing in skill gap analysis.

Given:
1. User's current skills
2. Target role/career goals

Analyze:
1. Core skills they have
2. Skills they're missing
3. Skills to prioritize
4. Learning roadmap (beginner → advanced)

Return structured JSON with skill gaps and priorities."""),
            ("human", """Current Skills: {current_skills}
Target Role: {target_role}
Career Goals: {career_goals}

Provide detailed skill gap analysis.""")
        ])
        
        self.chain = self.prompt | self.llm
    
    async def analyze_gaps(self, state: dict) -> dict:
        """Identify skill gaps"""
        
        profile = state.get("profile_data", {})
        last_message = state["messages"][-1]["content"]
        
        # Extract target role from message or profile
        target_role = self._extract_target_role(last_message, profile)
        
        # Analyze gaps
        analysis = await self.chain.ainvoke({
            "current_skills": ", ".join(profile.get("skills", [])),
            "target_role": target_role,
            "career_goals": ", ".join(profile.get("career_goals", []))
        })
        
        gaps = self._parse_gaps(analysis.content)
        
        return {
            "agent_outputs": {
                **state.get("agent_outputs", {}),
                "skills_gap": gaps
            },
            "messages": state["messages"]
        }
    
    def _extract_target_role(self, message: str, profile: dict) -> str:
        """Extract target role from context"""
        # Simple keyword extraction (could be enhanced)
        goals = profile.get("career_goals", [])
        if goals:
            return goals[0]
        return "Software Engineer"  # Default
    
    def _parse_gaps(self, response: str) -> Dict:
        """Parse skill gap analysis"""
        import json
        try:
            return json.loads(response)
        except:
            return {
                "missing_skills": [],
                "priority_skills": [],
                "roadmap": []
            }

async def skills_gap_node(state: dict) -> dict:
    """LangGraph node wrapper"""
    agent = SkillsGapAgent()
    return await agent.analyze_gaps(state)
```

---

### 4. Job Search Agent (Matching)

**Purpose**: Find and rank relevant job opportunities.

**Model**: Phi3 Mini 3.8B Q4_K_M (fast matching/classification)

```python
# agents/job_search_agent.py
from integrations.ollama_client import OllamaClient
from integrations.postgres_client import PostgresClient
from integrations.chromadb_client import ChromaDBClient
from langchain.prompts import ChatPromptTemplate
from typing import List, Dict

class JobSearchAgent:
    def __init__(self):
        self.ollama = OllamaClient()
        self.llm = self.ollama.get_model("fast")  # Phi3 Mini
        self.db = PostgresClient()
        self.vector_db = ChromaDBClient()
        
        self.ranking_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a job matching expert. Rank jobs based on fit with user profile.

Consider:
1. Skill match percentage
2. Experience level alignment
3. Career goal relevance
4. Location preferences

Return JSON: {{"job_id": "...", "score": 0-100, "reason": "..."}}"""),
            ("human", """User Profile: {profile}
Job Listing: {job}

Provide fit score and reasoning.""")
        ])
        
        self.ranking_chain = self.ranking_prompt | self.llm
    
    async def search_jobs(self, state: dict) -> dict:
        """Search and rank jobs"""
        
        profile = state.get("profile_data", {})
        last_message = state["messages"][-1]["content"]
        
        # Extract search criteria
        criteria = self._extract_criteria(last_message, profile)
        
        # Vector search for similar jobs
        jobs = await self.vector_db.search_jobs(
            skills=profile.get("skills", []),
            limit=20
        )
        
        # Rank jobs with LLM
        ranked_jobs = []
        for job in jobs:
            ranking = await self.ranking_chain.ainvoke({
                "profile": self._format_profile(profile),
                "job": self._format_job(job)
            })
            
            score = self._parse_ranking(ranking.content)
            ranked_jobs.append({
                **job,
                "relevance_score": score["score"],
                "match_reason": score["reason"]
            })
        
        # Sort by score
        ranked_jobs.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return {
            "agent_outputs": {
                **state.get("agent_outputs", {}),
                "jobs": ranked_jobs[:10]  # Top 10
            },
            "messages": state["messages"]
        }
    
    def _extract_criteria(self, message: str, profile: dict) -> Dict:
        """Extract search criteria"""
        return {
            "skills": profile.get("skills", []),
            "location": profile.get("job_preferences", {}).get("location"),
            "job_type": profile.get("job_preferences", {}).get("job_type")
        }
    
    def _format_profile(self, profile: dict) -> str:
        """Format profile summary"""
        return f"Skills: {', '.join(profile.get('skills', []))}, Level: {profile.get('experience_level')}"
    
    def _format_job(self, job: dict) -> str:
        """Format job listing"""
        return f"{job['title']} at {job['company']} - {job.get('requirements', [])}"
    
    def _parse_ranking(self, response: str) -> Dict:
        """Parse ranking response"""
        import json
        try:
            return json.loads(response)
        except:
            return {"score": 50, "reason": "Default scoring"}

async def job_search_node(state: dict) -> dict:
    """LangGraph node wrapper"""
    agent = JobSearchAgent()
    return await agent.search_jobs(state)
```

---

### 5. Resume Builder Agent (Content Generation)

**Purpose**: Generate tailored resumes matching job descriptions.

**Model**: Qwen2.5 7B Q4_K_M (complex content generation)

```python
# agents/resume_builder_agent.py
from integrations.ollama_client import OllamaClient
from langchain.prompts import ChatPromptTemplate
from typing import Dict

class ResumeBuilderAgent:
    def __init__(self):
        self.ollama = OllamaClient()
        self.llm = self.ollama.get_model("reasoning")  # Qwen2.5 7B
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert resume writer. Create ATS-optimized resumes tailored to job descriptions.

Guidelines:
1. Extract keywords from job description
2. Highlight relevant experience
3. Quantify achievements
4. Use action verbs
5. Match tone to company culture

Return JSON with resume sections: summary, experience, skills, education."""),
            ("human", """User Profile:
{profile}

Job Description:
{job_description}

Create a tailored resume.""")
        ])
        
        self.chain = self.prompt | self.llm
    
    async def generate_resume(self, state: dict) -> dict:
        """Generate tailored resume"""
        
        profile = state.get("profile_data", {})
        last_message = state["messages"][-1]["content"]
        
        # Extract job description from message
        job_description = self._extract_jd(last_message)
        
        # Generate resume
        result = await self.chain.ainvoke({
            "profile": self._format_profile(profile),
            "job_description": job_description
        })
        
        resume = self._parse_resume(result.content)
        
        return {
            "agent_outputs": {
                **state.get("agent_outputs", {}),
                "resume": resume
            },
            "messages": state["messages"]
        }
    
    def _extract_jd(self, message: str) -> str:
        """Extract job description from message"""
        # Simple extraction (could be enhanced)
        if "job description:" in message.lower():
            return message.split("job description:", 1)[1].strip()
        return message
    
    def _format_profile(self, profile: dict) -> str:
        """Format profile for resume generation"""
        return f"""
Name: {profile.get('name')}
Skills: {', '.join(profile.get('skills', []))}
Experience: {profile.get('experience', [])}
Education: {profile.get('education', [])}
"""
    
    def _parse_resume(self, response: str) -> Dict:
        """Parse generated resume"""
        import json
        try:
            return json.loads(response)
        except:
            return {"raw": response}

async def resume_builder_node(state: dict) -> dict:
    """LangGraph node wrapper"""
    agent = ResumeBuilderAgent()
    return await agent.generate_resume(state)
```

---

### 6. Learning Resource Agent (Curation)

**Purpose**: Find and recommend learning resources.

**Model**: Phi3 Mini 3.8B Q4_K_M (fast curation)

```python
# agents/learning_agent.py
from integrations.ollama_client import OllamaClient
from integrations.youtube_client import YouTubeClient
from integrations.github_client import GitHubSearchClient
from langchain.prompts import ChatPromptTemplate
from typing import List, Dict

class LearningResourceAgent:
    def __init__(self):
        self.ollama = OllamaClient()
        self.llm = self.ollama.get_model("fast")  # Phi3 Mini
        self.youtube = YouTubeClient()
        self.github = GitHubSearchClient()
        
        self.ranking_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a learning path curator. Rank resources by quality and relevance.

Consider:
1. Content quality indicators
2. Difficulty level match
3. Resource type (video, course, book, project)
4. Recency (for tech topics)

Return JSON array with ranked resources."""),
            ("human", """Skill: {skill}
User Level: {level}
Resources: {resources}

Rank and explain choices.""")
        ])
        
        self.ranking_chain = self.ranking_prompt | self.llm
    
    async def curate_resources(self, state: dict) -> dict:
        """Find and rank learning resources"""
        
        # Extract skills from agent outputs
        skills_gap = state.get("agent_outputs", {}).get("skills_gap", {})
        priority_skills = skills_gap.get("priority_skills", [])
        
        if not priority_skills:
            # Fallback to profile skills
            profile = state.get("profile_data", {})
            priority_skills = profile.get("skills", [])[:3]
        
        # Gather resources for each skill
        all_resources = []
        for skill in priority_skills[:3]:  # Top 3 skills
            resources = await self._gather_resources(skill)
            
            # Rank with LLM
            ranked = await self.ranking_chain.ainvoke({
                "skill": skill,
                "level": state.get("profile_data", {}).get("experience_level", "beginner"),
                "resources": str(resources)
            })
            
            all_resources.append({
                "skill": skill,
                "resources": self._parse_resources(ranked.content)
            })
        
        return {
            "agent_outputs": {
                **state.get("agent_outputs", {}),
                "learning": all_resources
            },
            "messages": state["messages"]
        }
    
    async def _gather_resources(self, skill: str) -> List[Dict]:
        """Gather resources from multiple sources"""
        
        # YouTube videos
        videos = await self.youtube.search(f"{skill} tutorial", max_results=5)
        
        # GitHub repos
        repos = await self.github.search_repos(skill, limit=5)
        
        # Combine
        resources = []
        
        for video in videos:
            resources.append({
                "type": "video",
                "title": video["title"],
                "url": video["url"],
                "platform": "YouTube"
            })
        
        for repo in repos:
            resources.append({
                "type": "project",
                "title": repo["name"],
                "url": repo["url"],
                "platform": "GitHub",
                "stars": repo["stars"]
            })
        
        return resources
    
    def _parse_resources(self, response: str) -> List[Dict]:
        """Parse ranked resources"""
        import json
        try:
            return json.loads(response)
        except:
            return []

async def learning_agent_node(state: dict) -> dict:
    """LangGraph node wrapper"""
    agent = LearningResourceAgent()
    return await agent.curate_resources(state)
```

---

## State Management

### State Schema

```python
# orchestration/state.py
from typing import TypedDict, Annotated, Sequence
import operator

class CareerGiniState(TypedDict):
    """
    Shared state across all agents in the workflow
    """
    
    # User context
    user_id: str
    session_id: str
    
    # Conversation
    messages: Annotated[Sequence[dict], operator.add]  # Append-only
    
    # Data
    profile_data: dict  # User profile from DB
    
    # Routing
    current_agent: str  # Which agent to call next
    
    # Agent outputs
    agent_outputs: dict  # Accumulated results from agents
    
    # Final response
    final_output: str
    suggested_prompts: list[str]
    
    # Metadata
    started_at: str
    completed_at: str
```

### State Transitions

```python
# State flow example
initial_state = {
    "user_id": "uuid-123",
    "session_id": "session-456",
    "messages": [{"role": "user", "content": "Help me become a data scientist"}],
    "profile_data": {},
    "current_agent": None,
    "agent_outputs": {},
    "final_output": "",
    "suggested_prompts": []
}

# After supervisor routing
after_supervisor = {
    **initial_state,
    "current_agent": "skills",
    "messages": initial_state["messages"] + [{
        "role": "system",
        "content": "Routing to skills_gap_agent"
    }]
}

# After skills gap agent
after_skills = {
    **after_supervisor,
    "current_agent": "learning",
    "agent_outputs": {
        "skills_gap": {
            "missing_skills": ["Python", "ML", "Statistics"],
            "roadmap": [...]
        }
    }
}

# After learning agent
after_learning = {
    **after_skills,
    "current_agent": "aggregator",
    "agent_outputs": {
        **after_skills["agent_outputs"],
        "learning": {
            "resources": [...]
        }
    }
}

# Final state
final_state = {
    **after_learning,
    "final_output": "To become a data scientist, you should focus on...",
    "suggested_prompts": [
        "Show me data science jobs",
        "Generate a data scientist resume"
    ]
}
```

---

## Routing Logic

### Supervisor Routing Decision Tree

```python
# orchestration/router.py

def route_to_agent(state: dict) -> str:
    """
    Conditional edge function for LangGraph
    
    Returns the next agent to call based on current state
    """
    
    current_agent = state.get("current_agent")
    agent_outputs = state.get("agent_outputs", {})
    
    # If aggregator called, end workflow
    if current_agent == "aggregator":
        return "end"
    
    # If we have sufficient outputs, aggregate
    if _has_sufficient_data(state):
        return "aggregator"
    
    # Route based on supervisor decision
    return current_agent

def _has_sufficient_data(state: dict) -> bool:
    """Check if we have enough data to respond"""
    
    agent_outputs = state.get("agent_outputs", {})
    
    # If any major agent has responded, we can aggregate
    if any(key in agent_outputs for key in ["profile", "skills_gap", "jobs", "resume", "learning"]):
        return True
    
    return False
```

### Intent Classification (Supervisor)

```python
# agents/supervisor.py

def classify_intent(message: str) -> str:
    """
    Classify user intent to determine routing
    
    Intent Categories:
    - profile: Profile questions, updates
    - skills: Skill gaps, career progression
    - jobs: Job search, recommendations
    - resume: Resume generation, review
    - learning: Learning resources, courses
    """
    
    message_lower = message.lower()
    
    # Keyword-based classification (fallback)
    if any(word in message_lower for word in ["profile", "about me", "my experience"]):
        return "profile"
    
    if any(word in message_lower for word in ["skill", "learn", "gap", "improve"]):
        return "skills"
    
    if any(word in message_lower for word in ["job", "position", "role", "opening", "apply"]):
        return "jobs"
    
    if any(word in message_lower for word in ["resume", "cv", "application"]):
        return "resume"
    
    if any(word in message_lower for word in ["course", "tutorial", "resource", "guide"]):
        return "learning"
    
    # Default to profile
    return "profile"
```

---

## Integration with Ollama

### Ollama Client Setup

```python
# integrations/ollama_client.py
from langchain_community.chat_models import ChatOllama
import os

class OllamaClient:
    """
    Central Ollama client for all agents
    CPU-optimized configuration for 8 vCores, 30 GB RAM
    """
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        
        # Pre-configure models
        self._setup_models()
    
    def _setup_models(self):
        """Initialize model instances"""
        
        # Qwen2.5 7B - Complex reasoning
        self.llm_reasoning = ChatOllama(
            model="qwen2.5:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.7,
            num_ctx=2048,         # Context window
            num_thread=6,         # 75% of 8 vCores
            num_predict=512,      # Max output tokens
            top_p=0.9,
            repeat_penalty=1.1
        )
        
        # Phi3 Mini 3.8B - Fast tasks
        self.llm_fast = ChatOllama(
            model="phi3:3.8b-mini-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.3,
            num_ctx=2048,
            num_thread=6,
            num_predict=256,
            top_p=0.9
        )
        
        # Qwen2.5-Coder 7B - Technical tasks
        self.llm_coder = ChatOllama(
            model="qwen2.5-coder:7b-instruct-q4_K_M",
            base_url=self.base_url,
            temperature=0.2,      # Lower for code
            num_ctx=2048,
            num_thread=6,
            num_predict=512,
            top_p=0.95
        )
    
    def get_model(self, task_type: str):
        """
        Get appropriate model for task
        
        Args:
            task_type: "reasoning", "fast", "coder"
        
        Returns:
            ChatOllama instance
        """
        
        if task_type in ["reasoning", "routing", "complex", "resume"]:
            return self.llm_reasoning
        elif task_type in ["coding", "technical", "skills"]:
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
```

### Model Performance Benchmarks

```python
# Performance monitoring
class ModelMetrics:
    """Track model performance"""
    
    @staticmethod
    async def measure_inference(model, prompt: str) -> dict:
        """Measure inference speed"""
        import time
        
        start = time.time()
        result = await model.ainvoke(prompt)
        end = time.time()
        
        duration = end - start
        tokens = len(result.content.split())  # Rough estimate
        tokens_per_second = tokens / duration
        
        return {
            "duration_seconds": duration,
            "output_tokens": tokens,
            "tokens_per_second": tokens_per_second
        }

# Expected performance on 8 vCore CPU:
# - Qwen2.5 7B Q4_K_M: 18-22 tokens/second
# - Phi3 Mini Q4_K_M: 28-32 tokens/second
# - Qwen2.5-Coder Q4_K_M: 20-25 tokens/second
```

---

## Testing & Debugging

### Unit Tests for Agents

```python
# tests/test_agents.py
import pytest
from agents.profile_agent import ProfileAnalysisAgent
from agents.skills_gap_agent import SkillsGapAgent

@pytest.mark.asyncio
async def test_profile_agent():
    """Test profile analysis"""
    
    agent = ProfileAnalysisAgent()
    
    state = {
        "user_id": "test-user",
        "messages": [{"role": "user", "content": "Analyze my profile"}],
        "profile_data": {
            "skills": ["Python", "Django"],
            "experience_level": "mid"
        }
    }
    
    result = await agent.analyze(state)
    
    assert "agent_outputs" in result
    assert "profile" in result["agent_outputs"]

@pytest.mark.asyncio
async def test_skills_gap_agent():
    """Test skills gap analysis"""
    
    agent = SkillsGapAgent()
    
    state = {
        "user_id": "test-user",
        "messages": [{"role": "user", "content": "I want to become a data scientist"}],
        "profile_data": {
            "skills": ["Python", "SQL"],
            "career_goals": ["Data Scientist"]
        }
    }
    
    result = await agent.analyze_gaps(state)
    
    assert "agent_outputs" in result
    assert "skills_gap" in result["agent_outputs"]
    assert "missing_skills" in result["agent_outputs"]["skills_gap"]
```

### Integration Tests

```python
# tests/test_workflow.py
import pytest
from orchestration.workflow import build_careergini_workflow

@pytest.mark.asyncio
async def test_full_workflow():
    """Test complete agent workflow"""
    
    workflow = build_careergini_workflow()
    
    initial_state = {
        "user_id": "test-user",
        "session_id": "test-session",
        "messages": [{
            "role": "user",
            "content": "Help me transition to data science"
        }],
        "profile_data": {
            "skills": ["Python", "SQL"],
            "experience_level": "mid"
        }
    }
    
    result = await workflow.ainvoke(initial_state)
    
    # Verify final output
    assert "final_output" in result
    assert len(result["final_output"]) > 0
    
    # Verify agent outputs
    assert "agent_outputs" in result
    
    # At least one agent should have responded
    assert len(result["agent_outputs"]) > 0
```

### Debugging Tools

```python
# utils/debug.py
import json
from typing import Dict

class WorkflowDebugger:
    """Debug LangGraph workflows"""
    
    @staticmethod
    def print_state(state: Dict, step: str):
        """Pretty print workflow state"""
        print(f"\n{'='*60}")
        print(f"Step: {step}")
        print(f"{'='*60}")
        print(f"Current Agent: {state.get('current_agent')}")
        print(f"Messages: {len(state.get('messages', []))}")
        print(f"Agent Outputs: {list(state.get('agent_outputs', {}).keys())}")
        print(f"{'='*60}\n")
    
    @staticmethod
    def save_state(state: Dict, filename: str):
        """Save state to file for inspection"""
        with open(filename, 'w') as f:
            json.dump(state, f, indent=2, default=str)
    
    @staticmethod
    def visualize_workflow(workflow):
        """Generate workflow graph visualization"""
        try:
            from langgraph.graph import MermaidDrawer
            drawer = MermaidDrawer()
            mermaid_code = drawer.draw(workflow.graph)
            print(mermaid_code)
        except ImportError:
            print("Install langgraph-visualizer for graph visualization")

# Usage in development
if __name__ == "__main__":
    from orchestration.workflow import build_careergini_workflow
    
    workflow = build_careergini_workflow()
    debugger = WorkflowDebugger()
    
    # Visualize workflow
    debugger.visualize_workflow(workflow)
```

### Performance Profiling

```python
# utils/profiler.py
import time
import asyncio
from functools import wraps
from typing import Callable

def profile_agent(func: Callable):
    """Decorator to profile agent execution time"""
    
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        end = time.time()
        
        duration = end - start
        
        print(f"Agent: {func.__name__}")
        print(f"Duration: {duration:.2f}s")
        
        # Log to metrics
        await log_metric(func.__name__, duration)
        
        return result
    
    return wrapper

async def log_metric(agent_name: str, duration: float):
    """Log performance metric"""
    # Could send to monitoring system (Prometheus, etc.)
    pass

# Usage
@profile_agent
async def profile_agent_node(state: dict) -> dict:
    # Agent logic here
    pass
```

---

## Best Practices

### 1. Error Handling

```python
# agents/base.py
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class BaseAgent:
    """Base class for all agents with error handling"""
    
    async def execute(self, state: Dict) -> Dict:
        """Execute agent with error handling"""
        try:
            return await self._execute_impl(state)
        except Exception as e:
            logger.error(f"Agent {self.__class__.__name__} failed: {str(e)}")
            
            # Return error state
            return {
                "agent_outputs": {
                    **state.get("agent_outputs", {}),
                    "error": {
                        "agent": self.__class__.__name__,
                        "message": str(e)
                    }
                },
                "messages": state["messages"]
            }
    
    async def _execute_impl(self, state: Dict) -> Dict:
        """Override in subclass"""
        raise NotImplementedError
```

### 2. Prompt Engineering

```python
# Best practices for prompts with local LLMs

# ✅ GOOD: Clear, structured prompts
prompt = """You are a career advisor. Analyze the user's profile.

User Profile:
- Skills: Python, JavaScript
- Experience: 3 years
- Goal: Senior Engineer

Provide:
1. Current level assessment
2. Skills to develop
3. Career progression path

Format as JSON."""

# ❌ BAD: Vague, unstructured prompts
prompt = "Tell me about the user's career"

# ✅ GOOD: Specific output format
prompt = """Return JSON: {
  "assessment": "...",
  "recommendations": ["..."],
  "next_steps": ["..."]
}"""

# ❌ BAD: Expecting specific format without instruction
prompt = "Analyze profile"
```

### 3. Context Management

```python
# Manage context window (2048 tokens for our models)

def truncate_messages(messages: list, max_tokens: int = 1500) -> list:
    """Keep only recent messages within token limit"""
    
    # Rough estimation: 1 token ≈ 4 characters
    char_limit = max_tokens * 4
    
    truncated = []
    total_chars = 0
    
    # Keep messages from newest to oldest
    for msg in reversed(messages):
        msg_chars = len(msg["content"])
        if total_chars + msg_chars > char_limit:
            break
        truncated.insert(0, msg)
        total_chars += msg_chars
    
    return truncated
```

### 4. Caching Strategies

```python
# Cache expensive operations

from functools import lru_cache
import hashlib

class CachingAgent:
    """Agent with response caching"""
    
    @lru_cache(maxsize=100)
    async def cached_analysis(self, profile_hash: str):
        """Cache analysis by profile hash"""
        # Expensive LLM call here
        pass
    
    def hash_profile(self, profile: dict) -> str:
        """Create hash of profile for caching"""
        profile_str = json.dumps(profile, sort_keys=True)
        return hashlib.md5(profile_str.encode()).hexdigest()
```

---

**Document Version**: 1.0  
**Last Updated**: February 17, 2026  
**Maintained By**: CareerGini Development Team