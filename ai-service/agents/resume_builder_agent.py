from .base_agent import BaseAgent
from typing import Dict, Any

class ResumeBuilderAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Resume Builder Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        system_prompt = (
            "You are the Resume Builder Agent.\n"
            "You have access to the user's PROFILE CONTEXT in the message.\n"
            "Provide specific formatting and content advice based on their actual experience and target roles.\n"
            "Focus on actionable improvements to improve their ATS visibility."
        )
        
        from langchain.schema import HumanMessage, SystemMessage
        
        response = await self.llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=last_message)
        ])
        
        return {**state, "final_output": response.content}
