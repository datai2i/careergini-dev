
import json
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class PersonaManager:
    """
    Manages the User's "Golden Record" - a unified profile aggregated from:
    1. Resume Parsing (High trust for history/skills)
    2. LinkedIn Scraping (High trust for current role)
    3. Chat Interactions (High trust for goals/preferences)
    """
    
    def __init__(self, user_id: str, base_dir: Optional[str] = None):
        self.user_id = user_id
        self.base_dir = base_dir or f"uploads/{user_id}"
        self.profile_path = f"{self.base_dir}/unified_profile.json"
        
        # Ensure directory exists
        os.makedirs(self.base_dir, exist_ok=True)
        
        # Load or initialize profile
        self.profile = self._load_profile()

    def _load_profile(self) -> Dict[str, Any]:
        """Load profile from disk or create empty one"""
        if os.path.exists(self.profile_path):
            try:
                with open(self.profile_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading profile for {self.user_id}: {e}")
        
        # Default empty schema
        return {
            "identity": {
                "full_name": "",
                "professional_title": "",
                "email": "",
                "phone": "",
                "location": ""
            },
            "skills": [],
            "experience": [],
            "education": [],
            "goals": [],
            "job_preferences": {
                "target_roles": [],
                "target_locations": [],
                "remote_preference": "hybrid",
                "min_salary": 0
            },
            "meta": {
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "sources": []
            }
        }

    def save(self):
        """Persist profile to disk"""
        self.profile["meta"]["updated_at"] = datetime.now().isoformat()
        try:
            with open(self.profile_path, "w") as f:
                json.dump(self.profile, f, indent=2)
            logger.info(f"Saved unified profile for {self.user_id}")
        except Exception as e:
            logger.error(f"Error saving profile: {e}")

    def ingest_resume_data(self, resume_data: Dict[str, Any]):
        """Merge data from parsed resume"""
        logger.info("Merging resume data into persona")
        
        # Update Identity if empty or from resume (resume usually authoritative for basic info)
        if hasattr(resume_data, "get"):
             full_name = resume_data.get("full_name") or resume_data.get("name")
             if full_name: self.profile["identity"]["full_name"] = full_name
             
             title = resume_data.get("professional_title") or resume_data.get("title")
             if title: self.profile["identity"]["professional_title"] = title
             
             email = resume_data.get("email")
             if email: self.profile["identity"]["email"] = email
             
             phone = resume_data.get("phone")
             if phone: self.profile["identity"]["phone"] = phone
             
             location = resume_data.get("location")
             if location: self.profile["identity"]["location"] = location

             # Merge Skills (Union)
             new_skills = resume_data.get("top_skills") or resume_data.get("skills") or []
             if new_skills:
                 current_skills = set(self.profile["skills"])
                 current_skills.update(new_skills)
                 self.profile["skills"] = list(current_skills)

             # Replace Experience (Resume usually has the best structured experience)
             experience = resume_data.get("experience_highlights") or resume_data.get("experience")
             if experience:
                 self.profile["experience"] = experience

             # Replace Education
             education = resume_data.get("education")
             if education:
                 self.profile["education"] = education

             self._add_source("resume")
             self.save()

    def update_from_chat(self, intent: str, data: Dict[str, Any]):
        """
        Update specific fields based on chat interaction.
        intent: 'update_goals', 'update_skills', 'update_preferences'
        """
        if intent == "update_goals":
            new_goals = data.get("goals", [])
            current_goals = set(self.profile["goals"])
            current_goals.update(new_goals)
            self.profile["goals"] = list(current_goals)
            
        elif intent == "update_skills":
            new_skills = data.get("skills", [])
            current_skills = set(self.profile["skills"])
            current_skills.update(new_skills)
            self.profile["skills"] = list(current_skills)
            
        elif intent == "update_preferences":
            # Deep merge preferences
            for k, v in data.items():
                if k in self.profile["job_preferences"]:
                    self.profile["job_preferences"][k] = v
                    
        self._add_source("chat")
        self.save()

    def get_context_for_llm(self) -> str:
        """Generate a concise context string for LLM system prompt"""
        p = self.profile
        identity = p["identity"]
        
        context = f"""
USER PROFILE:
Name: {identity.get('full_name', 'User')}
Title: {identity.get('professional_title', 'Professional')}
Location: {identity.get('location', 'Unknown')}
Skills: {', '.join(p['skills'][:20])}  # Top 20 skills
Goals: {', '.join(p['goals'])}
Job Preferences: {p['job_preferences']}
"""
        return context

    def _add_source(self, source_name: str):
        if source_name not in self.profile["meta"]["sources"]:
            self.profile["meta"]["sources"].append(source_name)
