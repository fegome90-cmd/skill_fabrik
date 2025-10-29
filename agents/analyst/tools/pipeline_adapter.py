"""Stub pipeline adapter.

Bridges the Analyst Agent with existing Snickers pipelines.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, List, Optional

from services.pipeline_service import PipelineService

logger = logging.getLogger(__name__)


class PipelineAdapter:
    """Thin wrapper around the existing PipelineService.

    TODO: ampliar con colas por fase, triggers diferidos, métricas y tolerancia a fallos.
    """

    def __init__(self, data_dir: str = ".", config_path: str = "config.yaml") -> None:
        self.service = PipelineService(data_dir=data_dir, config_path=config_path)

    def run(self, pdf_files: Optional[List[str]] = None) -> Dict:
        logger.info("[PipelineAdapter] Ejecutando pipeline analista")
        result = self.service.run(pdf_files=pdf_files)
        if result.get("status") != "success":
            logger.error("[PipelineAdapter] Pipeline retornó error: %s", result)
        return result

    def latest_run_id(self) -> Optional[str]:
        return self.service.get_latest_run_id()


__all__ = ["PipelineAdapter"]
