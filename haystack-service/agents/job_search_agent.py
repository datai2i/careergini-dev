from .base_agent import BaseAgent
from typing import Dict, Any

class JobSearchAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Job Search Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        prompt = f"""You are an expert Job Search Coach.
You have access to the user's PROFILE CONTEXT in the message below.
Use their skills, experience, and preferences to suggest specific job search strategies and roles.
Provide actionable advice on where to apply and how to position themselves.

User Message and Context: {last_message}"""
        
        response = self.generator.run(prompt=prompt)
        
        return {**state, "final_output": response["replies"][0]}
