# Human review before presenting evaluation results

The human-review line in `RESULTS.md` belongs **after the evaluation run and before the results go into the hackathon deck, demo narration, or public README**. The reviewer checks the test setup and examples; they do not need to approve every routine code change. A developer must not fill in this line on behalf of a reviewer.

## Reviewer checklist

- [ ] Confirm these are fictional, synthetic profiles and not the event's official personas.
- [ ] Review each `expectedLevel` against the profile's prior knowledge and answer signals. Change labels only with a written reason; keep mismatches in the report.
- [ ] Inspect predicted level and path for at least the two mismatch cases and two correctly classified cases.
- [ ] Check that path concepts fit the person's chosen focus and role, and that the ordering does not assume knowledge the persona lacks.
- [ ] Review lesson/practice examples for factual accuracy, respectful assumptions, and age-appropriate content before using generated examples in a public demo.
- [ ] Confirm the result states whether the run used deterministic fallback or live model calls, includes failures, and avoids claiming learning gains from score movement alone.

## Sign-off

Reviewer name: ______________________________

Role / relevant experience: ______________________________

Cases and artifacts reviewed: ______________________________

Decision: [ ] Approved for presentation  [ ] Needs changes

Notes / required changes: ______________________________

Date: ____________________

After the reviewer signs, copy their name, role, decision, and date into the human-review section of `RESULTS.md`. Keep the signed checklist with the submission materials.
