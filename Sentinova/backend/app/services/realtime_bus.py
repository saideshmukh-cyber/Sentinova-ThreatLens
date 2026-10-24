import asyncio
import json
import logging

from redis.asyncio import Redis

from backend.app.config import settings
from backend.app.websocket.manager import manager

logger = logging.getLogger(__name__)
CHANNEL = "threatlens:realtime"


async def publish_event(message: dict) -> None:
    """Publish an event through Redis so multiple API instances can fan it out."""
    if not isinstance(message, dict) or not message:
        return
    try:
        client = Redis.from_url(settings.redis_url, decode_responses=True)
        try:
            await client.publish(CHANNEL, json.dumps(message))
        finally:
            await client.aclose()
    except Exception:
        # Local development still works if Redis is temporarily unavailable.
        await manager.broadcast(message)


async def listen_for_events(stop_event: asyncio.Event) -> None:
    """Subscribe to Redis and deliver events to this API instance's WebSocket clients."""
    while not stop_event.is_set():
        client = Redis.from_url(settings.redis_url, decode_responses=True)
        pubsub = client.pubsub()
        try:
            await pubsub.subscribe(CHANNEL)
            while not stop_event.is_set():
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message.get("data"):
                    try:
                        payload = json.loads(message["data"])
                        await manager.broadcast(payload)
                    except (TypeError, json.JSONDecodeError):
                        logger.warning("Ignoring malformed realtime event")
                await asyncio.sleep(0)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.warning("Redis realtime listener unavailable; retrying in 2 seconds")
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=2)
            except asyncio.TimeoutError:
                pass
        finally:
            try:
                await pubsub.unsubscribe(CHANNEL)
                await pubsub.aclose()
            except Exception:
                pass
            await client.aclose()
