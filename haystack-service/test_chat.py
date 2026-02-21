
import requests
import json
import uuid

BASE_URL = "http://localhost:3000"  # Assuming we can hit the API gateway or direct to service
# Since I am in the environment, I might need to hit the service directly if Gateway isn't internal
# AI Service is likely on port 8000
AI_SERVICE_URL = "http://localhost:8000"

def test_chat():
    session_id = str(uuid.uuid4())
    payload = {
        "user_id": "test_user",
        "session_id": session_id,
        "message": "Hello, can you help me improve my resume?",
        "profile_data": {}
    }
    
    print(f"Sending chat request to {AI_SERVICE_URL}/chat...")
    try:
        response = requests.post(f"{AI_SERVICE_URL}/chat", json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:", json.dumps(response.json(), indent=2))
        else:
            print("Error Response:", response.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_chat()
