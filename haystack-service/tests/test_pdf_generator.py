
import pytest
import sys
import os
from unittest.mock import MagicMock, patch

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pdf_generator import generate_pdf

TEST_PDF_PATH = "test_resume.pdf"

@pytest.fixture
def cleanup_pdf():
    yield
    if os.path.exists(TEST_PDF_PATH):
        os.remove(TEST_PDF_PATH)

def test_pdf_creation(cleanup_pdf):
    """Verify PDF file is created with valid content"""
    
    data = {
        "contact_info": {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "555-0123",
            "linkedin": "linkedin.com/in/johndoe",
            "github": "github.com/johndoe"
        },
        "professional_summary": "Experienced developer.",
        "skills": ["Python", "React", "Docker"],
        "work_experience": [
            {
                "position": "Senior Dev",
                "company": "Tech Corp",
                "duration": "2020-Present",
                "description": ["Built things.", "Fixed bugs."]
            }
        ],
        "education": [
            {
                "degree": "BS CS",
                "school": "University",
                "year": "2019"
            }
        ]
    }
    
    # We strictly don't want to mock reportlab logic itself, as we want to ensure it runs
    # but we do want to avoid complex font loading issues if environment is minimal.
    # The current container has full reportlab, so we run it for real.
    
    try:
        generate_pdf(TEST_PDF_PATH, data) # Corrected function name
        
        assert os.path.exists(TEST_PDF_PATH)
        assert os.path.getsize(TEST_PDF_PATH) > 1000 # Should be non-empty
        
    except Exception as e:
        pytest.fail(f"PDF Generation failed: {e}")
