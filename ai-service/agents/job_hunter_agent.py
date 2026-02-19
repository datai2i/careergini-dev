from .base_agent import BaseAgent
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
import json
import logging
import random

logger = logging.getLogger(__name__)

class JobHunterAgent(BaseAgent):
    def find_opportunities(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find job opportunities based on criteria.
        
        Args:
            criteria: {
                "role": "Software Engineer",
                "location": "Remote",
                "skills": ["Python", "React"]
            }
        """
        logger.info(f"Job Hunter searching for: {criteria}")
        
        # In a real implementation, this would scrape LinkedIn, Indeed, etc.
        # For now, we'll generate realistic mock opportunities based on the criteria
        
        role = criteria.get("role", "Software Engineer")
        location = criteria.get("location", "Remote")
        
        opportunities = [
            {
                "id": "job_101",
                "title": f"Senior {role}",
                "company": "TechFlow Systems",
                "location": location,
                "posted_date": "2 days ago",
                "match_score": 92,
                "salary": "$140k - $180k",
                "description": f"We are looking for a {role} with experience in Python and Cloud Architecture...",
                "source": "LinkedIn"
            },
            {
                "id": "job_102",
                "title": f"{role} II",
                "company": "DataDrive Inc",
                "location": location,
                "posted_date": "5 hours ago",
                "match_score": 88,
                "salary": "$120k - $150k",
                "description": f"Join our fast-paced team as a {role}. Must have strong problem-solving skills...",
                "source": "Direct"
            },
            {
                "id": "job_103",
                "title": f"Lead {role}",
                "company": "InnovateAI",
                "location": "Hybrid",
                "posted_date": "1 day ago",
                "match_score": 85,
                "salary": "$160k - $210k",
                "description": f"Leading the future of AI. Seeking a {role} to drive our core platform...",
                "source": "Aggregator"
            }
        ]
        
        return opportunities

    def draft_application(self, user_profile: Dict[str, Any], job_details: Dict[str, Any]) -> Dict[str, Any]:
        """Draft a shadow application for a specific job"""
        logger.info(f"Drafting application for {job_details.get('company')}")
        
        system_prompt = """You are an expert Career Agent. 
        Draft a high-conversion Job Application for the candidate.
        
        Output JSON with:
        1. tailored_resume_summary: A 2-3 sentence summary tailored to the job.
        2. cover_letter: A compelling, 3-paragraph cover letter.
        3. outreach_message: A short LinkedIn connection message to the hiring manager.
        4. interview_prep_tips: 3 specific tips for interviewing with this company/role.
        """
        
        user_input = f"""
        Candidate Profile:
        {json.dumps(user_profile, indent=2)}
        
        Job Details:
        {json.dumps(job_details, indent=2)}
        """
        
        try:
            response = self.llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_input)
            ])
            
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            result = json.loads(content.strip())
            return {
                "status": "ready",
                "application_package": result,
                "job_id": job_details.get("id")
            }
            
        except Exception as e:
            logger.error(f"Error drafting application: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
