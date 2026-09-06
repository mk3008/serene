"""Score pre-exposure runs from the controller's immutable JSONL event logs.

This is deliberately descriptive.  Discovery coordinates are compared with the
independent end-to-end gold; finding mechanism correctness remains for separate
adjudication.
"""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path
from typing import Any, Iterable

P = Path(__file__).resolve().parent
E2E = P.parent / "end-to-end"


def key(row: Any) -> tuple[Any, Any, Any] | None:
    if not isinstance(row, dict):
        return None
    file, line, column = row.get("file"), row.get("line"), row.get("column")
    if not isinstance(file, str) or type(line) is not int or type(column) is not int:
        return None
    return file, line, column


def source_key(row: Any) -> tuple[Any, Any] | None:
    if not isinstance(row, dict) or not isinstance(row.get("file"), str) or type(row.get("line")) is not int:
        return None
    return row["file"], row["line"]


def successful(events: Iterable[dict[str, Any]], op: str | None = None) -> list[dict[str, Any]]:
    return [e for e in events if (op is None or e.get("op") == op) and e.get("response", {}).get("ok")]


def body_lines(record: dict[str, Any]) -> set[tuple[str, int]]:
    return {(record["file"], line) for line in range(record["functionBodyStartLine"], record["functionBodyEndLine"] + 1)}


def body_seen(record: dict[str, Any], events: Iterable[dict[str, Any]]) -> bool:
    lines = {source_key(row) for event in events for row in event.get("source_lines", [])}
    return bool(lines & body_lines(record))


def body_full(record: dict[str, Any], events: Iterable[dict[str, Any]]) -> bool:
    lines = {source_key(row) for event in events for row in event.get("source_lines", [])}
    return body_lines(record) <= lines


def identity_ledger(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{"input": i, "outputs": [i], "valid": True} for i in range(len(rows))]


def validate_ledger(primitive: list[dict[str, Any]], evidence: list[dict[str, Any]], arm: str) -> dict[str, Any]:
    """Check every primitive response row has a valid output in its *file* batch.

    filter.mjs numbers correspondence inputs locally to each incoming per-file
    ``rows`` array. Search matches are source rows, never executable candidates.
    """
    if arm != "serene":
        ledger = identity_ledger(primitive)
        return {"primitive_rows": len(primitive), "filter_batches": 0, "entries": ledger,
                "all_inputs_represented": True, "all_output_indexes_valid": True,
                "match_row_loss": 0, "invalid_entries": []}
    by_file: dict[str, list[dict[str, Any]]] = collections.defaultdict(list)
    for row in primitive:
        if isinstance(row, dict) and isinstance(row.get("file"), str):
            by_file[row["file"]].append(row)
    entries: list[dict[str, Any]] = []
    invalid: list[dict[str, Any]] = []
    represented: dict[str, set[int]] = collections.defaultdict(set)
    assigned_files: list[str] = []
    for batch_index, batch in enumerate(evidence):
        rows = batch.get("rows", []) if isinstance(batch, dict) else []
        correspondence = batch.get("correspondence", []) if isinstance(batch, dict) else []
        batch_files = {row.get("file") for row in rows if isinstance(row, dict) and isinstance(row.get("file"), str)}
        batch_files.update(mask.get("file") for mask in batch.get("masks", []) if isinstance(mask, dict) and isinstance(mask.get("file"), str))
        batch_file = next(iter(batch_files)) if len(batch_files) == 1 else None
        if batch_file is not None:
            assigned_files.append(batch_file)
        incoming = by_file.get(batch_file, []) if batch_file is not None else []
        for mapping in correspondence:
            input_index = mapping.get("input") if isinstance(mapping, dict) else None
            outputs = mapping.get("outputs") if isinstance(mapping, dict) else None
            valid = (batch_file is not None and type(input_index) is int and 0 <= input_index < len(incoming)
                     and isinstance(outputs, list) and bool(outputs)
                     and all(type(o) is int and 0 <= o < len(rows) for o in outputs))
            entry = {"batch": batch_index, "file": batch_file, "input": input_index,
                     "outputs": outputs, "valid": valid}
            entries.append(entry)
            if valid:
                represented[batch_file].add(input_index)
            else:
                invalid.append(entry)
    missing = [{"file": file, "input": index} for file, rows in by_file.items()
               for index in range(len(rows)) if index not in represented[file]]
    return {"primitive_rows": len(primitive), "filter_batches": len(evidence), "entries": entries,
            "all_inputs_represented": not missing, "all_output_indexes_valid": not invalid,
            "match_row_loss": len(missing), "missing_inputs": missing,
            "unexpected_or_ambiguous_batch_files": [f for f in assigned_files if assigned_files.count(f) > 1],
            "invalid_entries": invalid}


def marker_deliveries(events: Iterable[dict[str, Any]], gold_by_key: dict[tuple[Any, Any, Any], dict[str, Any]]) -> tuple[set[tuple[Any, Any, Any]], list[dict[str, Any]]]:
    delivered: set[tuple[Any, Any, Any]] = set()
    invalid: list[dict[str, Any]] = []
    for event in events:
        primitive = {source_key(row) for row in event.get("primitive_rows", [])}
        for batch in event.get("filter_evidence", []):
            for row in batch.get("rows", []) if isinstance(batch, dict) else []:
                if not isinstance(row, dict) or "ordinary" not in row:
                    continue
                for site in row.get("sites", []):
                    site_key = ((row.get("file"), site.get("line"), site.get("column"))
                                if isinstance(site, dict) and isinstance(row.get("file"), str)
                                and type(site.get("line")) is int and type(site.get("column")) is int else None)
                    gold = gold_by_key.get(site_key)
                    valid = bool(gold and gold["classification"] == "ordinary" and (gold["file"], gold["line"]) in primitive)
                    item = {"sequence": event.get("sequence"), "marker": row.get("ordinary"), "site": site, "valid": valid}
                    if valid:
                        delivered.add(site_key)
                    else:
                        invalid.append(item)
    return delivered, invalid


def stage_summary(events: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    stages: dict[str, dict[str, Any]] = {}
    for stage in ("discovery", "review"):
        es = [e for e in events if e.get("phase") == stage]
        stages[stage] = {
            "calls": len(es), "read_calls": sum(e.get("op") == "read" for e in es),
            "search_calls": sum(e.get("op") == "search" for e in es),
            "response_bytes": sum(e.get("response_bytes", 0) for e in es),
            "request_bytes": sum(e.get("request_bytes", 0) for e in es),
            "source_text_bytes": sum(e.get("source_text_bytes", 0) for e in es),
            "source_line_deliveries": sum(len(e.get("source_lines", [])) for e in es),
            "unique_source_lines": len({source_key(x) for e in es for x in e.get("source_lines", [])}),
        }
    return stages


def score(run: str, config: dict[str, Any]) -> dict[str, Any]:
    c = config[run]
    events = [json.loads(line) for line in (P / "results" / f"{run}.jsonl").read_text().splitlines() if line.strip()]
    gold_records = json.loads((E2E / "gold" / f"{c['task']}.json").read_text())["records"]
    gold = [{**g, "file": g["file"].split("/", 1)[1]} for g in gold_records if g["variant"] == c["arm"]]
    gold_by_key = {key(g): g for g in gold}
    expected = set(gold_by_key)

    discovery = next(iter(successful(events, "discover")), None)
    candidates = discovery.get("request", {}).get("candidates", []) if discovery else []
    submitted_keys = [key(candidate) for candidate in candidates]
    valid_submitted = {k for k in submitted_keys if k is not None}
    dispositions_event = next(iter(successful(events, "finish")), None)
    dispositions = dispositions_event.get("request", {}).get("dispositions", []) if dispositions_event else []
    disposition_keys = [key(disposition) for disposition in dispositions]
    submitted_count = collections.Counter(submitted_keys)
    disposition_count = collections.Counter(disposition_keys)

    ordinary = [g for g in gold if g["classification"] == "ordinary"]
    nonordinary = [g for g in gold if g["classification"] != "ordinary"]
    dangers = [g for g in gold if g.get("expectedVulnerability")]
    markers, invalid_markers = marker_deliveries(events, gold_by_key)
    skip_keys = {key(d) for d in dispositions if isinstance(d, dict) and d.get("resolution") == "skip-ordinary"}
    actually_skipped = [g for g in ordinary if key(g) in markers and key(g) in skip_keys and not body_seen(g, events)]

    ledgers = [validate_ledger(e.get("primitive_rows", []), e.get("filter_evidence", []), c["arm"])
               for e in events if e.get("op") in ("read", "search") and e.get("response", {}).get("ok")]
    findings = successful(events, "finding")
    coordinate_findings = [e for e in findings if any(
        e.get("request", {}).get("file") == g["file"]
        and g["functionBodyStartLine"] <= e.get("request", {}).get("line", -1) <= g["functionBodyEndLine"]
        and e.get("request", {}).get("function") == g["function"] for g in dangers)]
    first_diagnosis = coordinate_findings[0] if coordinate_findings else None

    response_mismatches = []
    source_mismatches = []
    for e in events:
        actual_wire = json.dumps(e.get("response"), separators=(",", ":")) + "\n"
        # Controller uses default json separators; serialize exactly that wire format.
        actual_wire = json.dumps(e.get("response")) + "\n"
        if e.get("response_bytes") != len(actual_wire.encode()):
            response_mismatches.append(e.get("sequence"))
        actual_source_bytes = sum(len(row.get("text", "").encode()) for row in e.get("source_lines", []) if isinstance(row, dict) and isinstance(row.get("text"), str))
        if e.get("source_text_bytes") != actual_source_bytes:
            source_mismatches.append(e.get("sequence"))

    filter_events = [e for e in events if e.get("filter_evidence")]
    output = {
        "run": run, "task": c["task"], "arm": c["arm"], "finished": bool(dispositions_event),
        "gold_sites": len(gold), "discovered_records": len(candidates),
        "discovery_recall": len(valid_submitted & expected) / len(expected) if expected else None,
        "discovery_precision": len(valid_submitted & expected) / len(valid_submitted) if valid_submitted else None,
        "discovery_missing": [gold_by_key[k] for k in expected - valid_submitted],
        "discovery_extra": [list(k) for k in valid_submitted - expected],
        "candidate_invalid_coordinate_records": sum(k is None for k in submitted_keys),
        "candidate_duplicate_coordinate_records": sum(n - 1 for n in submitted_count.values() if n > 1),
        "dispositions_complete": bool(dispositions_event) and submitted_count == disposition_count,
        "disposition_missing": [list(k) if k else None for k in (submitted_count - disposition_count).elements()],
        "disposition_extra": [list(k) if k else None for k in (disposition_count - submitted_count).elements()],
        "ordinary_total": len(ordinary),
        "ordinary_body_exposed_any_stage": sum(body_seen(g, events) for g in ordinary),
        "ordinary_body_fully_exposed_any_stage": sum(body_full(g, events) for g in ordinary),
        "ordinary_positive_marker_sites_delivered": len(markers),
        "ordinary_invalid_marker_sites": invalid_markers,
        "ordinary_actually_skipped": len(actually_skipped),
        "ordinary_skipped_functions": [g["function"] for g in actually_skipped],
        "actionable_full_body_read_and_disposed": [g["function"] for g in nonordinary if g["classification"] != "unmatched" and body_full(g, events) and key(g) in disposition_count],
        "unmatched_full_body_read_and_disposed": [g["function"] for g in nonordinary if g["classification"] == "unmatched" and body_full(g, events) and key(g) in disposition_count],
        "nonordinary_not_full_body_read_or_not_disposed": [g["function"] for g in nonordinary if not (body_full(g, events) and key(g) in disposition_count)],
        "danger_coordinate_findings_preliminary": len(coordinate_findings),
        "danger_coordinate_finding_requests": [e["request"] for e in coordinate_findings],
        "first_preliminary_diagnosis_sequence": first_diagnosis.get("sequence") if first_diagnosis else None,
        "response_bytes_through_first_preliminary_diagnosis": sum(e.get("response_bytes", 0) for e in events if first_diagnosis and e.get("sequence", 0) <= first_diagnosis.get("sequence", 0)) if first_diagnosis else None,
        "finding_requests": [e["request"] for e in findings],
        "finding_mechanism_adjudication": "pending independent adjudication; coordinate matches are preliminary only",
        "correspondence": {
            "per_event": ledgers,
            "all_primitive_rows_represented": all(l["all_inputs_represented"] and l["all_output_indexes_valid"] for l in ledgers),
            "match_row_loss": sum(l["match_row_loss"] for l in ledgers),
            "note": "Primitive search match rows are source-response rows, not SQL execution candidates; discovery/gold measures final candidate loss.",
        },
        "total_calls": len(events), "total_response_bytes": sum(e.get("response_bytes", 0) for e in events),
        "total_request_bytes": sum(e.get("request_bytes", 0) for e in events),
        "total_source_text_bytes": sum(e.get("source_text_bytes", 0) for e in events),
        "stages": stage_summary(events),
        "filter_internal": {"events": len(filter_events), "input_bytes": sum(e.get("filter_internal_input_bytes", 0) for e in events),
                            "output_bytes": sum(e.get("filter_internal_output_bytes", 0) for e in events),
                            "seconds": sum(e.get("filter_internal_seconds", 0) for e in events),
                            "time_recorded": any("filter_internal_seconds" in e for e in events)},
        "wire_accounting": {"response_bytes_recomputed": not response_mismatches, "response_byte_mismatch_sequences": response_mismatches,
                            "source_text_bytes_recomputed": not source_mismatches, "source_text_byte_mismatch_sequences": source_mismatches},
        "errors": [{"sequence": e.get("sequence"), "op": e.get("op"), "error": e.get("response", {}).get("error")} for e in events if not e.get("response", {}).get("ok")],
        "wall_seconds": events[-1]["ended"] - events[0]["started"] if events else 0,
    }
    return output


def main() -> None:
    config = json.loads((P / "run-config.json").read_text())["runs"]
    runs = sys.argv[1:] or ["probe", "tr", "ts", "sr", "ss"]
    rows = [score(run, config) for run in runs]
    (P / "scores.json").write_text(json.dumps(rows, indent=2) + "\n")
    print(json.dumps(rows, indent=2))


if __name__ == "__main__":
    main()
