from .base_agent import BaseAgent
from typing import Dict, Any

class ResumeBuilderAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Resume Builder Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        prompt = f"""You are the Resume Builder Agent.
You have access to the user's PROFILE CONTEXT in the message below.
Provide specific formatting and content advice based on their actual experience and target roles.
Focus on actionable improvements to improve their ATS visibility.

User Message and Context: {last_message}"""
        
        response = self.generator.run(prompt=prompt)
        
        return {**state, "final_output": response["replies"][0]}
