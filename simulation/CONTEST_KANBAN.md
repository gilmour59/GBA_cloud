# Classroom Data Engineering Contest — Kanban

This board tracks the **standalone browser contest**, separate from the [presentation and Databricks notebook Kanban](../KANBAN.md). See the [roadmap](CONTEST_ROADMAP.md) for delivery order, decisions, and release gates. Status reflects repository evidence as of 2026-10-14; a plan is not a working feature.

**Class format:** synthetic Rice instructor demo (5 minutes maximum) → synthetic Cacao contest (15 minutes) → results and ₱50 GCash winner (5 minutes). There is no guided-practice phase. The browser experience is Databricks-inspired; it does not depend on a Databricks account.

Move cards through **Backlog → To Do → In Progress → Done**. Each card needs an implementation link and evidence against its acceptance criteria before moving to Done. Priority: P0 = required for a fair classroom run; P1 = important usability and resilience; P2 = optional polish.

## Done

| ID | Card | Priority | Acceptance evidence |
| --- | --- | --- | --- |
| C-00 | Define a separate contest Kanban and roadmap | P0 | These documents state scope, dependencies, classroom timing, and release gates; the root `KANBAN.md` remains untouched. |

## In Progress

No contest application work is evidenced in this repository yet.

## To Do

| ID | Card | Priority | Depends on | Acceptance criteria |
| --- | --- | --- | --- | --- |
| C-01 | Freeze learning rules and answer-key contract | P0 | C-00 | Specify row validity, duplicate precedence, quarantine reason, Gold grouping, production totals, and yield = total production / total harvested area; document treatment of zero area and rounding. |
| C-02 | Generate reproducible synthetic Rice and Cacao fixtures | P0 | C-01 | Fixed seeds produce separate Rice demo (~100 rows) and Cacao contest (~150 rows), with fictional places and intentional nulls, duplicates, negative or nonnumeric production, inconsistent names, and missing or invalid area. No real-person or official production data. |
| C-03 | Build private answer keys and dataset tests | P0 | C-02 | Independent expected Silver rows, quarantine counts/reasons, Gold totals, and dashboard values are checked by automated tests; Cacao key is absent from public browser assets. |
| C-04 | Build the beginner-friendly challenge shell | P0 | C-01 | Each stage names its goal in plain language, shows Bronze → Silver → Gold → Dashboard progress, supplies short editable SQL with hints, and allows reset/undo without losing the raw data. |
| C-05 | Execute SQL in the browser | P0 | C-02, C-04 | A real browser SQL engine executes the participant's edited statements against their own isolated dataset, returns rows or actionable syntax errors, and supports every documented lesson query. A click does not substitute a hard-coded answer. |
| C-06 | Wire participant pipeline and dashboard | P0 | C-03, C-05 | Silver, quarantine, and Gold derive from the participant's executed SQL. Charts read that Gold output and visibly change when a valid but wrong query changes the result. |
| C-07 | Separate Run Query from Verify Accuracy | P0 | C-03, C-06 | Run Query reports execution success/error only. Verify Accuracy compares resulting Silver, quarantine, Gold, and dashboard facts with the answer contract and explains failed categories without revealing the Cacao key. A successful query can score below 100%. |
| C-08 | Add authoritative contest verification | P0 | C-07 | Server replays submitted work against a canonical dataset with a compatible SQL dialect, stores score and server receipt time, rejects tampered client scores/timestamps, and never sends the private key to the browser. |
| C-09 | Add contest clock, results, and winner selection | P0 | C-08 | Server enforces the 15-minute window. The first server-verified 100% submission wins; if none reaches 100%, highest verified score wins. Publish a deterministic tie rule before class. Results reveal shows evidence, not just a client-reported badge. |
| C-10 | Prepare the 5-minute Rice instructor path | P0 | C-06, C-07 | Rehearsable cues cover Bronze, Silver/quarantine, Gold, a plausible wrong dashboard, Verify Accuracy, correction, and final dashboard in at most 5 minutes; no Cacao answer is shown. |
| C-11 | Publish participant rules and paste handling | P1 | C-04 | Rules plainly allow AI help and require manual entry. Paste is blocked in challenge SQL editors (including keyboard/menu/drop events where practical); other page controls remain usable. State that browser blocking is a deterrent, not proof of compliance. |
| C-12 | Classroom QA and recovery | P0 | C-08, C-09, C-10, C-11 | Test novice path, wrong-but-valid SQL, duplicate inflation, refresh/rejoin, two concurrent participants, timer expiry, tie/fallback winner, projector/mobile layout, and slow/offline failure. Complete a full 25-minute rehearsal with a backup reveal. |

## Backlog

| ID | Card | Priority | Depends on | Acceptance criteria |
| --- | --- | --- | --- | --- |
| C-13 | Optional leaderboard polish | P2 | C-09 | Shows only approved public names and verified score/time; never exposes answer keys or private contact details. |
| C-14 | Optional advanced SQL hints | P2 | C-07 | Hints explain concepts without inserting the final Cacao query or giving away the answer key. |

## Working rule

The first usable milestone is **load synthetic data → edit and run SQL → build Silver/Gold → see a dashboard → verify accuracy**. Competition ranking follows only after that path works. Record code paths, test results, and classroom rehearsal notes next to each card as implementation proceeds.
