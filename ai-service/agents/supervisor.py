from .base_agent import BaseAgent
from typing import Dict, Any
from langgraph.graph import END

class SupervisorAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Route user request to the appropriate agent.
        """
        print("Supervisor Agent routing...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        system_prompt = (
            "You are the Supervisor of CareerGini. Route user requests to the correct specialist agent.\n"
            "Available agents:\n"
            "- 'profile': Career path, transitions, professional identity\n"
            "- 'skills_gap': Technical skills, programming languages, technologies to learn\n"
            "- 'job_search': Finding jobs, job boards, interview prep, salary negotiation\n"
            "- 'resume': Resume review, ATS optimization, formatting, content improvement\n"
            "- 'learning': Courses, tutorials, certifications, learning resources\n\n"
            "Examples:\n"
            "User: 'What skills do I need for AI?' → skills_gap\n"
            "User: 'Review my resume' → resume\n"
            "User: 'Make my resume ATS-friendly' → resume\n"
            "User: 'Find remote jobs' → job_search\n"
            "User: 'Recommend ML courses' → learning\n"
            "User: 'Should I switch careers?' → profile\n\n"
            "Output ONLY the agent name (one word). No explanations."
        )
        
        from langchain.schema import HumanMessage, SystemMessage
        
        response = await self.llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=last_message)
        ])
        
        # Clean response to get agent name
        decision = response.content.strip().lower().replace("'", "").replace('"', "")
        
        # Keyword-based fallback for common misroutes
        keywords = {
            "resume": ["resume", "cv", "ats", "application"],
            "skills_gap": ["skill", "learn", "technology", "programming", "language"],
            "job_search": ["job", "hire", "interview", "salary", "company"],
            "learning": ["course", "tutorial", "certification", "study", "class"],
            "profile": ["career", "transition", "path", "switch"]
        }
        
        # Validate decision
        valid_agents = ["profile", "skills_gap", "job_search", "resume", "learning"]
        if decision not in valid_agents:
            # Try keyword matching
            message_lower = last_message.lower()
            for agent, words in keywords.items():
                if any(word in message_lower for word in words):
                    decision = agent
                    print(f"Supervisor used keyword fallback: {decision}")
                    break
            else:
                # Final fallback to profile
                print(f"Supervisor unsure (got '{decision}'), defaulting to profile.")
                decision = "profile"
            
        print(f"Supervisor routed to: {decision}")
        return {**state, "active_agent": decision}
