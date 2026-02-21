"""
Redis caching layer for AI responses.
Provides significant speedup for common queries.
"""
import hashlib
import json
from typing import Optional
import redis
import logging

logger = logging.getLogger(__name__)

class ResponseCache:
    def __init__(self, redis_url: str = "redis://redis:6379/0"):
        """Initialize Redis cache connection."""
        try:
            self.redis = redis.from_url(redis_url, decode_responses=True)
            self.redis.ping()
            self.ttl = 86400  # 24 hours
            logger.info(f"✓ Redis cache connected: {redis_url}")
        except Exception as e:
            logger.warning(f"Redis cache unavailable: {e}")
            self.redis = None
    
    def _generate_key(self, agent: str, query: str) -> str:
        """Generate cache key from agent and query."""
        # Normalize query (lowercase, strip whitespace)
        normalized = query.lower().strip()
        # Hash for consistent key length
        query_hash = hashlib.md5(normalized.encode()).hexdigest()
        return f"response:{agent}:{query_hash}"
    
    def get(self, agent: str, query: str) -> Optional[str]:
        """Get cached response if available."""
        if not self.redis:
            return None
        
        try:
            key = self._generate_key(agent, query)
            cached = self.redis.get(key)
            
            if cached:
                logger.info(f"✓ Cache HIT for {agent}: {query[:50]}...")
                return cached
            else:
                logger.info(f"✗ Cache MISS for {agent}: {query[:50]}...")
                return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    def set(self, agent: str, query: str, response: str):
        """Store response in cache."""
        if not self.redis:
            return
        
        try:
            key = self._generate_key(agent, query)
            self.redis.setex(key, self.ttl, response)
            logger.info(f"✓ Cached response for {agent}: {query[:50]}...")
        except Exception as e:
            logger.error(f"Cache set error: {e}")
    
    def clear(self):
        """Clear all cached responses."""
        if not self.redis:
            return
        
        try:
            keys = self.redis.keys("response:*")
            if keys:
                self.redis.delete(*keys)
                logger.info(f"✓ Cleared {len(keys)} cached responses")
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        if not self.redis:
            return {"status": "unavailable"}
        
        try:
            info = self.redis.info()
            keys = len(self.redis.keys("response:*"))
            
            return {
                "status": "connected",
                "cached_responses": keys,
                "memory_used": info.get("used_memory_human", "N/A"),
                "hit_rate": "N/A"  # Would need to track hits/misses
            }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {"status": "error", "error": str(e)}
