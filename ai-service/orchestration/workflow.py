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
