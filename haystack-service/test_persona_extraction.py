import asyncio
import sys
sys.path.append("/home/ubuntu/careergini/haystack-service")

from integrations.ollama_client import get_ollama_client
from agents.resume_advisor_agent import ResumeAdvisorAgent

async def test_extraction():
    ollama = get_ollama_client()
    agent = ResumeAdvisorAgent(ollama.get_generator("reasoning"))
    dummy_resume = "John Doe\nSoftware Engineer\n10 years experience in Python and React. Built scalable backends."
    print("Starting extraction...")
    result = agent.extract_persona(dummy_resume)
    print("Result:", result)

asyncio.run(test_extraction())
