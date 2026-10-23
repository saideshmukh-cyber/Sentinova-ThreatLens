import asyncio

from backend.app.websocket.manager import ConnectionManager


class FakeSocket:
    def __init__(self, fail=False):
        self.sent = []
        self.fail = fail

    async def send_json(self, message):
        if self.fail:
            raise RuntimeError("closed")
        self.sent.append(message)


def test_manager_broadcast_and_cleanup():
    async def run():
        manager = ConnectionManager()
        good = FakeSocket()
        bad = FakeSocket(fail=True)
        manager.connections.update({good, bad})
        await manager.broadcast({"event": "test"})
        assert good.sent == [{"event": "test"}]
        assert bad not in manager.connections
    asyncio.run(run())
