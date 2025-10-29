"""Client stub to interact with MemTech via backend API."""
from __future__ import annotations

import logging
from typing import Dict, Optional

import requests

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = "http://127.0.0.1:8077/api/memtech"


class MemoryClient:
    """Minimal HTTP client for MemTech endpoints.

    TODO: manejar budgets, circuit breaker, y políticas de consenso.
    """

    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: int = 10) -> None:
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout

    def store(self, payload: Dict) -> Dict:
        try:
            response = requests.post(
                f"{self.base_url}/store",
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            logger.error("[MemoryClient] Store failed: %s", exc)
            return {"success": False, "error": str(exc)}

    def resolve(self, uri: Optional[str] = None, query: Optional[str] = None) -> Dict:
        try:
            response = requests.post(
                f"{self.base_url}/resolve",
                json={"uri": uri, "query": query},
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            logger.error("[MemoryClient] Resolve failed: %s", exc)
            return {"success": False, "error": str(exc)}

    def health(self) -> Dict:
        try:
            response = requests.get(
                f"{self.base_url}/health",
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            logger.error("[MemoryClient] Health check failed: %s", exc)
            return {"success": False, "error": str(exc)}


__all__ = ["MemoryClient"]
