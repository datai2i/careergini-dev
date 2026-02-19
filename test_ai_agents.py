
import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"

def run_test(name, endpoint, method="POST", data=None, files=None):
    print(f"\n--- Testing {name} ---")
    start_time = time.time()
    try:
        if method == "POST":
            if files:
                response = requests.post(f"{BASE_URL}{endpoint}", files=files)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json=data, headers={"Content-Type": "application/json"})
        else:
            response = requests.get(f"{BASE_URL}{endpoint}")
        
        duration = time.time() - start_time
        
        if response.status_code == 200:
            print(f"✅ SUCCESS ({duration:.2f}s)")
            # Print first 200 chars of response to verify content
            print(f"Response: {response.text[:200]}...")
            return True, duration
        else:
            print(f"❌ FAILED ({duration:.2f}s) - Status: {response.status_code}")
            print(f"Error: {response.text}")
            return False, duration
            
    except Exception as e:
        print(f"❌ KERNEL ERROR: {e}")
        return False, 0

# Test Data
dummy_resume_text = """
John Doe
Software Engineer
Email: john@example.com
Phone: 123-456-7890
Location: San Francisco, CA

Summary: Experienced software engineer with 5 years in Python and React.

Experience:
Senior Developer at Tech Corp (2020-Present)
- Built scalable APIs using FastAPI
- Optimized database queries

Education:
BS Computer Science, University of Tech (2016-2020)

Skills: Python, TypeScript, Docker, Kubernetes, AWS
"""

dummy_profile = {
    "name": "John Doe",
    "skills": ["Python", "React", "Docker"],
    "experience": [{"title": "Software Engineer", "years": 5}],
    "education": [{"degree": "BS CS"}]
}

dummy_job = {
    "title": "Senior Python Engineer",
    "description": "We are looking for a python expert with FastAPI and Docker experience.",
    "requirements": ["Python", "FastAPI", "Docker", "AWS"]
}

# dummy_pdf = create_dummy_pdf() # Skip file upload for now, test text endpoints

tests = [
    ("Health Check", "/health", "GET", None),
    ("Chat (Simple)", "/chat", "POST", {
        "user_id": "test_user", "session_id": "test_1", "message": "What is the capital of France?"
    }),
    ("Resume Parse (Text)", "/resume/parse", "POST", {
        "text": dummy_resume_text
    }),
    ("LinkedIn Parse (Text)", "/linkedin/parse-text", "POST", {
        "text": "Jane Smith | Product Manager | San Francisco\nExperienced PM driving growth."
    }),
    ("ATS Score", "/resume/ats-score", "POST", {
        "resume_text": dummy_resume_text,
        "job_description": dummy_job["description"]
    }),
    ("Job Match", "/jobs/match-score", "POST", {
        "user_profile": dummy_profile,
        "job_posting": dummy_job
    }),
    ("Skill Gap", "/skills/gap-analysis", "POST", {
        "user_profile": dummy_profile,
        "target_role": "Senior Python Engineer"
    }),
    ("Interview Start", "/interview/start", "POST", {
        "job_role": "Software Engineer",
        "difficulty": "medium"
    }),
    ("Career Path", "/career/predict-path", "POST", {
        "user_profile": dummy_profile,
        "target_role": "CTO"
    })
]

results = []

print("Starting AI Agent Performance Tests...")
print("Note: First request might be slow due to model loading.")

for name, endpoint, method, payload in tests:
    success, duration = run_test(name, endpoint, method, payload)
    results.append({"name": name, "success": success, "duration": duration})

print("\n\n=== SUMMARY ===")
for r in results:
    status = "✅" if r["success"] else "❌"
    print(f"{status} {r['name']}: {r['duration']:.2f}s")
