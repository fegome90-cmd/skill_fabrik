import sys
import types
import pytest

# Create a minimal stub for 'requests' before importing the module under test
class HTTPError(Exception):
    """HTTP error response"""
    pass


class DummyResponse:
    def __init__(self, json_data=None, status_code=200):
        self._json = json_data or {}
        self.status_code = status_code
    def json(self):
        return self._json
    def raise_for_status(self):
        if self.status_code >= 400:
            raise HTTPError()


def make_requests_stub(success=True):
    mod = types.SimpleNamespace()
    class RequestException(Exception): ...
    mod.RequestException = RequestException
    def post(_url, json=None, _timeout=10):
        if success:
            return DummyResponse({"ok": True, "echo": json}, 200)
        raise RequestException("network")
    def get(_url, _timeout=10):
        if success:
            return DummyResponse({"ok": True}, 200)
        raise RequestException("network")
    mod.post = post
    mod.get = get
    return mod


def test_memory_client_store_success(_monkeypatch):
    sys.modules['requests'] = make_requests_stub(success=True)
    from agents.analyst.tools.memory_client import MemoryClient
    mc = MemoryClient(base_url="http://test", timeout=1)
    out = mc.store({"title": "t"})
    assert isinstance(out, dict)


def test_memory_client_store_error(_monkeypatch):
    sys.modules['requests'] = make_requests_stub(success=False)
    from agents.analyst.tools.memory_client import MemoryClient
    mc = MemoryClient(base_url="http://test", timeout=1)
    out = mc.store({"title": "t"})
    assert out["success"] is False


def test_memory_client_health_success(_monkeypatch):
    sys.modules['requests'] = make_requests_stub(success=True)
    from agents.analyst.tools.memory_client import MemoryClient
    mc = MemoryClient(base_url="http://test", timeout=1)
    out = mc.health()
    assert out["ok"] is True