from .base_agent import BaseAgent
from typing import Dict, Any, List
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class ProfileUpdaterAgent(BaseAgent):
    async def analyze_convo(self, user_message: str, ai_response: str) -> Dict[str, Any]:
        """
        Analyze a chat turn to see if the user revealed new profile information.
        """
        if len(user_message) < 5:
            return None

        prompt = f"""
        You are a "Memory Manager" for a career coaching AI.
        Your job is to listen to the user's chat messages and exact permanent facts about their profile.
        
        Categories to track:
        1. SKILLS: New skills they learned or mentioned owning.
        2. GOALS: Specific career goals (e.g., "I want to be a CTO", "I want remote work").
        3. PREFERENCES: Job preferences like location, salary, industry.
        
        If the user message contains such info, return a JSON object:
        {{
            "has_update": true,
            "intent": "update_skills" | "update_goals" | "update_preferences",
            "data": {{
                "skills": ["..."], 
                # OR 
                "goals": ["..."],
                # OR
                "target_roles": ["..."], "target_locations": ["..."]
            }}
        }}
        
        If NO new useful info is present (e.g., questions, greetings, feedback), return:
        {{"has_update": false}}
        
        Output ONLY valid JSON.
        
        USER: {user_message}
        AI: {ai_response}
        """
        
        try:
            response = await asyncio.to_thread(self.generator.run, prompt=prompt)
            
            content = response["replies"][0]
            # Clean JSON
            import re
            json_pattern = r'\{.*\}'
            match = re.search(json_pattern, content, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                if data.get("has_update"):
                    return data
            return None
            
        except Exception as e:
            logger.error(f"Error in ProfileUpdater: {e}")
            return None
