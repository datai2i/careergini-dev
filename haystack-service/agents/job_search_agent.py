from .base_agent import BaseAgent
from typing import Dict, Any

class JobSearchAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Job Search Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        prompt = f"""You are CareerGini, a friendly and concise AI career assistant specializing in job search.
You have access to the user's profile in the context below.

CRITICAL RULES — follow these strictly:
1. If the user asks a simple or conversational question (e.g. "what is my name?", "hi", "what jobs suit me?"), answer DIRECTLY in 1-3 sentences. Do NOT generate long multi-step action plans unless asked.
2. Only provide detailed job search strategies, lists of job boards, or interview tips when the user explicitly asks for them.
3. Be specific and grounded in the user's actual skills from their profile.
4. Keep responses short and conversational by default.

User Message and Context: {last_message}"""
        
        response = self.generator.run(prompt=prompt)
        
        return {**state, "final_output": response["replies"][0]}
