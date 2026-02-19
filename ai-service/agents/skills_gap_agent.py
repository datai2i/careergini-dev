from .base_agent import BaseAgent
from typing import Dict, Any

class SkillsGapAgent(BaseAgent):
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("Skills Gap Agent running...")
        messages = state.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        system_prompt = (
            "You are a Technical Skills Advisor.\n"
            "You have access to the user's PROFILE CONTEXT (current skills and goals).\n"
            "Identify gaps between their current profile and their target roles.\n"
            "Recommend specific technologies or skills they need to learn to bridge these gaps.\n"
            "Be specific (mention exact tools/frameworks). Avoid lengthy paragraphs."
        )
        
        from langchain.schema import HumanMessage, SystemMessage
        
        response = await self.llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=last_message)
        ])
        
        return {**state, "final_output": response.content}
