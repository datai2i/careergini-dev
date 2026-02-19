"""
ATS Resume Scoring Engine
Analyzes resumes for Applicant Tracking System compatibility
"""

import re
from typing import Dict, List, Any
import spacy
from collections import Counter

class ATSScorer:
    def __init__(self):
        # Load spaCy model for NLP
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            # Fallback if model not installed
            self.nlp = None
        
        # Standard ATS-friendly section headers
        self.standard_sections = {
            'experience': ['experience', 'work experience', 'professional experience', 'employment history', 'work history'],
            'education': ['education', 'academic background', 'qualifications'],
            'skills': ['skills', 'technical skills', 'core competencies', 'expertise'],
            'summary': ['summary', 'professional summary', 'profile', 'objective'],
            'contact': ['contact', 'contact information']
        }
        
        # Common ATS-unfriendly elements
        self.problematic_elements = [
            'tables', 'text boxes', 'headers/footers', 'images', 
            'graphics', 'special characters', 'unusual fonts'
        ]
    
    def analyze_resume(self, resume_text: str, job_description: str = None) -> Dict[str, Any]:
        """
        Comprehensive ATS analysis of resume
        
        Args:
            resume_text: Full text of resume
            job_description: Optional job description for keyword matching
        
        Returns:
            Dictionary with scores, issues, and recommendations
        """
        # Individual component scores
        keyword_score = self._analyze_keywords(resume_text, job_description) if job_description else 100
        formatting_score = self._analyze_formatting(resume_text)
        section_score = self._analyze_sections(resume_text)
        content_score = self._analyze_content_quality(resume_text)
        
        # Calculate overall score (weighted average)
        overall_score = int(
            keyword_score * 0.30 +
            formatting_score * 0.25 +
            section_score * 0.25 +
            content_score * 0.20
        )
        
        # Collect all issues
        issues = []
        issues.extend(self._get_keyword_issues(resume_text, job_description))
        issues.extend(self._get_formatting_issues(resume_text))
        issues.extend(self._get_section_issues(resume_text))
        issues.extend(self._get_content_issues(resume_text))
        
        # Generate improvement suggestions
        improvements = self._generate_improvements(overall_score, issues)
        
        return {
            "overall_score": overall_score,
            "keyword_match": keyword_score,
            "formatting_score": formatting_score,
            "section_completeness": section_score,
            "content_quality": content_score,
            "issues": issues,
            "improvements": improvements,
            "ats_friendly": overall_score >= 75
        }
    
    def _analyze_keywords(self, resume_text: str, job_description: str) -> int:
        """Analyze keyword match between resume and job description"""
        if not job_description:
            return 100
        
        # Extract keywords from job description
        job_keywords = self._extract_keywords(job_description)
        resume_keywords = self._extract_keywords(resume_text)
        
        # Calculate match percentage
        if not job_keywords:
            return 100
        
        matched = sum(1 for keyword in job_keywords if keyword in resume_keywords)
        match_percentage = (matched / len(job_keywords)) * 100
        
        return int(match_percentage)
    
    def _extract_keywords(self, text: str) -> set:
        """Extract important keywords from text"""
        # Simple keyword extraction (can be enhanced with NLP)
        text = text.lower()
        
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                     'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                     'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
                     'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
        
        # Extract words (2+ chars, alphanumeric)
        words = re.findall(r'\b[a-z]{2,}\b', text)
        keywords = {word for word in words if word not in stop_words}
        
        # Extract multi-word phrases (bigrams)
        bigrams = set()
        words_list = text.split()
        for i in range(len(words_list) - 1):
            if words_list[i] not in stop_words and words_list[i+1] not in stop_words:
                bigrams.add(f"{words_list[i]} {words_list[i+1]}")
        
        return keywords.union(bigrams)
    
    def _analyze_formatting(self, resume_text: str) -> int:
        """Analyze formatting for ATS compatibility"""
        score = 100
        issues = []
        
        # Check for special characters
        special_chars = re.findall(r'[^\w\s\-.,;:()\[\]@#$%&*+=/<>]', resume_text)
        if len(special_chars) > 10:
            score -= 15
            issues.append("Too many special characters")
        
        # Check for excessive formatting (all caps, excessive punctuation)
        if re.search(r'[A-Z]{20,}', resume_text):
            score -= 10
            issues.append("Excessive use of capital letters")
        
        # Check line length (too long lines can indicate tables)
        lines = resume_text.split('\n')
        long_lines = sum(1 for line in lines if len(line) > 120)
        if long_lines > len(lines) * 0.3:
            score -= 10
            issues.append("Possible table formatting detected")
        
        return max(0, score)
    
    def _analyze_sections(self, resume_text: str) -> int:
        """Check for presence of standard resume sections"""
        text_lower = resume_text.lower()
        
        found_sections = {}
        for section_type, headers in self.standard_sections.items():
            found = any(header in text_lower for header in headers)
            found_sections[section_type] = found
        
        # Calculate score based on found sections
        required_sections = ['experience', 'education', 'skills']
        required_found = sum(1 for section in required_sections if found_sections.get(section, False))
        
        optional_sections = ['summary', 'contact']
        optional_found = sum(1 for section in optional_sections if found_sections.get(section, False))
        
        # Score: 70% for required, 30% for optional
        score = (required_found / len(required_sections)) * 70 + (optional_found / len(optional_sections)) * 30
        
        return int(score)
    
    def _analyze_content_quality(self, resume_text: str) -> int:
        """Analyze content quality (quantifiable achievements, action verbs)"""
        score = 100
        
        # Check for quantifiable achievements (numbers, percentages)
        numbers = re.findall(r'\d+[%$]?|\$\d+', resume_text)
        if len(numbers) < 5:
            score -= 20
        
        # Check for action verbs
        action_verbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed',
                       'improved', 'increased', 'reduced', 'achieved', 'delivered', 'built']
        text_lower = resume_text.lower()
        verb_count = sum(text_lower.count(verb) for verb in action_verbs)
        if verb_count < 5:
            score -= 15
        
        # Check resume length (too short or too long)
        word_count = len(resume_text.split())
        if word_count < 200:
            score -= 20
        elif word_count > 1000:
            score -= 10
        
        return max(0, score)
    
    def _get_keyword_issues(self, resume_text: str, job_description: str) -> List[Dict]:
        """Get keyword-related issues"""
        if not job_description:
            return []
        
        issues = []
        job_keywords = self._extract_keywords(job_description)
        resume_keywords = self._extract_keywords(resume_text)
        
        missing_keywords = job_keywords - resume_keywords
        
        # Prioritize important missing keywords (simple heuristic: longer phrases)
        important_missing = sorted(missing_keywords, key=len, reverse=True)[:5]
        
        for keyword in important_missing:
            issues.append({
                "type": "missing_keyword",
                "severity": "high" if len(keyword.split()) > 1 else "medium",
                "keyword": keyword,
                "suggestion": f"Add '{keyword}' to relevant sections (skills, experience, or summary)"
            })
        
        return issues
    
    def _get_formatting_issues(self, resume_text: str) -> List[Dict]:
        """Get formatting-related issues"""
        issues = []
        
        # Check for non-standard section headers
        text_lower = resume_text.lower()
        non_standard_headers = []
        
        # Look for potential custom headers
        lines = resume_text.split('\n')
        for line in lines:
            if line.isupper() and len(line.split()) <= 3 and len(line) > 5:
                # Might be a header
                if not any(std in line.lower() for section_headers in self.standard_sections.values() for std in section_headers):
                    non_standard_headers.append(line)
        
        if non_standard_headers:
            issues.append({
                "type": "formatting",
                "severity": "medium",
                "issue": "Non-standard section headers detected",
                "suggestion": f"Consider using standard headers like 'Experience', 'Education', 'Skills'"
            })
        
        return issues
    
    def _get_section_issues(self, resume_text: str) -> List[Dict]:
        """Get section-related issues"""
        issues = []
        text_lower = resume_text.lower()
        
        # Check for missing required sections
        for section_type, headers in self.standard_sections.items():
            if section_type in ['experience', 'education', 'skills']:
                if not any(header in text_lower for header in headers):
                    issues.append({
                        "type": "missing_section",
                        "severity": "high",
                        "section": section_type.title(),
                        "suggestion": f"Add a '{section_type.title()}' section to your resume"
                    })
        
        return issues
    
    def _get_content_issues(self, resume_text: str) -> List[Dict]:
        """Get content quality issues"""
        issues = []
        
        # Check for weak bullet points (no action verbs or metrics)
        lines = resume_text.split('\n')
        weak_bullets = []
        
        for line in lines:
            line_stripped = line.strip()
            if line_stripped.startswith(('•', '-', '*')) or re.match(r'^\d+\.', line_stripped):
                # It's a bullet point
                if not re.search(r'\d+[%$]?|\$\d+', line) and len(line.split()) > 3:
                    # No numbers and substantial length
                    weak_bullets.append(line_stripped[:50])
        
        if weak_bullets:
            issues.append({
                "type": "content_quality",
                "severity": "medium",
                "issue": "Bullet points lack quantifiable achievements",
                "suggestion": "Add metrics and numbers to demonstrate impact (e.g., 'Increased sales by 25%')"
            })
        
        return issues
    
    def _generate_improvements(self, overall_score: int, issues: List[Dict]) -> List[str]:
        """Generate prioritized improvement suggestions"""
        improvements = []
        
        if overall_score < 60:
            improvements.append("🚨 CRITICAL: Your resume needs significant improvements to pass ATS screening")
        elif overall_score < 75:
            improvements.append("⚠️ Your resume may struggle with ATS systems. Address high-priority issues below")
        elif overall_score < 90:
            improvements.append("✅ Good ATS compatibility. A few improvements can make it excellent")
        else:
            improvements.append("🌟 Excellent ATS compatibility! Minor tweaks for perfection")
        
        # Prioritize high-severity issues
        high_severity = [issue for issue in issues if issue.get('severity') == 'high']
        if high_severity:
            improvements.append(f"Address {len(high_severity)} high-priority issues first")
        
        # Add specific recommendations based on score
        if overall_score < 75:
            improvements.append("Use standard section headers (Experience, Education, Skills)")
            improvements.append("Add quantifiable achievements with numbers and percentages")
            improvements.append("Include relevant keywords from job descriptions")
        
        return improvements


# Utility function for API endpoint
def score_resume(resume_text: str, job_description: str = None) -> Dict[str, Any]:
    """
    Score a resume for ATS compatibility
    
    Args:
        resume_text: Full text of the resume
        job_description: Optional job description for keyword matching
    
    Returns:
        ATS analysis results
    """
    scorer = ATSScorer()
    return scorer.analyze_resume(resume_text, job_description)
