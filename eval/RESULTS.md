# Current synthetic evaluation run

**Run date:** 2026-10-01

**Mode:** deterministic fallback; provider calls deliberately forced to fail

**Context:** EduAgent is intended to help learners with different roles, AI interests, and starting knowledge form an ordered learning path. This run checks whether the onboarding fallback classifies authored synthetic diagnostic cases and returns structurally valid, focus-related paths. It does not test teaching outcomes or real learners.

| Measure | Result |
|---|---:|
| Persona cases | 12 |
| Level-label agreement with authored rubric | 10/12 (83.3%) |
| Naive self-reported level agreement | 8/12 (66.7%) |
| Valid paths | 12/12 |
| Unique generated paths | 12 |
| Mean path length | 7.33 concepts |

Two level mismatches were retained: `persona_03` (AI-tool user with a gap in model-building) and `persona_08` (transformer familiarity with limited deployment knowledge). This is useful evidence that three binary diagnostic signals may not separate adjacent levels reliably. The detailed run, including every path and the simulated provider-failure trace, is in [`latest-results.json`](latest-results.json).

**Baseline:** the learner's declared level, scored against the same authored labels (8/12). **Result:** fallback diagnostic level (10/12). This is a small synthetic comparison, not a statistically meaningful gain claim. The persona labels were written by the project team and have not been independently reviewed; the set is not the hackathon's official persona list. The test does not demonstrate generalization, fairness, or improved learner achievement.

**Failure trace:** for this fallback-mode run, the harness replaced the LLM call with a deliberate provider-unavailable exception. LangGraph continued through deterministic assessment and curriculum planning for all 12 cases. No path-generation exceptions occurred; the two classification mismatches above remain visible rather than being dropped. A separate simulated grader-outage check returned `scored: false`, and the result is excluded from learner score analytics.

**Human review:** project owner review: ____________________  Date: __________

**AI use disclosure:** the evaluation harness and personas were authored with AI-assisted development; the persona cases and labels require human review before external claims.

Re-run with `python scripts/evaluate_personas.py --mode fallback` after changes. See [`README.md`](README.md) for the dataset and interpretation limits. For a live model run, use `--mode live` and publish its separate result file and full traces; never mix it with this fallback report.

## Live-model evaluation attempt

A live provider request was attempted on 2026-10-01. The configured key was present, provider DNS resolution and TCP port 443 connectivity succeeded, but the bounded API preflight returned `APIConnectionError`. Therefore no live-model persona score is reported. The failed preflight trace is saved in [`live-results.json`](live-results.json). The 10/12 result above is only the deterministic fallback evaluation. Retry `--mode live` after the provider connection works, then have a human reviewer complete [`HUMAN_REVIEW.md`](HUMAN_REVIEW.md) before presenting either result.
