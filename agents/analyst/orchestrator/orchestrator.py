"""Orchestrator stub for the Analyst Agent."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, List, Optional

from agents.analyst.tools.pipeline_adapter import PipelineAdapter
from agents.analyst.tools.memory_client import MemoryClient
from agents.analyst.tools.feedback_queue import FeedbackQueue


class RunState(Enum):
    PENDING = auto()
    EXTRACTING = auto()
    NORMALIZING = auto()
    PERSISTING = auto()
    WAITING_FEEDBACK = auto()
    DONE = auto()
    FAILED = auto()


@dataclass
class PipelineResult:
    run_id: str
    output_dir: str
    issues: List[str] = field(default_factory=list)
    artifacts: Dict[str, str] = field(default_factory=dict)


class AnalystOrchestrator:
    """Core orchestrator stub.

    TODO: implementar paralelización controlada, loop de feedback humano,
    manejo avanzado de errores y persistencia de ADRs según el plan.
    """

    def __init__(
        self,
        pipeline: Optional[PipelineAdapter] = None,
        memory: Optional[MemoryClient] = None,
        feedback: Optional[FeedbackQueue] = None,
    ) -> None:
        self.pipeline = pipeline or PipelineAdapter()
        self.memory = memory or MemoryClient()
        self.feedback = feedback or FeedbackQueue()

    def process_batch(self, pdf_files: Optional[List[str]] = None) -> PipelineResult:
        """Run the pipeline and store minimal metadata in MemTech.

        This is a synchronous placeholder; future versions will schedule tasks,
        handle retries, feedback loops, and context evolution.
        """
        result = self.pipeline.run(pdf_files)
        run_id = result.get("run_id") or result.get("output_dir", "latest").split('/')[-1]

        metadata = {
            "title": f"snickers-run-{run_id}",
            "content": str(result),
            "tags": ["snickers", "labs", "run"],
            "description": "Stub run metadata (TODO: enriquecer con summary/series/issues)",
        }
        self.memory.store(metadata)

        return PipelineResult(
            run_id=run_id,
            output_dir=result.get("output_dir", ""),
            issues=result.get("issues", []),
            artifacts=result.get("artifacts", {}),
        )


__all__ = ["AnalystOrchestrator", "RunState", "PipelineResult"]
