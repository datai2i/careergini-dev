#!/bin/bash
# Agent Performance Testing Script
# Tests all 6 agents with realistic use cases

API_URL="http://localhost:3000/api/ai/chat"
SESSION_ID="test_$(date +%s)"

echo "==================================="
echo "CareerGini Agent Performance Tests"
echo "==================================="
echo ""

# Function to test a query
test_query() {
    local query="$1"
    local expected_agent="$2"
    local test_name="$3"
    
    echo "----------------------------------------"
    echo "TEST: $test_name"
    echo "Query: $query"
    echo "Expected Agent: $expected_agent"
    echo ""
    
    start_time=$(date +%s%3N)
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"user_id\": \"test_user\", \"session_id\": \"$SESSION_ID\", \"message\": \"$query\"}")
    
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    actual_agent=$(echo "$response" | jq -r '.agent')
    response_text=$(echo "$response" | jq -r '.response')
    
    echo "Actual Agent: $actual_agent"
    echo "Response Time: ${duration}ms"
    echo "Response Preview: ${response_text:0:150}..."
    echo ""
    
    if [ "$actual_agent" = "$expected_agent" ]; then
        echo "✅ PASS - Correct routing"
    else
        echo "❌ FAIL - Expected $expected_agent, got $actual_agent"
    fi
    echo ""
}

# Test 1: Supervisor Routing Tests
echo "=== SUPERVISOR ROUTING TESTS ==="
echo ""

test_query "Tell me about my career path" "profile" "Profile Query"
test_query "What programming languages should I learn for AI?" "skills_gap" "Skills Gap Query"
test_query "Help me find remote software engineering jobs" "job_search" "Job Search Query"
test_query "Review my resume and suggest improvements" "resume" "Resume Builder Query"
test_query "Recommend courses for machine learning" "learning" "Learning Query"

# Test 2: Skills Gap Agent - Quality Tests
echo "=== SKILLS GAP AGENT - QUALITY TESTS ==="
echo ""

test_query "What skills do I need to become an AI engineer?" "skills_gap" "AI Engineer Skills"
test_query "Should I learn Rust or Go for backend development?" "skills_gap" "Language Comparison"
test_query "What should a React developer learn next?" "skills_gap" "Frontend Progression"

# Test 3: Job Search Agent - Quality Tests
echo "=== JOB SEARCH AGENT - QUALITY TESTS ==="
echo ""

test_query "How to find remote jobs for software engineers?" "job_search" "Remote Job Search"
test_query "Best job boards for entry-level developers?" "job_search" "Entry Level Jobs"
test_query "How to negotiate salary for tech jobs?" "job_search" "Salary Negotiation"

# Test 4: Resume Builder Agent - Quality Tests
echo "=== RESUME BUILDER AGENT - QUALITY TESTS ==="
echo ""

test_query "How to make my resume ATS-friendly?" "resume" "ATS Optimization"
test_query "Best way to describe projects on resume?" "resume" "Project Description"
test_query "How to explain employment gap in resume?" "resume" "Employment Gap"

# Test 5: Learning Agent - Quality Tests
echo "=== LEARNING AGENT - QUALITY TESTS ==="
echo ""

test_query "Best online courses for machine learning?" "learning" "ML Courses"
test_query "Free resources to learn Python programming?" "learning" "Free Python Resources"
test_query "Should I get AWS certification?" "learning" "Certification Advice"

# Test 6: Profile Agent - Quality Tests
echo "=== PROFILE AGENT - QUALITY TESTS ==="
echo ""

test_query "I want to switch from software to data science" "profile" "Career Transition"
test_query "Should I work in startups or big tech companies?" "profile" "Industry Choice"

echo "==================================="
echo "Testing Complete!"
echo "==================================="
