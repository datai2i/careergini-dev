from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.chat_models import ChatOllama
from typing import Dict, Any

class BaseAgent:
    def __init__(self, llm: ChatOllama):
        self.llm = llm

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Override this method in subclasses"""
        return state
