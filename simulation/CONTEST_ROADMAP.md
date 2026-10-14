# Classroom Data Engineering Contest — Roadmap

This roadmap is for a **new Databricks-inspired browser simulation**, separate from the existing [Databricks Free Edition notebook](README.md) and [project Kanban](../KANBAN.md). Track status in the [contest Kanban](CONTEST_KANBAN.md). A working [contest app prototype](../contest/README.md) now covers the MVP path; classroom release gates remain open.

## Classroom experience

| Time | Activity | Visible result |
| --- | --- | --- |
| 0:00–5:00, maximum | Instructor uses fully synthetic Rice data to show Bronze → Silver/quarantine → Gold → Dashboard, intentionally lets one valid query produce a wrong chart, then verifies and fixes it. | Students see why “query ran” differs from “answer is correct.” |
| 5:00–20:00 | Students work on a different, fully synthetic Cacao dataset with guided, editable SQL. AI explanations and suggestions are allowed; students manually enter their changes without copy-paste. | Each student's actual SQL drives tables and charts. |
| 20:00–25:00 | Freeze entries; show verified scores, explain common mistakes, reveal the winner and ₱50 GCash prize. | Instructor can cite server-recorded verification, not a browser screenshot. |

There is **no separate guided-practice phase**. Keep the Rice demo short enough to protect the full 15-minute contest window.

## Product contract

1. **Data:** Use deterministic synthetic generators with distinct Rice and Cacao fixtures. Store the seed, schema, rules, and test cases; keep the Cacao expected outputs private to the verifier. Plant errors that teach missing locations, duplicate IDs, negative/nonnumeric production, inconsistent commodity labels, and bad cultivated or harvested area. Define whether invalid rows are quarantined and how duplicate winners are chosen before generating keys.
2. **Participant workflow:** Show small Bronze previews and editable starter SQL for Silver validation/deduplication, quarantine, and Gold aggregation. Give concise instructions, example syntax, run feedback, stage progress, and a reset option. Avoid requiring a blank-page SQL solution from beginners.
3. **Execution:** Choose and pin a real browser SQL engine (DuckDB-Wasm is a candidate), then test its SQL dialect and supported statements against the lesson. Each participant has an isolated working state. “Run Query” executes their edited SQL and reports errors/results; it never awards correctness merely for running.
4. **Analytics:** Derive the dashboard from that participant's current Gold table. Display production, harvested area, and area-weighted yield (`SUM(production_mt) / SUM(harvested_area_ha)` for valid positive area), with the chosen grouping and rounding specified in the answer contract. A believable but wrong Gold result must yield a believable but wrong chart.
5. **Verification:** “Verify Accuracy” checks required Silver membership, quarantine, Gold, and dashboard values. During practice/demo, feedback can explain errors. During Cacao competition, feedback identifies categories without sending the hidden answer key or a reconstructable full expected result to the client.
6. **Authority:** A service accepts SQL/submission state, re-executes it on canonical Cacao data using the same supported dialect, and stores an immutable verification result with server time. Treat client-side SQL, dashboard, score, and timer as untrusted. Limit permitted statements and execution resources so one entry cannot affect another or the verifier. Decide identity/rejoin handling and publish scoring weights and tie rules before class.
7. **Contest rule:** The first server-verified 100% score wins. If no one reaches 100%, highest server-verified score wins; use the published tie rule for equal scores. Only a verified in-window submission qualifies. AI use is allowed; SQL must be entered manually. Editor paste prevention is a classroom reminder and deterrent, not a reliable cheating detector.

## Build sequence and exit gates

**Current status (2026-10-14):** Stages 1–3 have a local implementation and automated pipeline checks. Stage 4 has working server replay, clock, and winner selection, with concurrency/expiry rehearsal still pending. Stage 5 still needs a full 25-minute classroom rehearsal.

| Stage | Work | Exit gate | Kanban cards |
| --- | --- | --- | --- |
| 1. Contract and setup | Pick app layout, SQL dialect, deployment/verification service, scoring categories, privacy-safe participant identity, and tie rule. | One written contract drives fixtures, browser engine, verifier, and classroom rules. | C-01 |
| 2. Synthetic data and oracle | Generate Rice/Cacao data and independent expected outputs. | Same seed yields the same records and tested answer keys; Cacao key is server-only. | C-02, C-03 |
| 3. Working learning path | Build guided editor, browser SQL execution, Silver/quarantine/Gold pipeline, dashboard, and separate Run/Verify actions. | A novice can finish one complete path; a syntactically valid wrong query changes the chart and fails verification. **This is the MVP.** | C-04–C-07 |
| 4. Fair contest | Add server replay, authoritative timing/scoring, rejoin handling, and result selection. | Client score/timer edits cannot win; simultaneous entries and fallback/ties produce deterministic results. | C-08, C-09 |
| 5. Classroom delivery | Add Rice demo cues, participant rules, paste deterrents, accessibility pass, and backup. | Full 5 + 15 + 5 minute rehearsal passes on classroom devices and network. | C-10–C-12 |
| 6. Optional polish | Improve leaderboard and hints only after required gates pass. | No answer leakage or regression in beginner flow. | C-13, C-14 |

## Verification checklist

- Unit-check fixture invariants, duplicate policy, quarantine reasons, Gold arithmetic, zero-area treatment, and rounding against the frozen answer contract.
- Exercise browser execution and server replay with the same submitted SQL to catch dialect differences.
- Prove “Run Query succeeds, Verify Accuracy fails” with a duplicated Cacao record that inflates production.
- Confirm dashboard values come from the participant's current Gold result, including after an edit and rerun.
- Attempt to alter browser clock, score, or cached result; server winner selection must remain unchanged.
- Check refresh/rejoin, simultaneous final submissions, expiry, highest-score fallback, and tie handling.
- Rehearse instructor demo with a stopwatch; reserve the full 5-minute reveal and prepare an offline screenshot/video backup if the live service fails.

## Scope boundary

The existing `simulation/agri_demo.py`, 437-row Databricks upload instructions, executed lab log, and speaking script document a separate notebook exercise. The contest can reuse the teaching concept, but its synthetic fixtures, browser engine, private verifier, and timing need their own implementation and proof. A classroom-sized dataset demonstrates pipeline ideas; it is not a Big Data scale benchmark.
