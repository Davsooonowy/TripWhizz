import json
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


# Online status tracking
def set_user_online(user_id):
    """Mark a user as online"""
    r = get_redis_connection()
    # Set user in the online users set with expiration
    r.setex(f"user:online:{user_id}", 300, 1)  # 5 minutes expiration
    # Add to the set of all online users
    r.sadd("online_users", user_id)
    # Publish user online event
    r.publish("user_status", json.dumps({"user_id": user_id, "status": "online"}))


def set_user_offline(user_id):
    """Mark a user as offline"""
    r = get_redis_connection()
    # Remove user from online status
    r.delete(f"user:online:{user_id}")
    # Remove from the set of all online users
    r.srem("online_users", user_id)
    # Publish user offline event
    r.publish("user_status", json.dumps({"user_id": user_id, "status": "offline"}))


def is_user_online(user_id):
    """Check if a user is online"""
    r = get_redis_connection()
    return bool(r.exists(f"user:online:{user_id}"))


def get_online_users():
    """Get all online users"""
    r = get_redis_connection()
    return [int(user_id) for user_id in r.smembers("online_users") if r.exists(f"user:online:{user_id}")]


def refresh_user_online_status(user_id):
    """Refresh a user's online status"""
    r = get_redis_connection()
    if r.exists(f"user:online:{user_id}"):
        r.setex(f"user:online:{user_id}", 300, 1)  # Reset expiration to 5 minutes


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


# Real-time notifications
def send_notification(user_id, notification_data):
    """Send a real-time notification to a user"""
    r = get_redis_connection()
    channel = f"user:{user_id}:notifications"
    r.publish(channel, json.dumps(notification_data))
