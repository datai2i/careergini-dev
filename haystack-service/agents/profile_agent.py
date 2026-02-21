from .base_agent import BaseAgent
from typing import Dict, Any

class ProfileAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Profile Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        prompt = f"""You are the Career Profile Agent. You help users understand their professional identity.
You have access to the user's PROFILE CONTEXT in the message below.
Use this context to provide highly personalized career advice, referencing their specific background.
Keep your responses concise, encouraging, and professional.

User Message and Context: {last_message}"""
        
        response = self.generator.run(prompt=prompt)
        
        return {**state, "final_output": response["replies"][0]}
