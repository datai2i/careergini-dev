import asyncio
import sys
sys.path.append("/app")
from agents.resume_advisor_agent import ResumeAdvisorAgent
from integrations.ollama_client import get_ollama_client
import json

async def test_extraction():
    ollama = get_ollama_client()
    agent = ResumeAdvisorAgent(ollama.get_generator("fast"))
    res = agent.extract_persona("Jane Smith, Lead Data Scientist. Skills: SQL, Python. 15 years exp.")
    print("Final output:", json.dumps(res, indent=2))

asyncio.run(test_extraction())
