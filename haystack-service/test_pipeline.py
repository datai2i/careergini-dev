import asyncio
import sys
sys.path.append("/app")

from haystack import Pipeline
from haystack.components.builders import PromptBuilder
from integrations.ollama_client import get_ollama_client
import json

async def test_pipe():
    ollama = get_ollama_client()
    generator = ollama.get_generator("reasoning")
    
    pipe = Pipeline()
    pipe.add_component("prompt_builder", PromptBuilder(template="Extract persona from this resume: {{resume_text}}. Return JSON with 'name' and 'skills' fields."))
    pipe.add_component("llm", generator)
    pipe.connect("prompt_builder", "llm")
    
    print("Running pipeline...")
    # Run synchronously in thread
    res = await asyncio.to_thread(
        pipe.run,
        {
            "prompt_builder": {"resume_text": "John Doe, Python Developer. Skills: Python, React."},
            "llm": {"generation_kwargs": {"format": "json"}}
        }
    )
    print("Result:", res["llm"]["replies"][0])
    
if __name__ == "__main__":
    asyncio.run(test_pipe())
