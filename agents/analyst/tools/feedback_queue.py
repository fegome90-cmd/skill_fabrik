"""Stub feedback queue interface."""
from __future__ import annotations

import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class FeedbackQueue:
    """Placeholder feedback queue.

    TODO: implementar consumo/producción real contra endpoints `/api/feedback/*`.
    """

    def __init__(self) -> None:
        self._pending: List[Dict] = []

    def add(self, item: Dict) -> None:
        logger.info("[FeedbackQueue] Añadiendo item a espera de feedback")
        self._pending.append(item)

    def list_pending(self) -> List[Dict]:
        return list(self._pending)

    def submit(self, update: Dict) -> None:
        logger.info("[FeedbackQueue] Recibida decisión humana: %s", update)
        # TODO: Integrar con backend real


__all__ = ["FeedbackQueue"]
