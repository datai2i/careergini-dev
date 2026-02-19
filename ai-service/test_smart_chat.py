
import requests
import json
import uuid
import time

AI_SERVICE_URL = "http://localhost:8000"
USER_ID = "smart_chat_test_user"

def test_smart_chat():
    print(f"=== Testing Smart Chat for user: {USER_ID} ===")
    
    # 1. Create a dummy resume file
    resume_content = """
    Jane Doe
    Senior Python Developer
    San Francisco, CA
    
    Summary:
    Expert in Python, FastAPI, and AI agents. 5 years of experience building scalable backends.
    
    Experience:
    - Senior Software Engineer at TechCo (2020-Present): Built AI services using LangGraph.
    - Backend Developer at  StartupInc (2018-2020): API development with Django.
    
    Skills: Python, Docker, Kubernetes, LangChain, Redis.
    """
    
    files = {'file': ('resume.txt', resume_content, 'text/plain')}
    
    # 2. Upload Resume to seed Persona
    print("\n1. Uploading Resume...")
    try:
        response = requests.post(f"{AI_SERVICE_URL}/resume/upload", 
                                 params={"user_id": USER_ID},
                                 files=files)
        if response.status_code == 200:
            print("✓ Resume Uploaded Successfully")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"✗ Upload Failed: {response.text}")
            return
    except Exception as e:
        print(f"✗ Exception during upload: {e}")
        return

    time.sleep(1) # Wait for file write

    # 3. Ask a context-aware question
    print("\n2. Asking Context-Aware Question: 'What roles should I apply for?'...")
    session_id = str(uuid.uuid4())
    payload = {
        "user_id": USER_ID,
        "session_id": session_id,
        "message": "Based on my profile, what specific job titles should I target?",
        "profile_data": {} # Intentionally empty to force reliance on server-side Persona
    }
    
    try:
        response = requests.post(f"{AI_SERVICE_URL}/chat", json=payload, timeout=60)
        if response.status_code == 200:
            data = response.json()
            answer = data.get("response", "")
            print("\nAI Response:")
            print(answer)
            print("-" * 50)
            
            # Validation
            if "Python" in answer or "Backend" in answer or "Engineer" in answer:
                print("✓ PASS: AI referenced context (Python/Backend/Engineer).")
            else:
                print("✗ FAIL: AI response does not seem context-aware.")
        else:
            print(f"✗ Chat Failed: {response.text}")
    except Exception as e:
        print(f"✗ Exception during chat: {e}")

    # 4. Test Memory Module (Dynamic Update)
    print("\n3. Testing Memory Module: 'I just passed the AWS Solutions Architect exam'...")
    payload["message"] = "I just passed the AWS Solutions Architect exam."
    
    try:
        response = requests.post(f"{AI_SERVICE_URL}/chat", json=payload, timeout=60)
        if response.status_code == 200:
            print("AI Acknowledged.")
            
            # Wait for background task
            print("Waiting for background update...")
            time.sleep(5) 
            
            # Check unified profile
            # We can't query it via API yet, so we'll check file system (since we are local)
            profile_path = f"uploads/{USER_ID}/unified_profile.json"
            try:
                with open(profile_path, "r") as f:
                    profile = json.load(f)
                    
                skills = profile.get("skills", [])
                goals = profile.get("goals", [])
                print(f"Current Skills: {skills}")
                
                if any("AWS" in s for s in skills):
                    print("✓ PASS: Memory Module updated skills with AWS.")
                else:
                    print("✗ FAIL: AWS not found in skills.")
                    
            except Exception as e:
                print(f"✗ Could not read profile file: {e}")
        else:
            print(f"✗ Chat Failed: {response.text}")
            
    except Exception as e:
        print(f"✗ Exception during memory test: {e}")

if __name__ == "__main__":
    test_smart_chat()
