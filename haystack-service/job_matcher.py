"""
Job Matching Engine
Calculates match scores between user profiles and job postings
"""

from typing import Dict, List, Any, Set
import re
from difflib import SequenceMatcher

class JobMatcher:
    def __init__(self):
        # Experience level mappings
        self.experience_levels = {
            'entry': (0, 2),
            'junior': (1, 3),
            'mid': (3, 5),
            'senior': (5, 10),
            'lead': (8, 15),
            'principal': (10, 20)
        }
    
    def calculate_match_score(
        self, 
        user_profile: Dict[str, Any], 
        job_posting: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive match score between user and job
        
        Args:
            user_profile: User's profile data
            job_posting: Job posting details
        
        Returns:
            Match analysis with score and breakdown
        """
        # Calculate individual component scores
        skills_score = self._match_skills(
            user_profile.get('skills', []),
            job_posting.get('required_skills', []),
            job_posting.get('preferred_skills', [])
        )
        
        experience_score = self._match_experience(
            user_profile.get('experience', []),
            job_posting.get('experience_required', ''),
            job_posting.get('years_required', 0)
        )
        
        education_score = self._match_education(
            user_profile.get('education', []),
            job_posting.get('education_required', '')
        )
        
        location_score = self._match_location(
            user_profile.get('location', ''),
            user_profile.get('preferences', {}).get('remote', False),
            job_posting.get('location', ''),
            job_posting.get('remote', False)
        )
        
        salary_score = self._match_salary(
            user_profile.get('preferences', {}).get('min_salary', 0),
            user_profile.get('preferences', {}).get('max_salary', 999999),
            job_posting.get('salary_min', 0),
            job_posting.get('salary_max', 999999)
        )
        
        # Calculate weighted overall score
        overall_score = int(
            skills_score['score'] * 0.40 +
            experience_score['score'] * 0.25 +
            education_score['score'] * 0.15 +
            location_score['score'] * 0.10 +
            salary_score['score'] * 0.10
        )
        
        # Generate match explanation
        explanation = self._generate_explanation(
            overall_score,
            skills_score,
            experience_score,
            education_score,
            location_score,
            salary_score
        )
        
        return {
            "overall_score": overall_score,
            "match_level": self._get_match_level(overall_score),
            "breakdown": {
                "skills": skills_score,
                "experience": experience_score,
                "education": education_score,
                "location": location_score,
                "salary": salary_score
            },
            "explanation": explanation,
            "recommendation": self._get_recommendation(overall_score)
        }
    
    def _match_skills(
        self, 
        user_skills: List[str], 
        required_skills: List[str],
        preferred_skills: List[str]
    ) -> Dict[str, Any]:
        """Match user skills against job requirements"""
        user_skills_lower = {skill.lower() for skill in user_skills}
        required_lower = {skill.lower() for skill in required_skills}
        preferred_lower = {skill.lower() for skill in preferred_skills}
        
        # Calculate matches
        required_matched = user_skills_lower.intersection(required_lower)
        preferred_matched = user_skills_lower.intersection(preferred_lower)
        
        required_missing = required_lower - user_skills_lower
        preferred_missing = preferred_lower - user_skills_lower
        
        # Calculate score
        if not required_lower:
            score = 100
        else:
            required_match_pct = len(required_matched) / len(required_lower) * 100
            preferred_match_pct = len(preferred_matched) / len(preferred_lower) * 100 if preferred_lower else 100
            
            # 80% weight on required, 20% on preferred
            score = int(required_match_pct * 0.8 + preferred_match_pct * 0.2)
        
        return {
            "score": score,
            "required_matched": list(required_matched),
            "required_missing": list(required_missing),
            "preferred_matched": list(preferred_matched),
            "preferred_missing": list(preferred_missing),
            "match_percentage": len(required_matched) / len(required_lower) * 100 if required_lower else 100
        }
    
    def _match_experience(
        self, 
        user_experience: List[Dict], 
        experience_level: str,
        years_required: int
    ) -> Dict[str, Any]:
        """Match user experience against job requirements"""
        # Calculate total years of experience
        total_years = self._calculate_years_experience(user_experience)
        
        # Parse experience level requirement
        level_lower = experience_level.lower()
        required_years = years_required
        
        # If no specific years, infer from level
        if not required_years:
            for level, (min_years, max_years) in self.experience_levels.items():
                if level in level_lower:
                    required_years = min_years
                    break
        
        # Calculate score
        if total_years >= required_years:
            # Meets or exceeds requirement
            if total_years <= required_years * 1.5:
                score = 100
            else:
                # Overqualified
                score = 90
        else:
            # Under-qualified
            gap = required_years - total_years
            score = max(0, int(100 - (gap / required_years * 50)))
        
        return {
            "score": score,
            "user_years": total_years,
            "required_years": required_years,
            "gap": max(0, required_years - total_years),
            "status": "qualified" if total_years >= required_years else "under-qualified"
        }
    
    def _calculate_years_experience(self, experience: List[Dict]) -> float:
        """Calculate total years of professional experience"""
        # Simple calculation - can be enhanced with date parsing
        return len(experience) * 2  # Assume 2 years per position on average
    
    def _match_education(
        self, 
        user_education: List[Dict], 
        education_required: str
    ) -> Dict[str, Any]:
        """Match user education against job requirements"""
        if not education_required:
            return {"score": 100, "status": "not_required"}
        
        required_lower = education_required.lower()
        
        # Education level hierarchy
        education_hierarchy = {
            'high school': 1,
            'associate': 2,
            'bachelor': 3,
            'master': 4,
            'mba': 4,
            'phd': 5,
            'doctorate': 5
        }
        
        # Find user's highest education level
        user_level = 0
        for edu in user_education:
            degree = edu.get('degree', '').lower()
            for level_name, level_value in education_hierarchy.items():
                if level_name in degree:
                    user_level = max(user_level, level_value)
        
        # Find required education level
        required_level = 0
        for level_name, level_value in education_hierarchy.items():
            if level_name in required_lower:
                required_level = level_value
                break
        
        # Calculate score
        if user_level >= required_level:
            score = 100
        elif user_level == required_level - 1:
            score = 75  # One level below
        else:
            score = 50  # Significantly below
        
        return {
            "score": score,
            "user_level": user_level,
            "required_level": required_level,
            "status": "qualified" if user_level >= required_level else "under-qualified"
        }
    
    def _match_location(
        self, 
        user_location: str, 
        user_remote_pref: bool,
        job_location: str, 
        job_remote: bool
    ) -> Dict[str, Any]:
        """Match location preferences"""
        # Remote job - always good match if user wants remote
        if job_remote:
            score = 100 if user_remote_pref else 90
            return {"score": score, "status": "remote", "compatible": True}
        
        # On-site job
        if not user_location or not job_location:
            return {"score": 75, "status": "unknown", "compatible": True}
        
        # Simple location matching (can be enhanced with geocoding)
        user_loc_lower = user_location.lower()
        job_loc_lower = job_location.lower()
        
        # Extract city/state
        user_parts = set(user_loc_lower.split(','))
        job_parts = set(job_loc_lower.split(','))
        
        # Check for overlap
        if user_parts.intersection(job_parts):
            score = 100
            status = "same_location"
        else:
            # Different locations
            score = 50 if not user_remote_pref else 30
            status = "different_location"
        
        return {
            "score": score,
            "status": status,
            "compatible": score >= 50
        }
    
    def _match_salary(
        self, 
        user_min: int, 
        user_max: int,
        job_min: int, 
        job_max: int
    ) -> Dict[str, Any]:
        """Match salary expectations"""
        if not job_min and not job_max:
            return {"score": 100, "status": "not_specified"}
        
        # Check if ranges overlap
        if job_max >= user_min and job_min <= user_max:
            # Ranges overlap
            overlap_min = max(job_min, user_min)
            overlap_max = min(job_max, user_max)
            overlap_size = overlap_max - overlap_min
            
            # Score based on overlap size
            user_range = user_max - user_min
            if user_range > 0:
                overlap_pct = overlap_size / user_range
                score = int(min(100, 70 + overlap_pct * 30))
            else:
                score = 100
            
            status = "compatible"
        else:
            # No overlap
            if job_max < user_min:
                score = 30  # Job pays less than user wants
                status = "below_expectations"
            else:
                score = 50  # Job requires more than user expects
                status = "above_expectations"
        
        return {
            "score": score,
            "status": status,
            "compatible": score >= 50
        }
    
    def _generate_explanation(
        self, 
        overall_score: int,
        skills: Dict,
        experience: Dict,
        education: Dict,
        location: Dict,
        salary: Dict
    ) -> Dict[str, List[str]]:
        """Generate human-readable match explanation"""
        strengths = []
        weaknesses = []
        
        # Skills
        if skills['score'] >= 80:
            strengths.append(f"Strong skill match ({len(skills['required_matched'])} of {len(skills['required_matched']) + len(skills['required_missing'])} required skills)")
        elif skills['score'] >= 60:
            weaknesses.append(f"Missing {len(skills['required_missing'])} required skills: {', '.join(list(skills['required_missing'])[:3])}")
        else:
            weaknesses.append(f"Significant skill gap - missing {len(skills['required_missing'])} key skills")
        
        # Experience
        if experience['score'] >= 90:
            strengths.append(f"Experience level matches requirements ({experience['user_years']} years)")
        elif experience['gap'] > 0:
            weaknesses.append(f"Need {experience['gap']} more years of experience")
        
        # Education
        if education['score'] >= 90:
            strengths.append("Education requirements met")
        elif education['status'] == 'under-qualified':
            weaknesses.append("Education level below requirements")
        
        # Location
        if location['score'] >= 90:
            strengths.append("Location compatible")
        elif not location['compatible']:
            weaknesses.append("Location mismatch - may require relocation")
        
        # Salary
        if salary['score'] >= 70:
            strengths.append("Salary range aligns with expectations")
        elif salary['status'] == 'below_expectations':
            weaknesses.append("Salary below your expectations")
        
        return {
            "strengths": strengths,
            "weaknesses": weaknesses
        }
    
    def _get_match_level(self, score: int) -> str:
        """Get match level category"""
        if score >= 90:
            return "excellent"
        elif score >= 75:
            return "good"
        elif score >= 60:
            return "fair"
        else:
            return "poor"
    
    def _get_recommendation(self, score: int) -> str:
        """Get application recommendation"""
        if score >= 80:
            return "Highly recommended - Apply now!"
        elif score >= 65:
            return "Good match - Consider applying"
        elif score >= 50:
            return "Moderate match - Apply if interested"
        else:
            return "Low match - Consider improving skills first"


# Utility function for API endpoint
def match_job(user_profile: Dict[str, Any], job_posting: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate match score between user and job
    
    Args:
        user_profile: User's profile data
        job_posting: Job posting details
    
    Returns:
        Match analysis with score and breakdown
    """
    matcher = JobMatcher()
    return matcher.calculate_match_score(user_profile, job_posting)
