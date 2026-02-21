"""Quick visual smoke-test for all templates in 1-page and 2-page modes."""
import sys
sys.path.insert(0, '/app')
from pdf_generator import generate_pdf

persona = {
    "full_name": "Jothsna Pandranki",
    "professional_title": "Senior Software Engineer",
    "email": "jothsna@example.com",
    "phone": "+1 (555) 987-6543",
    "location": "Austin, TX",
    "summary": (
        "Results-driven Software Engineer with 6+ years of experience building "
        "scalable distributed systems and leading cross-functional engineering teams. "
        "Proven track record delivering high-impact products using Python, AWS, and "
        "modern ML frameworks in Agile environments."
    ),
    "top_skills": [
        "Python", "FastAPI", "AWS Lambda", "Docker", "Kubernetes",
        "PostgreSQL", "Redis", "CI/CD", "React", "TypeScript",
    ],
    "experience_highlights": [
        {
            "role": "Senior Software Engineer",
            "company": "Acme Corp",
            "duration": "2021 – Present",
            "key_achievement": [
                "Re-architected monolithic service into 12 microservices, reducing latency by 40%.",
                "Led a team of 5 engineers to deliver a real-time analytics platform serving 2M+ users.",
                "Introduced automated integration testing, increasing code coverage from 42% to 87%.",
            ],
        },
        {
            "role": "Software Engineer",
            "company": "TechStart Inc.",
            "duration": "2018 – 2021",
            "key_achievement": [
                "Built REST APIs serving 500k daily requests with 99.9% uptime SLA.",
                "Migrated on-premise infrastructure to AWS, cutting hosting costs by 35%.",
            ],
        },
    ],
    "education": [
        {"degree": "B.Sc. Computer Science", "school": "University of Texas", "year": "2018"},
    ],
    "certifications": ["AWS Certified Solutions Architect – Associate"],
}

failures = []
for tmpl in ["classic", "modern", "creative", "minimalist"]:
    for pages in [1, 2]:
        path = f"/tmp/test_{tmpl}_{pages}p.pdf"
        try:
            generate_pdf(path, persona, template=tmpl, page_count=pages)
            print(f"  OK  {tmpl:12s} {pages}p  →  {path}")
        except Exception as e:
            print(f"FAIL  {tmpl:12s} {pages}p  →  {e}")
            failures.append((tmpl, pages, str(e)))

if failures:
    print(f"\n{len(failures)} failure(s). Check logs above.")
    sys.exit(1)
else:
    print("\nAll 8 renders passed ✓")
