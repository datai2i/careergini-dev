from .base_agent import BaseAgent
from typing import Dict, Any

class LearningAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Learning Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        system_prompt = (
            "You are a Learning Resource Specialist.\n"
            "You have access to the user's PROFILE CONTEXT.\n"
            "Recommend tailored courses, certifications, and tutorials that match their current skill level and goals.\n"
            "Prioritize high-quality, reputable resources (Coursera, Udemy, Documentation).\n"
            "Include difficulty level. Be structured and motivating. Avoid lengthy descriptions."
        )
        
        from langchain.schema import HumanMessage, SystemMessage
        
        response = await self.llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=last_message)
        ])
        
        return {**state, "final_output": response.content}
