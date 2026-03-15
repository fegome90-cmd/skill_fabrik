from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

from export_skills_catalog import CSV_COLUMNS, OUTPUT_DIR, OUTPUT_PATH


ENRICHED_PATH = OUTPUT_DIR / "skills_catalog_enriched.csv"
REPORT_PATH = Path(__file__).resolve().parents[1] / "docs" / "reports" / "skills_trigger_collision_report.md"
ENRICHED_COLUMNS = [
    *CSV_COLUMNS,
    "collision_terms",
    "collision_count",
]
STOPWORDS = {
    "a",
    "al",
    "an",
    "and",
    "asks",
    "as",
    "at",
    "before",
    "based",
    "by",
    "code",
    "con",
    "de",
    "del",
    "do",
    "el",
    "en",
    "for",
    "in",
    "la",
    "las",
    "los",
    "or",
    "para",
    "skill",
    "skills",
    "the",
    "this",
    "to",
    "un",
    "una",
    "use",
    "user",
    "when",
    "work",
    "with",
    "y",
}


def load_rows(path: Path = OUTPUT_PATH) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def extract_terms(raw_terms: str) -> list[str]:
    return [term.strip() for term in raw_terms.split(",") if term.strip()]


def build_term_index(rows: list[dict[str, str]]) -> dict[str, set[str]]:
    index: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        for term in extract_terms(row.get("trigger_terms_extracted", "")):
            if term in STOPWORDS:
                continue
            index[term].add(row["skill_name"])
    return index


def enrich_rows(rows: list[dict[str, str]]) -> tuple[list[dict[str, str]], dict[str, set[str]]]:
    term_index = build_term_index(rows)
    enriched: list[dict[str, str]] = []
    for row in rows:
        collision_terms = sorted(
            term
            for term in extract_terms(row.get("trigger_terms_extracted", ""))
            if len(term_index[term]) > 1
        )
        enriched.append(
            {
                **row,
                "collision_terms": ", ".join(collision_terms),
                "collision_count": str(len(collision_terms)),
            }
        )
    return enriched, term_index


def write_csv(rows: list[dict[str, str]], destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=ENRICHED_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def write_report(rows: list[dict[str, str]], term_index: dict[str, set[str]], destination: Path) -> None:
    collision_items = sorted(
        ((term, sorted(skills)) for term, skills in term_index.items() if len(skills) > 1),
        key=lambda item: (-len(item[1]), item[0]),
    )
    top_rows = collision_items[:25]
    lines = [
        "# Skills Trigger Collision Report",
        "",
        f"- Total skills analyzed: {len(rows)}",
        f"- Unique trigger terms: {len(term_index)}",
        f"- Terms with collisions: {len(collision_items)}",
        "",
        "## Top Trigger Collisions",
        "",
        "| term | skills | count |",
        "| --- | --- | --- |",
    ]
    for term, skills in top_rows:
        lines.append(f"| `{term}` | {', '.join(skills)} | {len(skills)} |")
    if not top_rows:
        lines.append("| _none_ | _none_ | 0 |")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    rows = load_rows()
    enriched_rows, term_index = enrich_rows(rows)
    write_csv(enriched_rows, ENRICHED_PATH)
    write_report(enriched_rows, term_index, REPORT_PATH)
    print(
        f"enriched={len(enriched_rows)} report_terms={len(term_index)} "
        f"output={ENRICHED_PATH} report={REPORT_PATH}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
