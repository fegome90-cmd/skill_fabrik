from __future__ import annotations

import csv
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
SKILLS_HUB_SEGMENT = Path("~/.trifecta/segments/skills-hub").expanduser()
MANIFEST_PATH = SKILLS_HUB_SEGMENT / "_ctx" / "skills_manifest.json"
OUTPUT_DIR = ROOT / "data" / "skills_catalog"
OUTPUT_PATH = OUTPUT_DIR / "skills_catalog.csv"
LOCAL_SOURCE_GROUP = "skills-fabrik"
CSV_COLUMNS = [
    "skill_name",
    "skill_slug",
    "source_group",
    "path",
    "title",
    "description_raw",
    "description_brief",
    "trigger_phrases_raw",
    "trigger_terms_extracted",
    "trigger_count",
]


@dataclass(frozen=True)
class SkillRecord:
    skill_name: str
    skill_slug: str
    source_group: str
    path: str
    title: str
    description_raw: str
    description_brief: str
    trigger_phrases_raw: str
    trigger_terms_extracted: str
    trigger_count: int


@dataclass(frozen=True)
class ExportSummary:
    exported: int
    manifest_rows: int
    local_fallback_rows: int


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def parse_frontmatter(content: str) -> tuple[dict[str, str], str]:
    if not content.startswith("---\n"):
        return {}, content

    match = re.match(r"^---\n(.*?)\n---\n?(.*)$", content, re.DOTALL)
    if match is None:
        return {}, content

    raw_frontmatter, body = match.groups()
    metadata: dict[str, str] = {}
    for line in raw_frontmatter.splitlines():
        if not line or line.lstrip().startswith("#"):
            continue
        if line.startswith((" ", "\t", "-")):
            continue
        key, sep, raw_value = line.partition(":")
        if not sep:
            continue
        value = raw_value.strip().strip("'").strip('"')
        metadata[key.strip()] = value
    return metadata, body


def extract_title(body: str) -> str:
    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return ""


def find_search_trigger_lines(body: str) -> list[str]:
    lines: list[str] = []
    for line in body.splitlines():
        if "search triggers:" in line.lower():
            _, _, remainder = line.partition(":")
            lines.append(remainder.strip())
    return lines


def split_trigger_phrases(fragments: Iterable[str]) -> list[str]:
    phrases: list[str] = []
    seen: set[str] = set()
    for fragment in fragments:
        cleaned_fragment = normalize_whitespace(fragment)
        if not cleaned_fragment:
            continue
        for chunk in re.split(r"[;,]", cleaned_fragment):
            phrase = normalize_whitespace(
                re.sub(r"^(use when|when|search triggers:)\s+", "", chunk, flags=re.IGNORECASE)
            ).strip(" .:")
            if not phrase:
                continue
            lowered = phrase.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            phrases.append(phrase)
    return phrases


def extract_terms(phrases: Iterable[str]) -> list[str]:
    terms: list[str] = []
    seen: set[str] = set()
    for phrase in phrases:
        for token in re.findall(r"[a-z0-9]+(?:\+[a-z0-9]+)*", phrase.lower()):
            if len(token) <= 1 and token not in {"c", "r"}:
                continue
            if token in seen:
                continue
            seen.add(token)
            terms.append(token)
    return terms


def read_skill_source(skill_path: Path) -> tuple[dict[str, str], str]:
    if not skill_path.exists():
        return {}, ""
    return parse_frontmatter(skill_path.read_text(encoding="utf-8"))


def manifest_row_to_record(row: dict[str, object]) -> SkillRecord:
    skill_path = Path(str(row.get("source_path", ""))).expanduser()
    metadata, body = read_skill_source(skill_path)
    title = extract_title(body) or str(row.get("name", "")) or metadata.get("name") or metadata.get("id", "")
    description_parts = [
        str(row.get("description", "")),
        metadata.get("description", ""),
        metadata.get("summary", ""),
        metadata.get("when", ""),
        metadata.get("when_to_use", ""),
        *find_search_trigger_lines(body),
    ]
    description_raw = normalize_whitespace(" | ".join(part for part in description_parts if part))
    description_brief = next(
        (
            normalize_whitespace(part)
            for part in [
                str(row.get("description", "")),
                metadata.get("description", ""),
                metadata.get("summary", ""),
            ]
            if normalize_whitespace(part)
        ),
        "",
    )
    trigger_phrases = split_trigger_phrases(description_parts)
    trigger_terms = extract_terms(trigger_phrases)
    skill_name = str(row.get("name", "")) or metadata.get("name") or metadata.get("id", "") or skill_path.parent.name
    source_group = str(row.get("source", "")) or LOCAL_SOURCE_GROUP
    return SkillRecord(
        skill_name=skill_name,
        skill_slug=skill_name,
        source_group=source_group,
        path=str(skill_path),
        title=title or skill_name,
        description_raw=description_raw,
        description_brief=description_brief,
        trigger_phrases_raw="; ".join(trigger_phrases),
        trigger_terms_extracted=", ".join(trigger_terms),
        trigger_count=len(trigger_terms),
    )


def iter_local_skill_paths(repo_root: Path) -> Iterable[Path]:
    for path in sorted(repo_root.rglob("SKILL.md")):
        parts = set(path.relative_to(repo_root).parts)
        if {"_archive", "_ctx", "docs"} & parts:
            continue
        yield path


def local_skill_to_record(skill_path: Path) -> SkillRecord:
    metadata, body = read_skill_source(skill_path)
    skill_name = metadata.get("name") or metadata.get("id") or skill_path.parent.name
    title = extract_title(body) or skill_name
    description_parts = [
        metadata.get("description", ""),
        metadata.get("summary", ""),
        metadata.get("when", ""),
        metadata.get("when_to_use", ""),
        *find_search_trigger_lines(body),
    ]
    description_raw = normalize_whitespace(" | ".join(part for part in description_parts if part))
    description_brief = next(
        (normalize_whitespace(part) for part in description_parts if normalize_whitespace(part)),
        "",
    )
    trigger_phrases = split_trigger_phrases(description_parts)
    trigger_terms = extract_terms(trigger_phrases)
    return SkillRecord(
        skill_name=skill_name,
        skill_slug=skill_name,
        source_group=LOCAL_SOURCE_GROUP,
        path=str(skill_path),
        title=title or skill_name,
        description_raw=description_raw,
        description_brief=description_brief,
        trigger_phrases_raw="; ".join(trigger_phrases),
        trigger_terms_extracted=", ".join(trigger_terms),
        trigger_count=len(trigger_terms),
    )


def load_manifest_rows(segment_root: Path) -> list[dict[str, object]]:
    payload = json.loads((segment_root / "_ctx" / "skills_manifest.json").read_text(encoding="utf-8"))
    return list(payload.get("skills", []))


def build_records(
    *,
    segment_root: Path = SKILLS_HUB_SEGMENT,
    repo_root: Path = ROOT,
) -> tuple[list[SkillRecord], ExportSummary]:
    manifest_rows = load_manifest_rows(segment_root)
    records_by_name: dict[str, SkillRecord] = {}

    for row in manifest_rows:
        record = manifest_row_to_record(row)
        records_by_name[record.skill_name] = record

    local_fallback_rows = 0
    for skill_path in iter_local_skill_paths(repo_root):
        record = local_skill_to_record(skill_path)
        if record.skill_name in records_by_name:
            continue
        records_by_name[record.skill_name] = record
        local_fallback_rows += 1

    records = sorted(records_by_name.values(), key=lambda record: record.skill_name)
    summary = ExportSummary(
        exported=len(records),
        manifest_rows=len(manifest_rows),
        local_fallback_rows=local_fallback_rows,
    )
    return records, summary


def write_catalog(records: list[SkillRecord], destination: Path = OUTPUT_PATH) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for record in records:
            writer.writerow(asdict(record))


def main() -> int:
    records, summary = build_records()
    write_catalog(records)
    print(
        f"exported={summary.exported} manifest_rows={summary.manifest_rows} "
        f"local_fallback_rows={summary.local_fallback_rows} output={OUTPUT_PATH}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
