from .base_agent import BaseAgent
from typing import Dict, Any

class LearningAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Learning Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        prompt = f"""You are a Learning Resource Specialist.
You have access to the user's PROFILE CONTEXT below.
Recommend tailored courses, certifications, and tutorials that match their current skill level and goals.
Prioritize high-quality, reputable resources (Coursera, Udemy, Documentation).
Include difficulty level. Be structured and motivating. Avoid lengthy descriptions.

User Message and Context: {last_message}"""
        
        response = self.generator.run(prompt=prompt)
        
        return {**state, "final_output": response["replies"][0]}
