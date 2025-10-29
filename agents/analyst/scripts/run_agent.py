"""CLI stub to run the Analyst Agent orchestrator."""
from __future__ import annotations

import argparse
import logging

from agents.analyst.orchestrator.orchestrator import AnalystOrchestrator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Analyst Agent (stub)")
    parser.add_argument("--pdf", action="append", help="Ruta de PDF a procesar (opcional)")
    args = parser.parse_args()

    orchestrator = AnalystOrchestrator()
    result = orchestrator.process_batch(pdf_files=args.pdf)
    logger.info("Run result: %s", result)


if __name__ == "__main__":
    main()
