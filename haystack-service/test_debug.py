import asyncio
import sys
sys.path.append("/app")
from haystack import Pipeline
from haystack.components.builders import PromptBuilder
from integrations.ollama_client import get_ollama_client
import json

async def test_debug():
    ollama = get_ollama_client()
    generator = ollama.get_generator("fast")
    
    prompt_template = """You are an expert Career Coach and Resume Analyst. 
Analyze the provided resume text and extract a detailed professional persona.

Return the output ONLY as a valid JSON object matching the requested schema. No other text.
Structure:
{
    "full_name": "extracted name or Candidate",
    "professional_title": "current or implied title",
    "years_experience": "number",
    "summary": "professional summary",
    "top_skills": ["skill1"],
    "experience_highlights": [
        {"role": "Title", "company": "Company", "duration": "Year-Year", "key_achievement": "Brief impact"}
    ],
    "education": [{"degree": "Degree", "school": "School"}],
    "career_level": "Entry",
    "suggested_roles": ["Job Title 1"]
}

Resume Text:
{{resume_text}}
"""
    builder = PromptBuilder(template=prompt_template)
    res = builder.run(resume_text="Jane Smith, Data Scientist. Skills: Python. 5 years exp.")
    print("PROMPT:")
    print(res["prompt"])
    
    print("\n--- LLM RUN ---")
    out = generator.run(res["prompt"])
    print("NORMAL OUTPUT:", out["replies"][0])
    
    print("\n--- LLM RUN (JSON) ---")
    out2 = generator.run(res["prompt"], generation_kwargs={"format": "json"})
    print("JSON OUTPUT:", out2["replies"][0])

if __name__ == "__main__":
    asyncio.run(test_debug())
