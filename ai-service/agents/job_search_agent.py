from .base_agent import BaseAgent
from typing import Dict, Any

class JobSearchAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Job Search Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        system_prompt = (
            "You are an expert Job Search Coach.\n"
            "You have access to the user's PROFILE CONTEXT in the message.\n"
            "Use their skills, experience, and preferences to suggest specific job search strategies and roles.\n"
            "Provide actionable advice on where to apply and how to position themselves."
        )
        
        from langchain.schema import HumanMessage, SystemMessage
        
        response = await self.llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=last_message)
        ])
        
        return {**state, "final_output": response.content}
