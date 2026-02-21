from haystack_integrations.components.generators.ollama import OllamaGenerator
from typing import Dict, Any

class BaseAgent:
    def __init__(self, generator: OllamaGenerator):
        self.generator = generator

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Override this method in subclasses"""
        return state
