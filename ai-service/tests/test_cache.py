
import pytest
import sys
import os
import time
import redis

# Add parent directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cache.redis_cache import ResponseCache

# Mock Redis connection for testing if real one isn't available, 
# but we prefer integration testing with the real container if possible.
# For unit tests, we'll assume the docker container is running or mock it.

@pytest.fixture
def redis_cache():
    # Use a distinct prefix for testing to avoid colliding with real data
    # We rely on the generic 'redis' hostname inside docker, or localhost if running outside
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    cache = ResponseCache(redis_url=redis_url) # Short TTL not supported in init, default is used
    return cache

def test_redis_connection(redis_cache):
    """Verify we can connect to Redis"""
    if not redis_cache.redis:
        pytest.skip("Redis not available")
    assert redis_cache.redis.ping() is True

def test_set_and_get(redis_cache):
    """Verify basic set and get functionality"""
    if not redis_cache.redis:
        pytest.skip("Redis not available")
        
    agent = "test_agent"
    query = "test_query"
    response = "test_response_data"
    
    # helper to clear potential previous keys
    key = redis_cache._generate_key(agent, query)
    redis_cache.redis.delete(key)
    
    # 1. Test Set
    redis_cache.set(agent, query, response)
    
    # 2. Test Get Hit
    cached = redis_cache.get(agent, query)
    assert cached == response
    
def test_cache_miss(redis_cache):
    """Verify cache miss returns None"""
    if not redis_cache.redis:
        pytest.skip("Redis not available")
        
    agent = "test_agent"
    query = "non_existent_query"
    
    cached = redis_cache.get(agent, query)
    assert cached is None

def test_ttl_expiration(redis_cache):
    """Verify keys expire after TTL"""
    if not redis_cache.redis:
        pytest.skip("Redis not available")
        
    # Manually set Short TTL for testing
    redis_cache.ttl = 1 
    
    agent = "test_agent"
    query = "expire_query"
    response = "data"
    
    # Set with the manual 1-second TTL
    redis_cache.set(agent, query, response)
    
    # Verify it exists immediately
    assert redis_cache.get(agent, query) == response
    
    # Wait for TTL + buffer (1.5s)
    time.sleep(1.5)
    
    # Verify it's gone
    assert redis_cache.get(agent, query) is None
