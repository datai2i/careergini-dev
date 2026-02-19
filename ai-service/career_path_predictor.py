"""
Career Path Predictor
Predicts career trajectories and provides roadmap recommendations
"""

from typing import Dict, List, Any, Optional
import json

class CareerPathPredictor:
    def __init__(self):
        # Career progression paths (simplified - can be ML model in production)
        self.career_paths = {
            'software_engineer': {
                'levels': [
                    {
                        'title': 'Junior Software Engineer',
                        'years_experience': '0-2',
                        'avg_salary': 75000,
                        'key_skills': ['Programming', 'Version Control', 'Testing'],
                        'responsibilities': ['Write code', 'Fix bugs', 'Learn from seniors']
                    },
                    {
                        'title': 'Software Engineer',
                        'years_experience': '2-4',
                        'avg_salary': 105000,
                        'key_skills': ['System Design', 'Code Review', 'Mentoring'],
                        'responsibilities': ['Design features', 'Review code', 'Mentor juniors']
                    },
                    {
                        'title': 'Senior Software Engineer',
                        'years_experience': '4-7',
                        'avg_salary': 145000,
                        'key_skills': ['Architecture', 'Leadership', 'Technical Strategy'],
                        'responsibilities': ['Design systems', 'Lead projects', 'Technical decisions']
                    },
                    {
                        'title': 'Staff Engineer / Engineering Manager',
                        'years_experience': '7-10',
                        'avg_salary': 185000,
                        'key_skills': ['Strategic Planning', 'Team Leadership', 'Cross-functional'],
                        'responsibilities': ['Set technical direction', 'Manage teams', 'Drive initiatives']
                    },
                    {
                        'title': 'Principal Engineer / Director',
                        'years_experience': '10+',
                        'avg_salary': 230000,
                        'key_skills': ['Org-wide Impact', 'Innovation', 'Executive Communication'],
                        'responsibilities': ['Company-wide tech strategy', 'Major initiatives', 'Thought leadership']
                    }
                ],
                'alternative_paths': [
                    {
                        'path': 'Technical Leadership',
                        'roles': ['Tech Lead', 'Staff Engineer', 'Principal Engineer', 'CTO']
                    },
                    {
                        'path': 'People Management',
                        'roles': ['Engineering Manager', 'Senior Manager', 'Director', 'VP Engineering']
                    },
                    {
                        'path': 'Product/Startup',
                        'roles': ['Product Manager', 'Technical PM', 'Founder', 'CEO']
                    }
                ]
            },
            'data_scientist': {
                'levels': [
                    {
                        'title': 'Junior Data Scientist',
                        'years_experience': '0-2',
                        'avg_salary': 80000,
                        'key_skills': ['Python', 'Statistics', 'SQL', 'Data Visualization'],
                        'responsibilities': ['Data analysis', 'Build models', 'Create reports']
                    },
                    {
                        'title': 'Data Scientist',
                        'years_experience': '2-5',
                        'avg_salary': 120000,
                        'key_skills': ['Machine Learning', 'Feature Engineering', 'A/B Testing'],
                        'responsibilities': ['Own projects', 'Deploy models', 'Collaborate with stakeholders']
                    },
                    {
                        'title': 'Senior Data Scientist',
                        'years_experience': '5-8',
                        'avg_salary': 160000,
                        'key_skills': ['Deep Learning', 'MLOps', 'Business Strategy'],
                        'responsibilities': ['Lead initiatives', 'Mentor team', 'Drive business impact']
                    },
                    {
                        'title': 'Lead Data Scientist / ML Manager',
                        'years_experience': '8+',
                        'avg_salary': 200000,
                        'key_skills': ['Team Leadership', 'Strategic Planning', 'Cross-functional'],
                        'responsibilities': ['Manage team', 'Set ML strategy', 'Executive communication']
                    }
                ],
                'alternative_paths': [
                    {
                        'path': 'ML Engineering',
                        'roles': ['ML Engineer', 'Senior ML Engineer', 'ML Architect']
                    },
                    {
                        'path': 'Research',
                        'roles': ['Research Scientist', 'Senior Researcher', 'Research Director']
                    },
                    {
                        'path': 'Leadership',
                        'roles': ['Data Science Manager', 'Director of DS', 'VP of AI/ML']
                    }
                ]
            }
        }
    
    def predict_path(
        self,
        user_profile: Dict[str, Any],
        target_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Predict career path based on user profile
        
        Args:
            user_profile: User's current profile
            target_role: Optional target role category
        
        Returns:
            Career path prediction with timeline and milestones
        """
        # Determine current level
        current_level = self._determine_current_level(user_profile)
        
        # Get career path
        role_category = target_role or self._infer_role_category(user_profile)
        path_data = self.career_paths.get(role_category, self.career_paths['software_engineer'])
        
        # Generate progression timeline
        timeline = self._generate_timeline(current_level, path_data['levels'])
        
        # Calculate success probability
        success_probability = self._calculate_success_probability(user_profile, current_level)
        
        # Generate milestones
        milestones = self._generate_milestones(current_level, path_data['levels'])
        
        # Salary projections
        salary_projection = self._project_salary(current_level, path_data['levels'])
        
        return {
            "current_level": current_level,
            "role_category": role_category,
            "timeline": timeline,
            "success_probability": success_probability,
            "milestones": milestones,
            "salary_projection": salary_projection,
            "alternative_paths": path_data.get('alternative_paths', []),
            "recommendations": self._generate_path_recommendations(current_level, user_profile)
        }
    
    def _determine_current_level(self, user_profile: Dict[str, Any]) -> int:
        """Determine user's current career level (0-4)"""
        experience = user_profile.get('experience', [])
        years = len(experience) * 2  # Simplified calculation
        
        if years < 2:
            return 0  # Junior
        elif years < 4:
            return 1  # Mid
        elif years < 7:
            return 2  # Senior
        elif years < 10:
            return 3  # Staff/Manager
        else:
            return 4  # Principal/Director
    
    def _infer_role_category(self, user_profile: Dict[str, Any]) -> str:
        """Infer role category from profile"""
        skills = [s.lower() for s in user_profile.get('skills', [])]
        
        # Simple keyword matching
        if any(skill in skills for skill in ['machine learning', 'data science', 'statistics']):
            return 'data_scientist'
        
        return 'software_engineer'  # Default
    
    def _generate_timeline(
        self,
        current_level: int,
        levels: List[Dict]
    ) -> List[Dict]:
        """Generate career progression timeline"""
        timeline = []
        current_year = 0
        
        for i in range(current_level, len(levels)):
            level = levels[i]
            
            # Parse years from experience range
            years_range = level['years_experience']
            if '-' in years_range:
                min_years, max_years = years_range.split('-')
                duration = int(max_years) - int(min_years)
            else:
                duration = 3  # Default
            
            timeline.append({
                "level": i,
                "title": level['title'],
                "years_from_now": current_year,
                "duration_years": duration,
                "salary": level['avg_salary'],
                "key_skills_needed": level['key_skills']
            })
            
            current_year += duration
        
        return timeline
    
    def _calculate_success_probability(
        self,
        user_profile: Dict[str, Any],
        current_level: int
    ) -> int:
        """Calculate probability of reaching next level (0-100)"""
        # Factors: skills, education, experience quality
        base_probability = 70
        
        # Adjust for skills
        skills_count = len(user_profile.get('skills', []))
        if skills_count > 10:
            base_probability += 10
        elif skills_count < 5:
            base_probability -= 10
        
        # Adjust for education
        education = user_profile.get('education', [])
        if any('master' in str(edu).lower() or 'phd' in str(edu).lower() for edu in education):
            base_probability += 10
        
        # Adjust for current level (harder to progress at higher levels)
        base_probability -= current_level * 5
        
        return max(30, min(95, base_probability))
    
    def _generate_milestones(
        self,
        current_level: int,
        levels: List[Dict]
    ) -> List[Dict]:
        """Generate key milestones for career progression"""
        if current_level >= len(levels) - 1:
            return []
        
        next_level = levels[current_level + 1]
        
        milestones = [
            {
                "milestone": f"Master {next_level['key_skills'][0]}",
                "type": "skill",
                "timeline": "3-6 months",
                "importance": "critical"
            },
            {
                "milestone": "Lead a major project",
                "type": "experience",
                "timeline": "6-12 months",
                "importance": "high"
            },
            {
                "milestone": "Mentor junior team members",
                "type": "leadership",
                "timeline": "Ongoing",
                "importance": "high"
            },
            {
                "milestone": "Build strong network",
                "type": "networking",
                "timeline": "Ongoing",
                "importance": "medium"
            }
        ]
        
        return milestones
    
    def _project_salary(
        self,
        current_level: int,
        levels: List[Dict]
    ) -> Dict[str, Any]:
        """Project salary growth over time"""
        projections = []
        
        for i in range(current_level, min(current_level + 3, len(levels))):
            level = levels[i]
            years_from_now = (i - current_level) * 3  # Assume 3 years per level
            
            projections.append({
                "year": years_from_now,
                "title": level['title'],
                "salary": level['avg_salary'],
                "salary_range": {
                    "min": int(level['avg_salary'] * 0.8),
                    "max": int(level['avg_salary'] * 1.2)
                }
            })
        
        return {
            "projections": projections,
            "total_growth": projections[-1]['salary'] - projections[0]['salary'] if projections else 0,
            "growth_percentage": int(((projections[-1]['salary'] / projections[0]['salary']) - 1) * 100) if projections and projections[0]['salary'] > 0 else 0
        }
    
    def _generate_path_recommendations(
        self,
        current_level: int,
        user_profile: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable career path recommendations"""
        recommendations = []
        
        if current_level == 0:
            recommendations.append("Focus on building strong technical fundamentals")
            recommendations.append("Seek mentorship from senior engineers")
            recommendations.append("Contribute to open source projects")
        elif current_level == 1:
            recommendations.append("Start leading small projects")
            recommendations.append("Develop system design skills")
            recommendations.append("Begin mentoring junior developers")
        elif current_level == 2:
            recommendations.append("Choose between technical leadership or management track")
            recommendations.append("Build cross-functional collaboration skills")
            recommendations.append("Develop strategic thinking abilities")
        else:
            recommendations.append("Focus on org-wide impact")
            recommendations.append("Build executive communication skills")
            recommendations.append("Drive innovation and thought leadership")
        
        recommendations.append("Network actively in your industry")
        recommendations.append("Keep learning new technologies and trends")
        
        return recommendations


# Utility function for API endpoint
def predict_career_path(
    user_profile: Dict[str, Any],
    target_role: Optional[str] = None
) -> Dict[str, Any]:
    """
    Predict career path for user
    
    Args:
        user_profile: User's profile data
        target_role: Optional target role category
    
    Returns:
        Career path prediction with timeline and recommendations
    """
    predictor = CareerPathPredictor()
    return predictor.predict_path(user_profile, target_role)
