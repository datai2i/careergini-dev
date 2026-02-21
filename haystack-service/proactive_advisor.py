"""
Proactive Career Advisor
Generates contextual nudges and recommendations based on user activity
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json

class ProactiveAdvisor:
    def __init__(self):
        self.nudge_types = {
            'application_follow_up': {
                'priority': 'high',
                'frequency': 'daily',
                'conditions': ['application_pending', 'days_since_apply > 7']
            },
            'resume_update': {
                'priority': 'medium',
                'frequency': 'weekly',
                'conditions': ['ats_score < 70', 'no_update_30_days']
            },
            'skill_development': {
                'priority': 'medium',
                'frequency': 'weekly',
                'conditions': ['skill_gaps_identified', 'no_learning_progress']
            },
            'interview_prep': {
                'priority': 'high',
                'frequency': 'daily',
                'conditions': ['interview_scheduled', 'days_until_interview <= 3']
            },
            'job_match_alert': {
                'priority': 'high',
                'frequency': 'daily',
                'conditions': ['new_high_match_jobs', 'match_score > 80']
            },
            'profile_completion': {
                'priority': 'low',
                'frequency': 'weekly',
                'conditions': ['profile_incomplete', 'completion < 80']
            },
            'networking': {
                'priority': 'low',
                'frequency': 'monthly',
                'conditions': ['no_activity_14_days']
            }
        }
    
    def generate_nudges(
        self,
        user_profile: Dict[str, Any],
        user_activity: Dict[str, Any],
        applications: List[Dict[str, Any]],
        skill_gaps: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate personalized nudges based on user context
        
        Args:
            user_profile: User's profile data
            user_activity: Recent activity data
            applications: User's job applications
            skill_gaps: Skill gap analysis results
        
        Returns:
            List of nudges with priority and actions
        """
        nudges = []
        
        # Check application follow-ups
        follow_up_nudges = self._check_application_follow_ups(applications)
        nudges.extend(follow_up_nudges)
        
        # Check resume optimization
        resume_nudges = self._check_resume_optimization(user_profile)
        nudges.extend(resume_nudges)
        
        # Check skill development
        if skill_gaps:
            skill_nudges = self._check_skill_development(skill_gaps, user_activity)
            nudges.extend(skill_nudges)
        
        # Check interview preparation
        interview_nudges = self._check_interview_prep(applications)
        nudges.extend(interview_nudges)
        
        # Check profile completion
        profile_nudges = self._check_profile_completion(user_profile)
        nudges.extend(profile_nudges)
        
        # Check inactivity
        activity_nudges = self._check_user_activity(user_activity)
        nudges.extend(activity_nudges)
        
        # Sort by priority and return top 5
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        nudges.sort(key=lambda x: priority_order.get(x['priority'], 3))
        
        return nudges[:5]
    
    def _check_application_follow_ups(
        self,
        applications: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Check for applications needing follow-up"""
        nudges = []
        now = datetime.now()
        
        for app in applications:
            if app.get('status') not in ['applied', 'phone_screen']:
                continue
            
            applied_date = datetime.fromisoformat(app.get('applied_date', ''))
            days_since = (now - applied_date).days
            
            if days_since >= 7 and days_since <= 14:
                nudges.append({
                    'type': 'application_follow_up',
                    'priority': 'high',
                    'title': f"Follow up on {app['company']} application",
                    'message': f"It's been {days_since} days since you applied to {app['job_title']} at {app['company']}. Consider sending a follow-up email.",
                    'actions': [
                        {
                            'label': 'Draft Follow-up Email',
                            'action': 'generate_follow_up',
                            'data': {'application_id': app['id']}
                        },
                        {
                            'label': 'Mark as Followed Up',
                            'action': 'add_event',
                            'data': {'application_id': app['id'], 'event': 'follow_up_sent'}
                        }
                    ],
                    'context': {
                        'application_id': app['id'],
                        'company': app['company'],
                        'days_since_apply': days_since
                    }
                })
        
        return nudges
    
    def _check_resume_optimization(
        self,
        user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check if resume needs optimization"""
        nudges = []
        
        ats_score = user_profile.get('resume_ats_score', 0)
        last_update = user_profile.get('resume_last_updated')
        
        if ats_score < 70:
            nudges.append({
                'type': 'resume_update',
                'priority': 'medium',
                'title': 'Improve your resume ATS score',
                'message': f'Your resume ATS score is {ats_score}/100. Optimizing it could increase your chances of getting interviews.',
                'actions': [
                    {
                        'label': 'Analyze Resume',
                        'action': 'navigate',
                        'data': {'path': '/resume-analyzer'}
                    },
                    {
                        'label': 'View Tips',
                        'action': 'show_tips',
                        'data': {'type': 'ats_optimization'}
                    }
                ],
                'context': {
                    'current_score': ats_score,
                    'target_score': 85
                }
            })
        
        return nudges
    
    def _check_skill_development(
        self,
        skill_gaps: Dict[str, Any],
        user_activity: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check for skill development opportunities"""
        nudges = []
        
        readiness_score = skill_gaps.get('readiness_score', 100)
        critical_gaps = skill_gaps.get('gaps', {}).get('critical_missing', [])
        
        if readiness_score < 70 and critical_gaps:
            top_skill = critical_gaps[0]
            nudges.append({
                'type': 'skill_development',
                'priority': 'medium',
                'title': f"Start learning {top_skill['skill']}",
                'message': f"Learning {top_skill['skill']} is critical for your target role. Estimated time: {top_skill.get('learning_time_weeks', 8)} weeks.",
                'actions': [
                    {
                        'label': 'View Learning Path',
                        'action': 'navigate',
                        'data': {'path': '/learning-path'}
                    },
                    {
                        'label': 'Find Courses',
                        'action': 'search_courses',
                        'data': {'skill': top_skill['skill']}
                    }
                ],
                'context': {
                    'skill': top_skill['skill'],
                    'importance': top_skill.get('importance', 'critical'),
                    'estimated_weeks': top_skill.get('learning_time_weeks', 8)
                }
            })
        
        return nudges
    
    def _check_interview_prep(
        self,
        applications: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Check for upcoming interviews"""
        nudges = []
        now = datetime.now()
        
        for app in applications:
            if app.get('status') != 'interview':
                continue
            
            # Check if interview date is in events
            events = app.get('events', [])
            for event in events:
                if event.get('event_type') == 'interview_scheduled':
                    interview_date = datetime.fromisoformat(event.get('event_data', {}).get('date', ''))
                    days_until = (interview_date - now).days
                    
                    if 0 <= days_until <= 3:
                        nudges.append({
                            'type': 'interview_prep',
                            'priority': 'high',
                            'title': f"Interview in {days_until} days at {app['company']}",
                            'message': f"Your interview for {app['job_title']} is coming up. Time to prepare!",
                            'actions': [
                                {
                                    'label': 'Practice Interview',
                                    'action': 'start_mock_interview',
                                    'data': {'job_role': app['job_title'], 'company': app['company']}
                                },
                                {
                                    'label': 'Research Company',
                                    'action': 'research_company',
                                    'data': {'company': app['company']}
                                }
                            ],
                            'context': {
                                'application_id': app['id'],
                                'company': app['company'],
                                'days_until': days_until
                            }
                        })
        
        return nudges
    
    def _check_profile_completion(
        self,
        user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check profile completion status"""
        nudges = []
        
        completion = user_profile.get('profile_completeness', 0)
        
        if completion < 80:
            missing_sections = []
            if not user_profile.get('skills'):
                missing_sections.append('skills')
            if not user_profile.get('experience'):
                missing_sections.append('experience')
            if not user_profile.get('education'):
                missing_sections.append('education')
            
            if missing_sections:
                nudges.append({
                    'type': 'profile_completion',
                    'priority': 'low',
                    'title': 'Complete your profile',
                    'message': f'Your profile is {completion}% complete. Add {", ".join(missing_sections)} to improve job matches.',
                    'actions': [
                        {
                            'label': 'Complete Profile',
                            'action': 'navigate',
                            'data': {'path': '/profile/edit'}
                        }
                    ],
                    'context': {
                        'completion': completion,
                        'missing_sections': missing_sections
                    }
                })
        
        return nudges
    
    def _check_user_activity(
        self,
        user_activity: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check for user inactivity"""
        nudges = []
        
        last_activity = user_activity.get('last_activity_date')
        if not last_activity:
            return nudges
        
        last_activity_date = datetime.fromisoformat(last_activity)
        days_inactive = (datetime.now() - last_activity_date).days
        
        if days_inactive >= 14:
            nudges.append({
                'type': 'networking',
                'priority': 'low',
                'title': "You've been away for a while",
                'message': f"It's been {days_inactive} days since your last activity. Stay active to increase your chances!",
                'actions': [
                    {
                        'label': 'Browse Jobs',
                        'action': 'navigate',
                        'data': {'path': '/jobs'}
                    },
                    {
                        'label': 'Update Resume',
                        'action': 'navigate',
                        'data': {'path': '/resume'}
                    }
                ],
                'context': {
                    'days_inactive': days_inactive
                }
            })
        
        return nudges


# Utility function for API endpoint
def generate_career_nudges(
    user_profile: Dict[str, Any],
    user_activity: Dict[str, Any],
    applications: List[Dict[str, Any]],
    skill_gaps: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Generate proactive career nudges
    
    Args:
        user_profile: User's profile data
        user_activity: Recent activity data
        applications: User's job applications
        skill_gaps: Optional skill gap analysis
    
    Returns:
        List of personalized nudges
    """
    advisor = ProactiveAdvisor()
    return advisor.generate_nudges(user_profile, user_activity, applications, skill_gaps)
