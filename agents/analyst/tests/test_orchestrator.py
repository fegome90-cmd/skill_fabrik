"""Placeholder tests for the AnalystOrchestrator."""
from __future__ import annotations

import pytest

from agents.analyst.orchestrator.orchestrator import AnalystOrchestrator


@pytest.mark.xfail(reason="Orchestrator aún no implementado completamente")
def test_process_batch_stub():
    orchestrator = AnalystOrchestrator()
    result = orchestrator.process_batch(pdf_files=None)
    assert result.run_id  # placeholder assertion
