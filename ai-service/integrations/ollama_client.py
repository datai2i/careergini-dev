"""
Ollama Client for CareerGini
100% Local LLM Inference - NO External APIs
"""

from langchain_community.chat_models import ChatOllama
from typing import Literal
import os
import logging

logger = logging.getLogger(__name__)

class OllamaClient:
    """
    Centralized Ollama client for all LLM operations.
    Supports three model types for different task complexities.
    """
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        num_threads = int(os.getenv("OLLAMA_NUM_THREADS", "6"))
        
        logger.info(f"Initializing Ollama client with base_url: {self.base_url}")
        
        # Model 1: Complex Reasoning (Supervisor, Resume Builder) - QUALITY OPTIMIZED
        self.llm_reasoning = ChatOllama(
            model="phi3:mini",  # 2.2GB - good quality
            base_url=self.base_url,
            temperature=0.7,
            num_ctx=4096,  # Reduced for faster generation
            num_thread=num_threads,
            top_p=0.9,
            repeat_penalty=1.1,
            verbose=False
        )
        logger.info("✓ Loaded reasoning model: phi3:mini (QUALITY OPTIMIZED)")
        
        # Model 2: Fast Tasks (Profile, Jobs, Learning) - QUALITY OPTIMIZED
        self.llm_fast = ChatOllama(
            model="phi3:mini",  # 2.2GB - good quality
            base_url=self.base_url,
            temperature=0.3,  # Lower for conciseness
            num_ctx=4096,  # Reduced for faster generation
            num_thread=num_threads,
            top_p=0.95,
            repeat_penalty=1.0,
            verbose=False
        )
        logger.info("✓ Loaded fast model: phi3:mini (QUALITY OPTIMIZED)")
        
        # Model 3: Technical/Coding Tasks (Skills Gap) - QUALITY OPTIMIZED
        self.llm_coder = ChatOllama(
            model="phi3:mini",  # 2.2GB - good quality
            base_url=self.base_url,
            temperature=0.2,  # Lower for factual accuracy
            num_ctx=4096,  # Reduced for faster generation
            num_thread=num_threads,
            top_p=0.9,
            repeat_penalty=1.05,
            verbose=False
        )
        logger.info("✓ Loaded coder model: phi3:mini (QUALITY OPTIMIZED)")
    
    def get_model(self, task_type: Literal["reasoning", "fast", "coding"]):
        """
        Get appropriate model for task type.
        
        Args:
            task_type: 
                - "reasoning": Complex tasks (supervisor, resume)
                - "fast": Simple tasks (profile, jobs, learning)
                - "coding": Technical analysis (skills gap)
        
        Returns:
            ChatOllama instance
        """
        if task_type == "reasoning":
            return self.llm_reasoning
        elif task_type == "coding":
            return self.llm_coder
        else:
            return self.llm_fast
    
    async def health_check(self) -> dict:
        """Check Ollama service health"""
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    return {
                        "status": "healthy",
                        "models_available": len(models),
                        "base_url": self.base_url
                    }
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "base_url": self.base_url
            }

# Global singleton instance
_ollama_client = None

def get_ollama_client() -> OllamaClient:
    """Get or create global Ollama client instance"""
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient()
    return _ollama_client
