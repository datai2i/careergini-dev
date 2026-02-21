
import pytest
import sys
import os
import json
import shutil
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from persona_manager import PersonaManager

TEST_USER_ID = "test_qa_user"
# Use absolute path for testing in container
TEST_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", TEST_USER_ID)

@pytest.fixture
def clean_env():
    """Setup and teardown of test environment"""
    # Teardown previous run if exists
    if os.path.exists(TEST_UPLOAD_DIR):
        shutil.rmtree(TEST_UPLOAD_DIR)
    
    yield
    
    # Cleanup after test
    if os.path.exists(TEST_UPLOAD_DIR):
        shutil.rmtree(TEST_UPLOAD_DIR)

def test_initialization(clean_env):
    """Verify new profile creation"""
    # Inject test directory
    pm = PersonaManager(TEST_USER_ID, base_dir=TEST_UPLOAD_DIR)
    
    # Profile file shouldn't exist yet (lazy saving)
    # assert os.path.exists(pm.profile_path) 
    
    # Verify default state in memory
    assert pm.profile["identity"]["full_name"] == ""
    assert pm.profile["meta"]["sources"] == []
    
    # Verify directory exists
    assert os.path.exists(pm.base_dir)

def test_resume_ingestion(clean_env):
    """Verify resume data merging"""
    pm = PersonaManager(TEST_USER_ID, base_dir=TEST_UPLOAD_DIR)
    
    resume_data = {
        "full_name": "QA Tester",
        "professional_title": "Bug Hunter",
        "top_skills": ["Python", "Pytest"],
        "experience_highlights": [{"role": "Tester", "company": "TechCorp"}]
    }
    
    pm.ingest_resume_data(resume_data)
    
    # Reload to verify persistence
    pm2 = PersonaManager(TEST_USER_ID, base_dir=TEST_UPLOAD_DIR)
    
    assert pm2.profile["identity"]["full_name"] == "QA Tester"
    assert pm2.profile["identity"]["professional_title"] == "Bug Hunter"
    assert "Python" in pm2.profile["skills"]
    assert len(pm2.profile["experience"]) == 1
    assert "resume" in pm2.profile["meta"]["sources"]

def test_chat_update(clean_env):
    """Verify updates from chat memory"""
    pm = PersonaManager(TEST_USER_ID, base_dir=TEST_UPLOAD_DIR)
    
    # 1. Update Goals
    pm.update_from_chat("update_goals", {"goals": ["Become CTO"]})
    assert "Become CTO" in pm.profile["goals"]
    
    # 2. Update Skills (should be additive)
    pm.profile["skills"] = ["Python"]
    pm.update_from_chat("update_skills", {"skills": ["Docker"]})
    
    assert "Python" in pm.profile["skills"]
    assert "Docker" in pm.profile["skills"]
    assert "chat" in pm.profile["meta"]["sources"]

def test_context_generation(clean_env):
    """Verify LLM context string generation"""
    pm = PersonaManager(TEST_USER_ID, base_dir=TEST_UPLOAD_DIR)
    pm.profile["identity"]["full_name"] = "Alice"
    pm.profile["skills"] = ["Java", "Spring"]
    
    context = pm.get_context_for_llm()
    
    assert "Alice" in context
    assert "Java" in context
    assert "Spring" in context
