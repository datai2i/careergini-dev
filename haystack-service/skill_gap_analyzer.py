"""
Skill Gap Analysis Engine
Analyzes user skills vs target role requirements and generates learning paths
"""

from typing import Dict, List, Any, Set
import json

class SkillGapAnalyzer:
    def __init__(self):
        # Common role requirements database (can be expanded with real data)
        self.role_requirements = {
            'software_engineer': {
                'required_skills': ['Programming', 'Data Structures', 'Algorithms', 'Version Control'],
                'preferred_skills': ['System Design', 'Testing', 'CI/CD'],
                'tools': ['Git', 'IDE'],
                'soft_skills': ['Problem Solving', 'Communication', 'Teamwork']
            },
            'data_scientist': {
                'required_skills': ['Python', 'Statistics', 'Machine Learning', 'Data Analysis'],
                'preferred_skills': ['Deep Learning', 'Big Data', 'Cloud Computing'],
                'tools': ['Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow'],
                'soft_skills': ['Analytical Thinking', 'Communication', 'Business Acumen']
            },
            'frontend_developer': {
                'required_skills': ['HTML', 'CSS', 'JavaScript', 'React'],
                'preferred_skills': ['TypeScript', 'State Management', 'Testing'],
                'tools': ['Git', 'Webpack', 'npm'],
                'soft_skills': ['Attention to Detail', 'Creativity', 'User Empathy']
            }
        }
        
        # Learning time estimates (in weeks)
        self.learning_times = {
            'beginner': 8,
            'intermediate': 12,
            'advanced': 16
        }
    
    def analyze_gaps(
        self, 
        user_profile: Dict[str, Any], 
        target_role: str
    ) -> Dict[str, Any]:
        """
        Analyze skill gaps between user and target role
        
        Args:
            user_profile: User's profile with skills, experience, education
            target_role: Target role identifier
        
        Returns:
            Comprehensive gap analysis with learning recommendations
        """
        # Get role requirements
        requirements = self._get_role_requirements(target_role)
        
        # Extract user skills
        user_skills = set(skill.lower() for skill in user_profile.get('skills', []))
        
        # Categorize gaps
        gaps = self._categorize_gaps(user_skills, requirements)
        
        # Calculate readiness score
        readiness_score = self._calculate_readiness(gaps, requirements)
        
        # Generate learning path
        learning_path = self._generate_learning_path(gaps, user_profile)
        
        # Estimate time to ready
        time_estimate = self._estimate_time_to_ready(gaps)
        
        # Prioritize skills by ROI
        priority_skills = self._prioritize_skills(gaps)
        
        return {
            "readiness_score": readiness_score,
            "target_role": target_role,
            "gaps": {
                "critical_missing": gaps['critical_missing'],
                "nice_to_have_missing": gaps['nice_to_have_missing'],
                "transferable": gaps['transferable'],
                "strengths": gaps['strengths']
            },
            "learning_path": learning_path,
            "estimated_time_months": time_estimate,
            "priority_skills": priority_skills,
            "recommendations": self._generate_recommendations(gaps, readiness_score)
        }
    
    def _get_role_requirements(self, target_role: str) -> Dict[str, List[str]]:
        """Get requirements for target role"""
        role_key = target_role.lower().replace(' ', '_')
        
        if role_key in self.role_requirements:
            return self.role_requirements[role_key]
        
        # Default requirements if role not found
        return {
            'required_skills': [],
            'preferred_skills': [],
            'tools': [],
            'soft_skills': []
        }
    
    def _categorize_gaps(
        self, 
        user_skills: Set[str], 
        requirements: Dict[str, List[str]]
    ) -> Dict[str, List[Dict]]:
        """Categorize skills into gaps and strengths"""
        required_lower = {skill.lower() for skill in requirements['required_skills']}
        preferred_lower = {skill.lower() for skill in requirements['preferred_skills']}
        tools_lower = {tool.lower() for tool in requirements['tools']}
        
        # Critical missing skills
        critical_missing = []
        for skill in requirements['required_skills']:
            if skill.lower() not in user_skills:
                critical_missing.append({
                    "skill": skill,
                    "category": "technical",
                    "importance": "critical",
                    "learning_time_weeks": 8,
                    "roi": "high"
                })
        
        # Nice-to-have missing skills
        nice_to_have_missing = []
        for skill in requirements['preferred_skills']:
            if skill.lower() not in user_skills:
                nice_to_have_missing.append({
                    "skill": skill,
                    "category": "technical",
                    "importance": "preferred",
                    "learning_time_weeks": 6,
                    "roi": "medium"
                })
        
        # Transferable skills (user has from required)
        transferable = []
        for skill in requirements['required_skills']:
            if skill.lower() in user_skills:
                transferable.append({
                    "skill": skill,
                    "category": "technical",
                    "status": "proficient"
                })
        
        # Strengths (user has from preferred)
        strengths = []
        for skill in requirements['preferred_skills']:
            if skill.lower() in user_skills:
                strengths.append({
                    "skill": skill,
                    "category": "technical",
                    "status": "advanced"
                })
        
        return {
            "critical_missing": critical_missing,
            "nice_to_have_missing": nice_to_have_missing,
            "transferable": transferable,
            "strengths": strengths
        }
    
    def _calculate_readiness(
        self, 
        gaps: Dict[str, List], 
        requirements: Dict[str, List[str]]
    ) -> int:
        """Calculate readiness score (0-100)"""
        total_required = len(requirements['required_skills'])
        total_preferred = len(requirements['preferred_skills'])
        
        if total_required == 0:
            return 100
        
        # Score based on required skills
        required_met = len(gaps['transferable'])
        required_score = (required_met / total_required) * 70
        
        # Bonus for preferred skills
        preferred_met = len(gaps['strengths'])
        preferred_score = (preferred_met / max(total_preferred, 1)) * 30 if total_preferred > 0 else 30
        
        return int(required_score + preferred_score)
    
    def _generate_learning_path(
        self, 
        gaps: Dict[str, List], 
        user_profile: Dict[str, Any]
    ) -> List[Dict]:
        """Generate structured learning path"""
        path = []
        
        # Phase 1: Critical skills
        if gaps['critical_missing']:
            path.append({
                "phase": 1,
                "name": "Foundation Skills",
                "duration_weeks": 8,
                "skills": [skill['skill'] for skill in gaps['critical_missing'][:3]],
                "goals": [
                    "Master core required skills",
                    "Build foundational projects",
                    "Pass skill assessments"
                ],
                "resources": self._get_learning_resources(gaps['critical_missing'][:3])
            })
        
        # Phase 2: Additional required skills
        if len(gaps['critical_missing']) > 3:
            path.append({
                "phase": 2,
                "name": "Advanced Required Skills",
                "duration_weeks": 6,
                "skills": [skill['skill'] for skill in gaps['critical_missing'][3:]],
                "goals": [
                    "Complete all required skills",
                    "Build intermediate projects"
                ],
                "resources": self._get_learning_resources(gaps['critical_missing'][3:])
            })
        
        # Phase 3: Preferred skills
        if gaps['nice_to_have_missing']:
            path.append({
                "phase": len(path) + 1,
                "name": "Competitive Edge Skills",
                "duration_weeks": 6,
                "skills": [skill['skill'] for skill in gaps['nice_to_have_missing'][:3]],
                "goals": [
                    "Stand out from other candidates",
                    "Build portfolio projects"
                ],
                "resources": self._get_learning_resources(gaps['nice_to_have_missing'][:3])
            })
        
        return path
    
    def _get_learning_resources(self, skills: List[Dict]) -> List[Dict]:
        """Get learning resources for skills"""
        resources = []
        
        for skill_obj in skills:
            skill = skill_obj['skill']
            resources.append({
                "skill": skill,
                "courses": [
                    {
                        "name": f"{skill} Fundamentals",
                        "platform": "Coursera",
                        "duration": "4 weeks",
                        "level": "Beginner"
                    },
                    {
                        "name": f"Advanced {skill}",
                        "platform": "Udemy",
                        "duration": "6 weeks",
                        "level": "Intermediate"
                    }
                ],
                "practice": [
                    {
                        "name": f"{skill} Exercises",
                        "platform": "LeetCode" if skill in ['Algorithms', 'Data Structures'] else "HackerRank",
                        "type": "Practice Problems"
                    }
                ],
                "projects": [
                    {
                        "name": f"Build a {skill} Project",
                        "difficulty": "Intermediate",
                        "estimated_hours": 20
                    }
                ]
            })
        
        return resources
    
    def _estimate_time_to_ready(self, gaps: Dict[str, List]) -> int:
        """Estimate months to become job-ready"""
        critical_count = len(gaps['critical_missing'])
        preferred_count = len(gaps['nice_to_have_missing'])
        
        # Assume 8 weeks per critical skill, 4 weeks per preferred
        total_weeks = (critical_count * 8) + (preferred_count * 4)
        
        # Convert to months, with some parallelization
        months = max(1, int(total_weeks / 4 * 0.7))  # 30% efficiency from parallel learning
        
        return months
    
    def _prioritize_skills(self, gaps: Dict[str, List]) -> List[Dict]:
        """Prioritize skills by ROI (market demand, salary impact, learning time)"""
        all_missing = gaps['critical_missing'] + gaps['nice_to_have_missing']
        
        # Sort by importance (critical first) and learning time (shorter first)
        prioritized = sorted(
            all_missing,
            key=lambda x: (
                0 if x['importance'] == 'critical' else 1,
                x['learning_time_weeks']
            )
        )
        
        # Add priority rank and ROI score
        for i, skill in enumerate(prioritized):
            skill['priority_rank'] = i + 1
            skill['roi_score'] = self._calculate_roi(skill)
        
        return prioritized[:5]  # Top 5 priority skills
    
    def _calculate_roi(self, skill: Dict) -> int:
        """Calculate ROI score for a skill (0-100)"""
        # Simple heuristic: critical skills = 90, preferred = 70
        # Adjust by learning time (shorter = higher ROI)
        base_score = 90 if skill['importance'] == 'critical' else 70
        time_penalty = min(20, skill['learning_time_weeks'] - 4)
        
        return max(50, base_score - time_penalty)
    
    def _generate_recommendations(
        self, 
        gaps: Dict[str, List], 
        readiness_score: int
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if readiness_score >= 80:
            recommendations.append("You're almost ready! Focus on building portfolio projects")
            recommendations.append("Start applying to jobs while learning remaining skills")
        elif readiness_score >= 60:
            recommendations.append("You have a solid foundation. Focus on critical missing skills")
            recommendations.append("Build 2-3 projects showcasing your skills")
        else:
            recommendations.append("Significant skill development needed. Start with Phase 1 of learning path")
            recommendations.append("Consider bootcamps or structured courses for faster progress")
        
        if len(gaps['critical_missing']) > 0:
            recommendations.append(f"Priority: Learn {gaps['critical_missing'][0]['skill']} first")
        
        if len(gaps['strengths']) > 0:
            recommendations.append(f"Leverage your strength in {gaps['strengths'][0]['skill']} on your resume")
        
        return recommendations


# Utility function for API endpoint
def analyze_skill_gaps(user_profile: Dict[str, Any], target_role: str) -> Dict[str, Any]:
    """
    Analyze skill gaps for a user targeting a specific role
    
    Args:
        user_profile: User's profile data
        target_role: Target job role
    
    Returns:
        Skill gap analysis with learning path
    """
    analyzer = SkillGapAnalyzer()
    return analyzer.analyze_gaps(user_profile, target_role)
