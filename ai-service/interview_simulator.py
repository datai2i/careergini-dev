"""
AI Mock Interview Simulator
Conducts realistic interview practice sessions with AI evaluation
"""

from typing import Dict, List, Any, Optional
import json
import re
from datetime import datetime

class InterviewSimulator:
    def __init__(self, ollama_client):
        self.ollama = ollama_client
        
        # Question banks by type
        self.question_banks = {
            'behavioral': [
                "Tell me about a time when you faced a significant challenge at work. How did you handle it?",
                "Describe a situation where you had to work with a difficult team member.",
                "Give me an example of a goal you set and how you achieved it.",
                "Tell me about a time you failed. What did you learn from it?",
                "Describe a situation where you had to adapt to significant changes.",
            ],
            'technical': [
                "Explain the difference between a stack and a queue.",
                "What is the time complexity of binary search?",
                "How would you design a URL shortening service?",
                "Explain what happens when you type a URL in a browser.",
                "What are the principles of object-oriented programming?",
            ],
            'situational': [
                "How would you handle a situation where you disagree with your manager?",
                "What would you do if you discovered a critical bug right before a release?",
                "How would you prioritize multiple urgent tasks?",
                "What would you do if a team member wasn't pulling their weight?",
                "How would you handle receiving negative feedback?",
            ]
        }
        
        # Company-specific questions (can be expanded)
        self.company_questions = {
            'google': [
                "Why do you want to work at Google?",
                "How would you improve Google Search?",
                "Tell me about a time you demonstrated leadership.",
            ],
            'amazon': [
                "Tell me about a time you had to make a decision with incomplete information.",
                "Describe a time when you went above and beyond for a customer.",
                "How do you handle working under pressure?",
            ]
        }
    
    async def start_session(
        self,
        job_role: str,
        company: Optional[str] = None,
        difficulty: str = 'medium',
        question_types: List[str] = ['behavioral', 'technical']
    ) -> Dict[str, Any]:
        """
        Start a new interview session
        
        Args:
            job_role: Target job role
            company: Optional company name for company-specific questions
            difficulty: easy, medium, hard
            question_types: Types of questions to include
        
        Returns:
            Session info with first question
        """
        session = {
            "session_id": self._generate_session_id(),
            "job_role": job_role,
            "company": company,
            "difficulty": difficulty,
            "question_types": question_types,
            "questions_asked": [],
            "current_question_index": 0,
            "started_at": datetime.now().isoformat()
        }
        
        # Get first question
        first_question = self._get_next_question(session)
        
        return {
            "session": session,
            "question": first_question,
            "tips": self._get_question_tips(first_question['type'])
        }
    
    async def evaluate_answer(
        self,
        session: Dict[str, Any],
        question: str,
        answer: str,
        question_type: str
    ) -> Dict[str, Any]:
        """
        Evaluate user's answer using AI
        
        Args:
            session: Current session data
            question: The question asked
            answer: User's answer
            question_type: Type of question
        
        Returns:
            Evaluation with scores and feedback
        """
        # Build evaluation prompt
        prompt = self._build_evaluation_prompt(question, answer, question_type)
        
        # Get reasoning model
        llm = self.ollama.get_model("reasoning")
        
        # Get AI evaluation
        result = await llm.ainvoke(prompt)
        response = result.content
        
        # Parse evaluation
        evaluation = self._parse_evaluation(response)
        
        # Add to session history
        session['questions_asked'].append({
            "question": question,
            "type": question_type,
            "answer": answer,
            "evaluation": evaluation,
            "timestamp": datetime.now().isoformat()
        })
        
        return evaluation
    
    async def get_next_question(
        self,
        session: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Get next question in the session"""
        if session['current_question_index'] >= 10:  # Max 10 questions per session
            return None
        
        question = self._get_next_question(session)
        session['current_question_index'] += 1
        
        return question
    
    async def end_session(
        self,
        session: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        End session and generate overall report
        
        Args:
            session: Session data
        
        Returns:
            Final session report with scores and recommendations
        """
        questions_asked = session.get('questions_asked', [])
        
        if not questions_asked:
            return {
                "overall_score": 0,
                "message": "No questions answered"
            }
        
        # Calculate overall metrics
        scores = [q['evaluation']['overall_score'] for q in questions_asked if 'evaluation' in q]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        clarity_scores = [q['evaluation']['clarity_score'] for q in questions_asked if 'evaluation' in q]
        avg_clarity = sum(clarity_scores) / len(clarity_scores) if clarity_scores else 0
        
        relevance_scores = [q['evaluation']['relevance_score'] for q in questions_asked if 'evaluation' in q]
        avg_relevance = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0
        
        # Generate recommendations
        recommendations = self._generate_session_recommendations(questions_asked, avg_score)
        
        return {
            "session_id": session['session_id'],
            "overall_score": int(avg_score),
            "questions_answered": len(questions_asked),
            "metrics": {
                "avg_clarity": int(avg_clarity),
                "avg_relevance": int(avg_relevance),
                "avg_confidence": int(avg_score)
            },
            "performance_level": self._get_performance_level(avg_score),
            "strengths": self._identify_strengths(questions_asked),
            "areas_to_improve": self._identify_weaknesses(questions_asked),
            "recommendations": recommendations,
            "completed_at": datetime.now().isoformat()
        }
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        import uuid
        return str(uuid.uuid4())
    
    def _get_next_question(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Get next question based on session config"""
        question_types = session['question_types']
        current_index = session['current_question_index']
        
        # Rotate through question types
        question_type = question_types[current_index % len(question_types)]
        
        # Get question from bank
        questions = self.question_banks.get(question_type, [])
        if not questions:
            question_type = 'behavioral'
            questions = self.question_banks['behavioral']
        
        question_text = questions[current_index % len(questions)]
        
        return {
            "question": question_text,
            "type": question_type,
            "index": current_index + 1
        }
    
    def _get_question_tips(self, question_type: str) -> List[str]:
        """Get tips for answering question type"""
        tips = {
            'behavioral': [
                "Use the STAR method: Situation, Task, Action, Result",
                "Be specific with examples from your experience",
                "Quantify your impact when possible",
                "Keep your answer to 2-3 minutes"
            ],
            'technical': [
                "Think out loud to show your problem-solving process",
                "Ask clarifying questions if needed",
                "Explain trade-offs in your solution",
                "Consider edge cases"
            ],
            'situational': [
                "Show your thought process",
                "Demonstrate problem-solving skills",
                "Highlight your values and priorities",
                "Be honest and authentic"
            ]
        }
        
        return tips.get(question_type, [])
    
    def _build_evaluation_prompt(
        self,
        question: str,
        answer: str,
        question_type: str
    ) -> str:
        """Build prompt for AI evaluation"""
        return f"""You are an expert interview coach evaluating a candidate's answer.

Question Type: {question_type}
Question: {question}
Candidate's Answer: {answer}

Evaluate this answer on the following criteria (score each 0-100):
1. Relevance - Does the answer address the question?
2. Clarity - Is the answer clear and well-structured?
3. Completeness - Does it cover all aspects of the question?
4. Confidence - Does the candidate sound confident?
5. Examples - Are there specific examples (for behavioral questions)?

Also identify:
- Strengths of the answer
- Areas for improvement
- Suggested better answer (brief)
- Filler words used (um, like, you know, etc.)

Return your evaluation in JSON format:
{{
    "overall_score": 85,
    "relevance_score": 90,
    "clarity_score": 80,
    "completeness_score": 85,
    "confidence_score": 85,
    "strengths": ["specific example", "clear structure"],
    "improvements": ["add more quantifiable results", "reduce filler words"],
    "filler_words_count": 3,
    "suggested_improvement": "Brief suggestion here"
}}"""
    
    def _parse_evaluation(self, response: str) -> Dict[str, Any]:
        """Parse AI evaluation response"""
        try:
            # Try to extract JSON from response
            if '```json' in response:
                json_str = response.split('```json')[1].split('```')[0].strip()
            elif '```' in response:
                json_str = response.split('```')[1].split('```')[0].strip()
            else:
                json_str = response.strip()
            
            evaluation = json.loads(json_str)
            
            # Ensure all required fields exist
            return {
                "overall_score": evaluation.get('overall_score') or 70,
                "relevance_score": evaluation.get('relevance_score') or 70,
                "clarity_score": evaluation.get('clarity_score') or 70,
                "completeness_score": evaluation.get('completeness_score') or 70,
                "confidence_score": evaluation.get('confidence_score') or 70,
                "strengths": evaluation.get('strengths') or [],
                "improvements": evaluation.get('improvements') or [],
                "filler_words_count": evaluation.get('filler_words_count') or 0,
                "suggested_improvement": evaluation.get('suggested_improvement') or ''
            }
        except:
            # Fallback evaluation
            return {
                "overall_score": 70,
                "relevance_score": 70,
                "clarity_score": 70,
                "completeness_score": 70,
                "confidence_score": 70,
                "strengths": ["Answer provided"],
                "improvements": ["Could not parse detailed feedback"],
                "filler_words_count": 0,
                "suggested_improvement": "Practice more structured answers"
            }
    
    def _generate_session_recommendations(
        self,
        questions_asked: List[Dict],
        avg_score: float
    ) -> List[str]:
        """Generate recommendations based on session performance"""
        recommendations = []
        
        if avg_score >= 80:
            recommendations.append("Excellent performance! You're interview-ready")
            recommendations.append("Focus on company-specific preparation")
        elif avg_score >= 65:
            recommendations.append("Good performance with room for improvement")
            recommendations.append("Practice more behavioral questions using STAR method")
        else:
            recommendations.append("Needs significant practice")
            recommendations.append("Focus on structuring your answers clearly")
            recommendations.append("Practice with a friend or mentor")
        
        # Check for common issues
        filler_words_total = sum(
            q.get('evaluation', {}).get('filler_words_count', 0)
            for q in questions_asked
        )
        
        if filler_words_total > 10:
            recommendations.append("Work on reducing filler words (um, like, you know)")
        
        return recommendations
    
    def _get_performance_level(self, score: float) -> str:
        """Get performance level label"""
        if score >= 85:
            return "Excellent"
        elif score >= 70:
            return "Good"
        elif score >= 55:
            return "Fair"
        else:
            return "Needs Improvement"
    
    def _identify_strengths(self, questions_asked: List[Dict]) -> List[str]:
        """Identify common strengths across answers"""
        all_strengths = []
        for q in questions_asked:
            if 'evaluation' in q:
                all_strengths.extend(q['evaluation'].get('strengths', []))
        
        # Return most common strengths
        from collections import Counter
        common = Counter(all_strengths).most_common(3)
        return [strength for strength, count in common]
    
    def _identify_weaknesses(self, questions_asked: List[Dict]) -> List[str]:
        """Identify common areas for improvement"""
        all_improvements = []
        for q in questions_asked:
            if 'evaluation' in q:
                all_improvements.extend(q['evaluation'].get('improvements', []))
        
        # Return most common improvements needed
        from collections import Counter
        common = Counter(all_improvements).most_common(3)
        return [improvement for improvement, count in common]


# Utility functions for API endpoints
async def create_interview_session(
    ollama_client,
    job_role: str,
    company: Optional[str] = None,
    difficulty: str = 'medium'
) -> Dict[str, Any]:
    """Create new interview practice session"""
    simulator = InterviewSimulator(ollama_client)
    return await simulator.start_session(job_role, company, difficulty)

async def evaluate_interview_answer(
    ollama_client,
    session: Dict[str, Any],
    question: str,
    answer: str,
    question_type: str
) -> Dict[str, Any]:
    """Evaluate an interview answer"""
    simulator = InterviewSimulator(ollama_client)
    return await simulator.evaluate_answer(session, question, answer, question_type)
