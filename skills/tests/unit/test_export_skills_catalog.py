from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts" / "export_skills_catalog.py"
SPEC = importlib.util.spec_from_file_location("export_skills_catalog", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
exporter = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = exporter
SPEC.loader.exec_module(exporter)


def test_build_records_uses_live_manifest_rows(tmp_path: Path) -> None:
    segment = tmp_path / "skills-hub"
    ctx = segment / "_ctx"
    ctx.mkdir(parents=True)

    skill_file = tmp_path / "source" / "plan-architect" / "SKILL.md"
    skill_file.parent.mkdir(parents=True)
    skill_file.write_text(
        "---\n"
        "name: plan-architect\n"
        'description: "Use when generating a structured development plan."\n'
        "---\n\n"
        "# Plan Architect\n",
        encoding="utf-8",
    )

    (ctx / "skills_manifest.json").write_text(
        json.dumps(
            {
                "schema_version": 1,
                "skills": [
                    {
                        "name": "plan-architect",
                        "source_path": str(skill_file),
                        "source": "examen_grado",
                        "description": "Use when generating a structured development plan.",
                        "tags": [],
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    records, summary = exporter.build_records(segment_root=segment, repo_root=tmp_path)

    assert [record.skill_name for record in records] == ["plan-architect"]
    assert summary.exported == 1


def test_build_records_adds_repo_local_skills_missing_from_manifest(tmp_path: Path) -> None:
    segment = tmp_path / "skills-hub"
    ctx = segment / "_ctx"
    ctx.mkdir(parents=True)
    (ctx / "skills_manifest.json").write_text(
        json.dumps({"schema_version": 1, "skills": []}),
        encoding="utf-8",
    )

    skill_file = (
        tmp_path / "guardrails" / "secrets-and-config" / "SKILL.md"
    )
    skill_file.parent.mkdir(parents=True)
    skill_file.write_text(
        "---\n"
        "id: secrets-and-config\n"
        "type: guardrail\n"
        "summary: Keep secrets out of code and validate config early.\n"
        "---\n\n"
        "## Rules\n",
        encoding="utf-8",
    )

    records, _ = exporter.build_records(segment_root=segment, repo_root=tmp_path)

    by_name = {record.skill_name: record for record in records}
    assert "secrets-and-config" in by_name
    assert by_name["secrets-and-config"].source_group == "skills-fabrik"


def test_export_preserves_cloop_trigger_language(tmp_path: Path) -> None:
    segment = tmp_path / "skills-hub"
    ctx = segment / "_ctx"
    ctx.mkdir(parents=True)

    skill_file = tmp_path / "source" / "plan-architect" / "SKILL.md"
    skill_file.parent.mkdir(parents=True)
    skill_file.write_text(
        "---\n"
        "name: plan-architect\n"
        'description: "Use when generating a structured development plan, implementation roadmap, plan maestro, or CLOOP/CLOOP+G+S task plan with goals, non-goals, gates, scope, and evidence."\n'
        "---\n\n"
        "# Plan Architect\n\n"
        "Search triggers: CLOOP, CLOOP+G+S, plan maestro, gates, scope, non-goals, evidence.\n",
        encoding="utf-8",
    )

    (ctx / "skills_manifest.json").write_text(
        json.dumps(
            {
                "schema_version": 1,
                "skills": [
                    {
                        "name": "plan-architect",
                        "source_path": str(skill_file),
                        "source": "examen_grado",
                        "description": "Use when generating a structured development plan.",
                        "tags": [],
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    records, _ = exporter.build_records(segment_root=segment, repo_root=tmp_path)

    record = records[0]
    assert "plan maestro" in record.trigger_phrases_raw
    assert "cloop" in record.trigger_terms_extracted
    assert "gates" in record.trigger_terms_extracted
    assert "scope" in record.trigger_terms_extracted


def test_live_catalog_includes_required_entries() -> None:
    segment = Path("~/.trifecta/segments/skills-hub").expanduser()
    assert (segment / "_ctx" / "skills_manifest.json").exists()

    records, _ = exporter.build_records(segment_root=segment, repo_root=ROOT)

    exported = {record.skill_name for record in records}
    assert {
        "plan-architect",
        "database-management",
        "pm2-monitor",
        "secrets-and-config",
    } <= exported
