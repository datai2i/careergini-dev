from .base_agent import BaseAgent
from typing import Dict, Any

class SkillsGapAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Skills Gap Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        prompt = f"""You are CareerGini, a friendly and concise AI career assistant specializing in skills.
You have access to the user's profile with their current skills and goals.

CRITICAL RULES — follow these strictly:
1. If the user asks a simple or conversational question (e.g. "what skills do I have?", "hi"), answer DIRECTLY in 1-3 sentences. Do NOT generate long skill roadmaps unless explicitly asked.
2. Only provide detailed skill gap analysis or learning paths when the user explicitly asks for them.
3. Reference only the specific skills found in the user's profile context. Be precise, not generic.
4. Keep responses short, structured, and actionable.

User Message and Context: {last_message}"""
        
        response = self.generator.run(prompt=prompt)
        
        return {**state, "final_output": response["replies"][0]}
