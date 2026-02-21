"""
Analytics Dashboard Data Aggregator
Generates comprehensive analytics for career progress tracking
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json

class AnalyticsDashboard:
    def __init__(self):
        self.metrics = [
            'application_funnel',
            'response_rates',
            'interview_conversion',
            'skill_progress',
            'market_trends',
            'salary_insights'
        ]
    
    def generate_dashboard_data(
        self,
        user_id: str,
        applications: List[Dict[str, Any]],
        user_profile: Dict[str, Any],
        skill_gaps: Optional[Dict[str, Any]] = None,
        timeframe_days: int = 90
    ) -> Dict[str, Any]:
        """
        Generate comprehensive dashboard analytics
        
        Args:
            user_id: User identifier
            applications: User's applications
            user_profile: User profile data
            skill_gaps: Skill gap analysis
            timeframe_days: Analysis timeframe
        
        Returns:
            Complete dashboard data
        """
        cutoff_date = datetime.now() - timedelta(days=timeframe_days)
        
        # Filter applications by timeframe
        recent_apps = [
            app for app in applications
            if datetime.fromisoformat(app.get('applied_date', '')) >= cutoff_date
        ]
        
        dashboard = {
            'overview': self._generate_overview(recent_apps, user_profile),
            'funnel': self._generate_funnel_metrics(recent_apps),
            'timeline': self._generate_timeline_data(recent_apps, timeframe_days),
            'performance': self._generate_performance_metrics(recent_apps),
            'insights': self._generate_insights(recent_apps, user_profile, skill_gaps),
            'recommendations': self._generate_recommendations(recent_apps, user_profile),
            'benchmarks': self._generate_benchmarks(recent_apps, user_profile),
            'goals': self._generate_goal_tracking(user_profile, recent_apps)
        }
        
        return dashboard
    
    def _generate_overview(
        self,
        applications: List[Dict[str, Any]],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate overview statistics"""
        total_apps = len(applications)
        
        # Count by status
        status_counts = {}
        for app in applications:
            status = app.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Calculate rates
        responses = status_counts.get('phone_screen', 0) + status_counts.get('interview', 0) + status_counts.get('offer', 0)
        response_rate = (responses / total_apps * 100) if total_apps > 0 else 0
        
        interviews = status_counts.get('interview', 0) + status_counts.get('offer', 0)
        interview_rate = (interviews / total_apps * 100) if total_apps > 0 else 0
        
        offers = status_counts.get('offer', 0) + status_counts.get('accepted', 0)
        offer_rate = (offers / interviews * 100) if interviews > 0 else 0
        
        # Average scores
        match_scores = [app.get('job_match_score', 0) for app in applications if app.get('job_match_score')]
        avg_match = sum(match_scores) / len(match_scores) if match_scores else 0
        
        ats_scores = [app.get('ats_score', 0) for app in applications if app.get('ats_score')]
        avg_ats = sum(ats_scores) / len(ats_scores) if ats_scores else 0
        
        return {
            'total_applications': total_apps,
            'response_rate': round(response_rate, 1),
            'interview_rate': round(interview_rate, 1),
            'offer_rate': round(offer_rate, 1),
            'avg_match_score': round(avg_match, 1),
            'avg_ats_score': round(avg_ats, 1),
            'status_breakdown': status_counts,
            'active_applications': status_counts.get('applied', 0) + status_counts.get('phone_screen', 0) + status_counts.get('interview', 0)
        }
    
    def _generate_funnel_metrics(
        self,
        applications: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate application funnel data"""
        funnel_stages = {
            'applied': 0,
            'phone_screen': 0,
            'interview': 0,
            'offer': 0,
            'accepted': 0
        }
        
        for app in applications:
            status = app.get('status', 'applied')
            if status in funnel_stages:
                funnel_stages[status] += 1
        
        # Calculate cumulative for funnel visualization
        total = len(applications)
        funnel_data = []
        
        stages_order = ['applied', 'phone_screen', 'interview', 'offer', 'accepted']
        cumulative = total
        
        for stage in stages_order:
            count = funnel_stages[stage]
            percentage = (count / total * 100) if total > 0 else 0
            conversion = (count / cumulative * 100) if cumulative > 0 else 0
            
            funnel_data.append({
                'stage': stage.replace('_', ' ').title(),
                'count': count,
                'percentage': round(percentage, 1),
                'conversion_rate': round(conversion, 1)
            })
            
            if count > 0:
                cumulative = count
        
        return {
            'stages': funnel_data,
            'total_entered': total,
            'total_converted': funnel_stages['accepted'],
            'overall_conversion': round((funnel_stages['accepted'] / total * 100) if total > 0 else 0, 1)
        }
    
    def _generate_timeline_data(
        self,
        applications: List[Dict[str, Any]],
        timeframe_days: int
    ) -> Dict[str, Any]:
        """Generate timeline data for charts"""
        # Group applications by week
        weekly_data = {}
        now = datetime.now()
        
        for app in applications:
            applied_date = datetime.fromisoformat(app.get('applied_date', ''))
            week_start = applied_date - timedelta(days=applied_date.weekday())
            week_key = week_start.strftime('%Y-%m-%d')
            
            if week_key not in weekly_data:
                weekly_data[week_key] = {
                    'applications': 0,
                    'responses': 0,
                    'interviews': 0,
                    'offers': 0
                }
            
            weekly_data[week_key]['applications'] += 1
            
            status = app.get('status')
            if status in ['phone_screen', 'interview', 'offer', 'accepted']:
                weekly_data[week_key]['responses'] += 1
            if status in ['interview', 'offer', 'accepted']:
                weekly_data[week_key]['interviews'] += 1
            if status in ['offer', 'accepted']:
                weekly_data[week_key]['offers'] += 1
        
        # Convert to sorted list
        timeline = [
            {
                'week': week,
                **data
            }
            for week, data in sorted(weekly_data.items())
        ]
        
        return {
            'weekly': timeline,
            'timeframe_days': timeframe_days
        }
    
    def _generate_performance_metrics(
        self,
        applications: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate performance metrics"""
        if not applications:
            return {
                'avg_response_time_days': 0,
                'application_quality': {
                    'avg_match_score': 0,
                    'avg_ats_score': 0,
                    'high_quality_apps': 0,
                    'total_apps': 0
                },
                'success_indicators': {
                    'applications_per_week': 0,
                    'quality_over_quantity': 0
                }
            }
        
        # Time to response
        response_times = []
        for app in applications:
            if app.get('status') not in ['applied', 'rejected']:
                applied = datetime.fromisoformat(app.get('applied_date', ''))
                # Estimate response time (would need event data for accuracy)
                response_times.append(7)  # Placeholder
        
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Application quality scores
        match_scores = [app.get('job_match_score', 0) for app in applications if app.get('job_match_score')]
        ats_scores = [app.get('ats_score', 0) for app in applications if app.get('ats_score')]
        
        return {
            'avg_response_time_days': round(avg_response_time, 1),
            'application_quality': {
                'avg_match_score': round(sum(match_scores) / len(match_scores) if match_scores else 0, 1),
                'avg_ats_score': round(sum(ats_scores) / len(ats_scores) if ats_scores else 0, 1),
                'high_quality_apps': len([s for s in match_scores if s >= 80]),
                'total_apps': len(applications)
            },
            'success_indicators': {
                'applications_per_week': round(len(applications) / 12, 1),  # Assuming 90 days
                'quality_over_quantity': len([s for s in match_scores if s >= 80]) / len(applications) if applications else 0
            }
        }
    
    def _generate_insights(
        self,
        applications: List[Dict[str, Any]],
        user_profile: Dict[str, Any],
        skill_gaps: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate actionable insights"""
        insights = []
        
        if not applications:
            insights.append({
                'type': 'action_needed',
                'title': 'Start applying to jobs',
                'description': 'You haven\'t applied to any jobs recently. Start browsing and applying!',
                'priority': 'high'
            })
            return insights
        
        # Response rate insight
        total = len(applications)
        responses = len([a for a in applications if a.get('status') not in ['applied', 'rejected']])
        response_rate = (responses / total * 100) if total > 0 else 0
        
        if response_rate < 20:
            insights.append({
                'type': 'improvement',
                'title': 'Low response rate detected',
                'description': f'Your response rate is {response_rate:.1f}%. Consider improving your resume ATS score and targeting higher-match jobs.',
                'priority': 'high',
                'action': 'Optimize resume'
            })
        
        # Match score insight
        match_scores = [a.get('job_match_score', 0) for a in applications if a.get('job_match_score')]
        if match_scores:
            avg_match = sum(match_scores) / len(match_scores)
            if avg_match < 70:
                insights.append({
                    'type': 'strategy',
                    'title': 'Focus on better-matched jobs',
                    'description': f'Your average job match score is {avg_match:.1f}%. Applying to jobs with 80%+ match increases success rate.',
                    'priority': 'medium',
                    'action': 'Filter by match score'
                })
        
        # Skill gaps insight
        if skill_gaps and skill_gaps.get('readiness_score', 100) < 70:
            insights.append({
                'type': 'development',
                'title': 'Skill development opportunity',
                'description': f'You\'re {skill_gaps["readiness_score"]}% ready for your target role. Focus on critical skills to improve.',
                'priority': 'medium',
                'action': 'View learning path'
            })
        
        return insights
    
    def _generate_recommendations(
        self,
        applications: List[Dict[str, Any]],
        user_profile: Dict[str, Any]
    ) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        total = len(applications)
        
        if total < 10:
            recommendations.append("Apply to more jobs to increase your chances (aim for 10-15 per week)")
        
        match_scores = [a.get('job_match_score', 0) for a in applications if a.get('job_match_score')]
        if match_scores and sum(match_scores) / len(match_scores) < 75:
            recommendations.append("Focus on jobs with 80%+ match score for better results")
        
        ats_score = user_profile.get('resume_ats_score', 0)
        if ats_score < 75:
            recommendations.append("Improve your resume ATS score to pass automated screening")
        
        response_rate = len([a for a in applications if a.get('status') not in ['applied', 'rejected']]) / total if total > 0 else 0
        if response_rate < 0.2:
            recommendations.append("Follow up on applications after 7-10 days to increase response rate")
        
        if not recommendations:
            recommendations.append("Keep up the great work! Your application strategy is on track")
        
        return recommendations
    
    def _generate_benchmarks(
        self,
        applications: List[Dict[str, Any]],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate industry benchmarks"""
        # These would ideally come from aggregated data
        # Using industry averages as placeholders
        
        total = len(applications)
        your_response_rate = (len([a for a in applications if a.get('status') not in ['applied', 'rejected']]) / total * 100) if total > 0 else 0
        
        return {
            'response_rate': {
                'your_rate': round(your_response_rate, 1),
                'industry_avg': 25.0,
                'top_performers': 40.0,
                'status': 'above_avg' if your_response_rate > 25 else 'below_avg'
            },
            'applications_per_week': {
                'your_rate': round(total / 12, 1),
                'recommended': 10.0,
                'top_performers': 15.0
            },
            'time_to_offer': {
                'your_avg': 45,  # Placeholder
                'industry_avg': 30,
                'unit': 'days'
            }
        }
    
    def _generate_goal_tracking(
        self,
        user_profile: Dict[str, Any],
        applications: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate goal tracking data"""
        goals = user_profile.get('career_goals', {})
        
        # Default goals if not set
        weekly_app_goal = goals.get('weekly_applications', 10)
        target_response_rate = goals.get('target_response_rate', 30)
        
        total = len(applications)
        actual_weekly = total / 12  # 90 days = ~12 weeks
        
        responses = len([a for a in applications if a.get('status') not in ['applied', 'rejected']])
        actual_response_rate = (responses / total * 100) if total > 0 else 0
        
        return {
            'weekly_applications': {
                'goal': weekly_app_goal,
                'actual': round(actual_weekly, 1),
                'progress': round((actual_weekly / weekly_app_goal * 100), 1),
                'status': 'on_track' if actual_weekly >= weekly_app_goal else 'behind'
            },
            'response_rate': {
                'goal': target_response_rate,
                'actual': round(actual_response_rate, 1),
                'progress': round((actual_response_rate / target_response_rate * 100), 1),
                'status': 'on_track' if actual_response_rate >= target_response_rate else 'behind'
            }
        }


# Utility function for API endpoint
def generate_analytics_dashboard(
    user_id: str,
    applications: List[Dict[str, Any]],
    user_profile: Dict[str, Any],
    skill_gaps: Optional[Dict[str, Any]] = None,
    timeframe_days: int = 90
) -> Dict[str, Any]:
    """
    Generate analytics dashboard data
    
    Args:
        user_id: User identifier
        applications: User's applications
        user_profile: User profile data
        skill_gaps: Optional skill gap analysis
        timeframe_days: Analysis timeframe
    
    Returns:
        Complete dashboard analytics
    """
    dashboard = AnalyticsDashboard()
    return dashboard.generate_dashboard_data(
        user_id,
        applications,
        user_profile,
        skill_gaps,
        timeframe_days
    )
