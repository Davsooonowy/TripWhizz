import time
from django.conf import settings
import redis

# Create a Redis connection pool
redis_pool = redis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=int(settings.REDIS_PORT),
    db=int(settings.REDIS_DB),
    password=settings.REDIS_PASSWORD or None,
    decode_responses=True
)


def get_redis_connection():
    """Get a Redis connection from the pool"""
    return redis.Redis(connection_pool=redis_pool)


# Rate limiting for friend requests
def check_friend_request_rate_limit(user_id):
    """
    Check if a user has exceeded the rate limit for friend requests
    Returns (allowed, current_count, reset_time)
    """
    r = get_redis_connection()
    key = f"rate:friend_request:{user_id}"
    max_requests = settings.FRIEND_REQUEST_RATE_LIMIT["max_requests"]
    time_window = settings.FRIEND_REQUEST_RATE_LIMIT["time_window"]

    # Get current count and TTL
    count = r.get(key)
    if count is None:
        # First request in the time window
        r.setex(key, time_window, 1)
        return True, 1, int(time.time()) + time_window

    count = int(count)
    ttl = r.ttl(key)

    if count >= max_requests:
        # Rate limit exceeded
        return False, count, int(time.time()) + ttl

    # Increment the counter
    r.incr(key)
    return True, count + 1, int(time.time()) + ttl
