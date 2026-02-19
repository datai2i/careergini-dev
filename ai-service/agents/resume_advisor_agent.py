from .base_agent import BaseAgent
from typing import Dict, Any, List, Optional
from langchain_core.messages import SystemMessage, HumanMessage
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class ResumeAdvisorAgent(BaseAgent):
    def extract_persona(self, resume_text: str) -> Dict[str, Any]:
        """Extract detailed persona from resume text"""
        print("Resume Advisor Agent extracting persona...")
        
        system_prompt = """You are an expert Career Coach and Resume Analyst. 
        Analyze the provided resume text and extract a detailed professional persona.
        
        Return the output as a valid JSON object with the following structure:
        {
            "full_name": "extracted name or Candidate",
            "professional_title": "current or implied title",
            "years_experience": number,
            "summary": "professional summary (write one if missing)",
            "top_skills": ["skill1", "skill2", "skill3", ...],
            "experience_highlights": [
                {"role": "Title", "company": "Company", "duration": "Year-Year", "key_achievement": "Brief impact"}
            ],
            "education": [{"degree": "Degree", "school": "School"}],
            "career_level": "Entry/Mid/Senior/Executive",
            "suggested_roles": ["Job Title 1", "Job Title 2"]
        }
        """
        
        try:
            # Enforce JSON mode for robust extraction
            json_llm = self.llm.bind(format="json")
            
            response = json_llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Resume Text:\n{resume_text}")
            ])
            
            # Clean and parse JSON
            content = response.content
            
            # Robust JSON extraction
            import re
            
            def repair_json(json_str):
                # Remove comments
                json_str = re.sub(r'//.*', '', json_str)
                # Remove trailing commas
                json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
                return json_str

            json_pattern = r'\{.*\}'
            match = re.search(json_pattern, content, re.DOTALL)
            
            if match:
                json_str = match.group(0)
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    # Try repairing
                    try:
                        repaired = repair_json(json_str)
                        return json.loads(repaired)
                    except:
                        pass # Fall through to fallback
            
            # Fallback: try cleaning markdown blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            try:
                return json.loads(content.strip())
            except json.JSONDecodeError:
                 repaired = repair_json(content.strip())
                 return json.loads(repaired)

        except Exception as e:
            logger.error(f"Error extracting persona: {e}")
            logger.error(f"Raw content: {response.content}") # Log raw content for debugging
            # Return partial success data instead of failing completely
            return {
                "full_name": "Candidate (Extraction Failed)",
                "professional_title": "Professional",
                "years_experience": 0,
                "summary": f"Could not extract persona automatically. Error: {str(e)}",
                "top_skills": ["Manual review required"],
                "experience_highlights": [],
                "education": [],
                "career_level": "Unknown",
                "suggested_roles": []
            }



    async def generate_cover_letter(self, persona: Dict[str, Any], job_description: str) -> str:
        """Generate a cover letter for the job application"""
        print("Resume Advisor Agent generating cover letter...")
        
        system_prompt = """You are an expert Career Coach.
        Write a professional, compelling cover letter for the candidate applying to the job described.
        
        Guidelines:
        - Use a professional business letter format.
        - Highlight the candidate's top skills and relevant experience from their persona.
        - Explain why they are a great fit for the specific requirements in the JD.
        - Keep it concise (3-4 paragraphs).
        - Use placeholders like [Hiring Manager Name] if unknown.
        - Tone: Confident, professional, and enthusiastic.
        
        Return ONLY the text of the cover letter, starting with the salutation. Do not include markdown or explanations.
        """
        
        user_input = f"""
        Candidate Persona:
        {json.dumps(persona, indent=2)}
        
        Job Description:
        {job_description}
        """
        
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_input)
            ])
            return response.content.strip()
        except Exception as e:
            logger.error(f"Error generating cover letter: {e}")
            # Fallback to template if LLM fails
            name = persona.get("full_name", "Candidate")
            role = persona.get("professional_title", "Professional")
            return f"""Dear Hiring Manager,

I am writing to express my strong interest in the open position. As a {role} with relevant experience, I am confident in my ability to contribute effectively to your team.
(Note: AI generation of custom cover letter failed. This is a placeholder. Please try tailoring again.)

Sincerely,
{name}"""

    async def tailor_resume(self, persona: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        """Tailor resume content to a specific Job Description"""
        print("Resume Advisor Agent tailoring resume...")
        
        system_prompt = """You are an expert Resume Writer. 
        Tailor the candidate's profile to align with the target Job Description (JD).
        
        1. Rewrite the PROFESSIONAL SUMMARY to highlight relevant experience for this specific JD.
        2. Select and prioritize specific SKILLS that match the JD keywords.
        3. Rewrite 2-3 key EXPERIENCE highlights to emphasize relevant achievements.
        
        Return valid JSON:
        {
            "tailored_summary": "Rewritten summary...",
            "tailored_skills": ["Skill1", "Skill2", ...],
            "tailored_experience": [
                {"role": "Title", "company": "Company", "tailored_bullets": ["Point 1", "Point 2"]}
            ],
            "match_analysis": "Brief explanation of why this profile fits the JD"
        }
        """
        
        user_input = f"""
        Candidate Persona:
        {json.dumps(persona, indent=2)}
        
        Target Job Description:
        {job_description}
        """
        
        try:
            # Enforce JSON mode
            json_llm = self.llm.bind(format="json")
            
            response = await json_llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_input)
            ])
            
            # Clean and parse JSON
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            result = json.loads(content.strip())
            
            # Generate cover letter in parallel with tailoring if possible, 
            # but since we need the tailored content context for a better letter, 
            # we usually do it after. However, for speed, we can do it concurrently 
            # if we use the original persona.
            
            # Let's use asyncio.wait_for to prevent blocking forever
            try:
                # 15 seconds timeout for cover letter specifically to avoid hanging
                cover_letter = await asyncio.wait_for(
                    self.generate_cover_letter(persona, job_description),
                    timeout=20.0 
                )
            except asyncio.TimeoutError:
                logger.warning("Cover letter generation timed out. Using fallback.")
                name = persona.get("full_name", "Candidate")
                role = persona.get("professional_title", "Professional")
                cover_letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the open position. As a {role} with relevant experience, I am confident in my ability to contribute effectively to your team.
(Note: AI generation of custom cover letter timed out. This is a placeholder. Please try tailoring again.)

Sincerely,
{name}"""
            
            result["cover_letter"] = cover_letter
            
            return result
        except Exception as e:
            logger.error(f"Error tailoring resume: {e}")
            return {
                "tailored_summary": persona.get("summary", ""),
                "tailored_skills": persona.get("top_skills", []),
                "tailored_experience": [],
                "match_analysis": "Error generating tailored content.",
                "cover_letter": ""
            }

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Standard run method for workflow integration"""
        # This agent is mostly used directly via API endpoints, but can be part of workflow
        resume_text = state.get("resume_text", "")
        if resume_text:
            persona = self.extract_persona(resume_text)
            return {**state, "persona": persona}
        return state
