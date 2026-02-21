"""
Haystack Multi-Agent Workflow
Orchestrates specialized agents using LOCAL Ollama models via Haystack Pipelines
"""

from typing import Dict, Any, List, TypedDict
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

class HaystackWorkflow:
    def __init__(self):
        ollama_client = get_ollama_client()
        
        # Initialize agents with appropriate Haystack generators
        self.supervisor = SupervisorAgent(ollama_client.get_generator("reasoning"))
        self.agents = {
            "profile": ProfileAgent(ollama_client.get_generator("fast")),
            "skills_gap": SkillsGapAgent(ollama_client.get_generator("coding")),
            "job_search": JobSearchAgent(ollama_client.get_generator("fast")),
            "resume": ResumeBuilderAgent(ollama_client.get_generator("reasoning")),
            "learning": LearningAgent(ollama_client.get_generator("fast"))
        }

    async def ainvoke(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the workflow utilizing deterministic routing where possible.
        """
        messages = state.get("messages", [])
        last_message = messages[-1]["content"].lower() if messages else ""
        
        # 1. Deterministic Conditional Routing (Performance Optimization)
        # Bypass the LLM Supervisor entirely for clear keywords
        active_agent_name = None
        
        # Simple Regex/Keyword matching
        if any(kw in last_message for kw in ["resume", "cv", "review my"]):
            active_agent_name = "resume"
        elif any(kw in last_message for kw in ["job", "apply", "search"]):
            active_agent_name = "job_search"
        elif any(kw in last_message for kw in ["learn", "course", "certif"]):
            active_agent_name = "learning"
        elif any(kw in last_message for kw in ["skills", "gap", "missing"]):
            active_agent_name = "skills_gap"
            
        # Fallback to LLM Supervisor if deterministic routing fails
        if not active_agent_name:
            routed_state = await self.supervisor.run(state)
            active_agent_name = routed_state.get("active_agent")
            
        if not active_agent_name or active_agent_name not in self.agents:
            active_agent_name = "profile"
            
        state["active_agent"] = active_agent_name
            
        # 2. Run the selected agent
        agent = self.agents[active_agent_name]
        final_state = await agent.run(state)
        
        return final_state
        
    async def astream_events(self, state: Dict[str, Any], version="v1"):
        """
        Mock streaming events for Haystack using conditional deterministic routing.
        """
        messages = state.get("messages", [])
        last_message = messages[-1]["content"].lower() if messages else ""
        
        # 1. Deterministic Conditional Routing (Performance Optimization)
        active_agent_name = None
        
        if any(kw in last_message for kw in ["resume", "cv", "review my"]):
            active_agent_name = "resume"
        elif any(kw in last_message for kw in ["job", "apply", "search"]):
            active_agent_name = "job_search"
        elif any(kw in last_message for kw in ["learn", "course", "certif"]):
            active_agent_name = "learning"
        elif any(kw in last_message for kw in ["skills", "gap", "missing"]):
            active_agent_name = "skills_gap"
            
        if not active_agent_name:
            routed_state = await self.supervisor.run(state)
            active_agent_name = routed_state.get("active_agent", "profile")
        
        state["active_agent"] = active_agent_name
        
        yield {
            "event": "on_chain_end",
            "metadata": {"langgraph_node": "supervisor"},
            "data": {"output": {"active_agent": active_agent_name}}
        }
        
        # 2. Agent execution
        agent = self.agents.get(active_agent_name, self.agents["profile"])
        final_state = await agent.run(state)
        
        # Yield the final response chunk
        yield {
            "event": "on_chat_model_stream",
            "metadata": {"langgraph_node": active_agent_name},
            "data": {"chunk": type('obj', (object,), {'content': final_state.get('final_output', '')})}
        }

def build_careergini_workflow():
    """
    Build Haystack workflow instance.
    """
    return HaystackWorkflow()
