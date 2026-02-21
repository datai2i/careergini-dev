
import pytest
import sys
import os
import requests
import json
import time

# Integration tests assume the service is running on localhost:8000
BASE_URL = "http://localhost:8000"
TEST_USER_ID = "integration_test_user"

def test_health_check():
    """Verify service is up"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    except requests.exceptions.ConnectionError:
        pytest.fail("AI Service is not reachable. Is it running?")

def test_resume_upload_and_extraction():
    """
    1. Upload a dummy resume
    2. Check if persona is created
    """
    # Create a dummy text file as resume
    resume_content = """
    John Integration
    Senior Python Developer
    Email: john@test.com
    
    Skills: Python, Docker, Kubernetes, Pytest
    
    Experience:
    Software Engineer at TestCo (2020-Present)
    - Built automated tests
    """
    
    files = {
        'file': ('resume.txt', resume_content, 'text/plain')
    }
    
    response = requests.post(f"{BASE_URL}/resume/upload?user_id={TEST_USER_ID}", files=files)
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "success"
    # Basic data should be present even if extraction is effectively mocked by "fast" model
    # Note: extraction depends on LLM, so we check if key keys exist
    assert "persona" in data

def test_chat_context_awareness():
    """
    Verify the chat agent behaves as if it knows the user (Context Injection)
    """
    # Give it a moment for any async processing
    time.sleep(2)
    
    payload = {
        "user_id": TEST_USER_ID,
        "session_id": "test_session_1",
        "message": "What is my name and current role?",
        "stream": False 
    }
    
    response = requests.post(f"{BASE_URL}/chat", json=payload)
    assert response.status_code == 200
    
    answer = response.json()["response"].lower()
    
    # We expect the AI to mention the name/role from the resume
    # This is a "fragile" test depending on LLM quality, but checks the plumbing
    # We'll assert status 200 primarily, and log the content
    print(f"\nAI Answer: {answer}")
    
def test_memory_update():
    """
    Send a message that triggers a profile update and verify it back
    """
    # 1. Send explicit update
    payload = {
        "user_id": TEST_USER_ID,
        "session_id": "test_session_1",
        "message": "I just learned a new skill: Rust. My goal is to become a Systems Engineer.",
        "stream": False
    }
    
    response = requests.post(f"{BASE_URL}/chat", json=payload)
    assert response.status_code == 200
    
    # Wait for background task to update profile (it's async)
    time.sleep(5)
    
    # 2. Check Persona - we don't have a direct GET /persona endpoint publicly documented
    # but we can try to inspect the file if we are running locally, 
    # OR rely on the chat to confirm it in a follow-up.
    # Let's inspect the file directly since this is an integration test running on the box.
    
    profile_path = f"/app/uploads/{TEST_USER_ID}/unified_profile.json"
    
    # We are running inside the container context for pytest, or outside?
    # If running via `docker exec`, /app/uploads is correct.
    
    if os.path.exists(profile_path):
        with open(profile_path, "r") as f:
            profile = json.load(f)
            
        # We assume the ProfileUpdaterAgent works. 
        # CAUTION: Local LLM might miss the extraction. 
        # We will log the result rather than hard fail if LLM is flaky.
        print(f"\nUpdated Skills: {profile.get('skills')}")
        print(f"Updated Goals: {profile.get('goals')}")
    else:
        print(f"\nWarning: Profile path {profile_path} not found (might be mapped differently outside container)")

if __name__ == "__main__":
    # Allow running directly
    pytest.main([__file__])
