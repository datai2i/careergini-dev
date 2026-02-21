
import logging
from pdf_generator import generate_pdf
import os

# Configure logging
logging.basicConfig(level=logging.INFO)

# Sample Persona Data
sample_persona = {
    "full_name": "John Doe",
    "professional_title": "Senior Software Engineer",
    "email": "john.doe@example.com",
    "phone": "123-456-7890",
    "location": "San Francisco, CA",
    "summary": "Experienced software engineer with a passion for building scalable web applications. Proven track record of delivering high-quality code and leading development teams.",
    "top_skills": ["Python", "React", "Docker", "AWS", "FastAPI"],
    "experience_highlights": [
        {
            "role": "Senior Developer",
            "company": "Tech Corp",
            "duration": "2020 - Present",
            "key_achievement": "Led migration to microservices architecture, reducing latency by 40%."
        },
        {
            "role": "Software Developer",
            "company": "Startup Inc",
            "duration": "2018 - 2020",
            "key_achievement": "Developed core product features using React and Node.js."
        }
    ],
    "education": [
        {
            "degree": "B.S. Computer Science",
            "school": "University of Technology",
            "year": "2018"
        }
    ]
}

output_file = "test_resume.pdf"

if __name__ == "__main__":
    print(f"Generating PDF to {output_file}...")
    try:
        generate_pdf(output_file, sample_persona)
        if os.path.exists(output_file):
            size = os.path.getsize(output_file)
            print(f"SUCCESS: PDF generated. Size: {size} bytes")
        else:
            print("FAILURE: PDF file not found after generation.")
    except Exception as e:
        print(f"FAILURE: Exception occurred: {e}")
