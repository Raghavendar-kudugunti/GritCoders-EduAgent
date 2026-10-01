# Persona evaluation

`personas.json` contains 12 fictional profiles authored for this project. These are not event-provided personas or real learner records. `expectedLevel` is a manually assigned test label based on the stated prior knowledge; it has not been independently reviewed by educators. Some cases deliberately challenge the three-question diagnostic (for example, a tool user with gaps and an experienced transformer learner whose deployment knowledge is limited).

Run the deterministic, offline path:

```powershell
.\.venv\Scripts\python.exe scripts\evaluate_personas.py --mode fallback
```

The runner forces the provider call to fail, then exercises the LangGraph fallback assessment and planner for every profile. It records label agreement, naive self-report agreement, valid path count, unique path count, and a per-persona trace in `latest-results.json` (generated output, do not treat as a checked-in claim until rerun against the current code).

For a configured LLM run:

```powershell
.\.venv\Scripts\python.exe scripts\evaluate_personas.py --mode live
```

Live mode first makes a bounded provider preflight; if it cannot connect, it records that failure and stops before persona calls. When available, live mode can incur provider usage. Its outputs are not production accuracy estimates. Review the detailed cases, keep failures, and report the dataset, run mode, date, denominator, and limitations. Do not combine fallback and live results. Before presenting either run, complete the human sign-off checklist in [`HUMAN_REVIEW.md`](HUMAN_REVIEW.md).

## Interpretation

This is a smoke/evaluation harness over a tiny synthetic set. It checks contract and path generation, not learning gains. The labels are not human-validated ground truth, and accuracy on 12 authored cases does not establish generalization. Learning analytics in the app are descriptive score trends from successfully graded practice; they do not establish that EduAgent caused improvement. Practice duration is estimated at five minutes per scored attempt.
