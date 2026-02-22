from .base_agent import BaseAgent
from typing import Dict, Any

class LearningAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Learning Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        prompt = f"""You are CareerGini, a friendly and concise AI career assistant specializing in learning resources.
You have access to the user's profile below.

CRITICAL RULES — follow these strictly:
1. If the user asks a simple or conversational question (e.g. "what should I learn?", "hi"), answer DIRECTLY and BRIEFLY. Do NOT generate a long list of courses unless they ask for recommendations.
2. Only produce course lists, roadmaps, or certification paths when the user explicitly asks for them.
3. When recommending resources, be specific (name exact courses/platforms), not generic.
4. Keep responses concise and direct.

User Message and Context: {last_message}"""
        
        response = self.generator.run(prompt=prompt)
        
        return {**state, "final_output": response["replies"][0]}
