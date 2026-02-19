from .base_agent import BaseAgent
from typing import Dict, Any

class ProfileAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Profile Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        system_prompt = (
            "You are the Career Profile Agent. You help users understand their professional identity.\n"
            "You have access to the user's PROFILE CONTEXT in the message.\n"
            "Use this context to provide highly personalized career advice, referencing their specific background.\n"
            "Keep your responses concise, encouraging, and professional."
        )
        
        from langchain.schema import HumanMessage, SystemMessage
        
        response = await self.llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=last_message)
        ])
        
        return {**state, "final_output": response.content}
