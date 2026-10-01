"""Run the synthetic 12-persona onboarding/path evaluation.

Default mode intentionally forces provider failure to measure the deterministic
fallback without API spend or network dependence. Use --live to call the configured
LLM provider; label and review those outputs before using them as evidence.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from statistics import mean
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend import workflows
from backend.curriculum import CONCEPTS, FOCUS_TRACK, ROLE_TRACK, get_track_concepts

PERSONAS = ROOT / "eval" / "personas.json"


def run(mode: str) -> dict:
    personas = json.loads(PERSONAS.read_text(encoding="utf-8"))
    if mode == "fallback":
        def unavailable(*_args, **_kwargs):
            raise RuntimeError("evaluation deliberately uses deterministic fallback")
        workflows.call_llm_for_json = unavailable
    else:
        # Bound retries/time so a broken provider connection fails as a useful
        # evaluation trace instead of hanging the whole persona run.
        from openai import OpenAI
        from agent import llm_client
        if not llm_client.API_KEY:
            return {"mode": mode, "status": "skipped", "count": 0, "providerError": "LLM_API_KEY is not configured", "records": []}
        llm_client._client = lambda: OpenAI(base_url=llm_client.BASE_URL, api_key=llm_client.API_KEY, timeout=12, max_retries=0)
        try:
            llm_client.call_llm_for_json("Return a JSON readiness status.", "Return {\"ready\": true}.")
        except Exception as exc:
            return {"mode": mode, "status": "provider_unavailable", "count": 0, "personasAvailable": len(personas), "providerError": type(exc).__name__, "trace": "Provider preflight failed; no persona predictions were attempted.", "records": []}
    records = []
    for persona in personas:
        learner = {key: persona[key] for key in ("role", "focus", "answers")}
        learner["userVariant"] = persona["id"].replace("persona_", "") * 8
        try:
            result = workflows.complete("onboarding", learner)
            path = result.get("path", [])
            ids = [node.get("id") for node in path]
            invalid_ids = [concept_id for concept_id in ids if concept_id not in CONCEPTS]
            allowed_tracks = list(dict.fromkeys([FOCUS_TRACK.get(persona["focus"], "foundations"), ROLE_TRACK.get(persona["role"], "foundations")]))
            if "foundations" not in allowed_tracks and result.get("evaluatedLevel") == "beginner":
                allowed_tracks.append("foundations")
            allowed_ids = {item["id"] for track in allowed_tracks for item in get_track_concepts(track)}
            out_of_scope = [concept_id for concept_id in ids if concept_id not in allowed_ids]
            duplicates = len(ids) - len(set(ids))
            first = next((node for node in path if node.get("status") == "current"), None)
            predicted = result.get("evaluatedLevel")
            records.append({
                "personaId": persona["id"], "label": persona["label"], "expectedLevel": persona["expectedLevel"],
                "claimedLevel": persona["claimedLevel"], "predictedLevel": predicted,
                "predictionCorrect": predicted == persona["expectedLevel"],
                "naiveClaimCorrect": persona["claimedLevel"] == persona["expectedLevel"],
                "focus": persona["focus"], "role": persona["role"], "pathLength": len(path),
                "pathIds": ids, "invalidIds": invalid_ids, "outOfScopeIds": out_of_scope, "duplicateCount": duplicates,
                "validPath": 4 <= len(path) <= 10 and not invalid_ids and not out_of_scope and duplicates == 0 and first is not None,
                "firstStep": first.get("title") if first else None,
                "fallbackUsed": mode == "fallback",
                "providerTrace": "simulated provider failure; fallback assessment and planner exercised" if mode == "fallback" else "live provider response; inspect detailed output",
                "trace": "assessment and path completed" if path else "empty path",
            })
        except Exception as exc:
            records.append({"personaId": persona["id"], "expectedLevel": persona["expectedLevel"], "trace": f"failure: {type(exc).__name__}: {exc}", "validPath": False, "predictionCorrect": False, "naiveClaimCorrect": persona["claimedLevel"] == persona["expectedLevel"]})
    exact = sum(row["predictionCorrect"] for row in records)
    baseline = sum(row["naiveClaimCorrect"] for row in records)
    practice_check = workflows.complete("practice", {"prompt": "Explain why held-out data matters.", "activity": {"type": "explain"}, "answer": "It helps check generalization.", "level": "developing", "focus": "machineLearning"})
    return {
        "mode": mode, "status": "completed", "dataset": "synthetic personas authored for EduAgent; rubric labels are illustrative, not human-validated ground truth",
        "count": len(records), "predictionCorrect": exact, "predictionAccuracy": round(exact / max(1, len(records)), 4),
        "simulatedProviderFailureCount": len(personas) * 2 + 1 if mode == "fallback" else 0,
        "naiveSelfReportCorrect": baseline, "naiveSelfReportAccuracy": round(baseline / max(1, len(records)), 4),
        "validPaths": sum(row.get("validPath", False) for row in records),
        "uniquePathCount": len({tuple(row.get("pathIds", [])) for row in records}),
        "meanPathLength": round(mean([row.get("pathLength", 0) for row in records]), 2) if records else 0,
        "graderFallbackCheck": {"scored": practice_check.get("scored", False), "scorePercent": practice_check.get("scorePercent"), "excludedFromAnalytics": not practice_check.get("scored", False)},
        "records": records,
        "limitations": ["12 synthetic cases are too small and not independently labeled.", "Fallback-mode results do not measure live LLM quality.", "Repeated runs may differ in the user-specific path variant; live LLM outputs may also be nondeterministic."],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("fallback", "live"), default="fallback")
    parser.add_argument("--output", default="eval/latest-results.json")
    args = parser.parse_args()
    report = run(args.mode)
    destination = ROOT / args.output
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({key: report[key] for key in report if key in {"mode", "status", "count", "predictionCorrect", "predictionAccuracy", "naiveSelfReportCorrect", "naiveSelfReportAccuracy", "validPaths", "uniquePathCount", "meanPathLength", "providerError", "trace"}}, indent=2))
    print(f"Detailed per-persona report: {destination.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
