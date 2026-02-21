from .base_agent import BaseAgent
from typing import Dict, Any

class SkillsGapAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Skills Gap Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        prompt = f"""You are a Technical Skills Advisor.
You have access to the user's PROFILE CONTEXT (current skills and goals) below.
Identify gaps between their current profile and their target roles.
Recommend specific technologies or skills they need to learn to bridge these gaps.
Be specific (mention exact tools/frameworks). Avoid lengthy paragraphs.

User Message and Context: {last_message}"""
        
        response = self.generator.run(prompt=prompt)
        
        return {**state, "final_output": response["replies"][0]}
