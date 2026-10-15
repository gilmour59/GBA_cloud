# Data Engineering Challenge

A standalone, Databricks-inspired classroom app for the suggested **5-minute Rice demo → Cacao contest → 5-minute reveal**. The presenter decides when to end the contest; the app imposes no contest time limit. All crop records and place names are synthetic. It does not require a Databricks account or use the separate 437-row notebook exercise.

## Run

Requires Node.js 20 or newer.

```sh
cd contest
npm ci
PRESENTER_PIN=choose-a-private-pin npm start
```

Open `http://127.0.0.1:3000/presenter` for the **presenter view**. Share `http://127.0.0.1:3000/` for the **student Cacao view**. For classmates on the same network, run with `HOST=0.0.0.0` and replace `127.0.0.1` in the student URL with the presenter computer's LAN address. Set `PORT` if needed. Keep the presenter PIN private. If `PRESENTER_PIN` is omitted, the server generates one and prints it in the terminal. The SQL engine is served from the installed package, so the app does not depend on a CDN during class.

**Online class:** Follow [Put the classroom contest online](DEPLOY_ONLINE.md) to deploy one Railway service with a persistent volume. The online deployment keeps its contest state, fixture seed, participants, scores, and generated presenter PIN across restarts. Set a private `PRESENTER_PIN` or retrieve the generated 12-digit PIN from private service logs before the live round.

## How to present

Use the private Google Docs presenter guide for the timed Rice script, the complete Rice and Cacao answers, and the demo-to-contest handoff. The answer key is intentionally kept out of this public repository and does not appear on the Presenter screen.

1. On the **presenter view**, open **Rice demo**. Click **Run Silver**, then **Run Gold**: the starter SQL executes and draws a plausible but incorrect dashboard. Click **Verify Accuracy** to show that execution is not correctness.
2. Click **Load Rice correction**, then run Silver and Gold again before verifying. The server should report 100%. Show the changed production chart and quarantined count.
3. In **Contest controls** near the top of the presenter page, start Cacao when you are ready. The Cacao tab lets you join as a contestant too; the separate student URL provides the same contest workspace without presenter controls. Classmates open the **student URL**, enter a unique display name, and join. They can click **Pin Bronze** for a floating, draggable reference table while editing. Their Silver SQL runs independently of Gold; rerun Silver after changing it, then run Gold and verify. Each stage has a separate **Check Silver** or **Check Gold** action that reports whether it is correct and shows category points. A successful Run only means the SQL executed. The stage checks do not submit a contest entry; only **Verify Accuracy** records an official score, and 100% completes the challenge. Their SQL runs in an isolated browser SQLite database. They may ask AI for help but must type changes into the editor.
4. Click **End contest & reveal** when you are ready, then **Show results**. The first server-verified 100% submission wins ₱50 GCash. If no entry reaches 100%, the highest verified score wins. Equal scores use the earlier server receipt time. The server, not the browser, determines the score and submission order.

The presenter page also has **View live progress**. Enter the PIN to see joined display names, each participant's latest Silver and Gold check result, their best server-verified score, and how many times they verified. It refreshes automatically after you start or unlock it. Local browser-only Run actions are not reported as progress; the stage checks and Verify Accuracy are.

## Scoring contract

Bronze rows include unique `row_uid`, business `record_id`, location, commodity, harvested area, production, and year. Valid Silver rows have a known nonblank place, the correct crop after trimming/case normalization, numeric production at least zero, numeric harvested area greater than zero, and one row per `record_id` (keep the lowest `row_uid`). All excluded rows are the quarantine set. Gold groups by place, sums production and harvested area, and calculates area-weighted yield as `SUM(production_mt) / SUM(harvested_area_ha)`, rounded to two decimals.

Cacao adds two validation rules that Rice does not exercise: the year must be 2025 and the business `record_id` must not be blank. It also has extra wrong crop/place values, area text like `3ha` that SQLite can partly cast to a number, and a missing production value. The contest page states the rules. Applying only the Rice cleaning changes to Cacao will therefore miss records, even after changing the crop and place names. The Gold target calculation is deliberately shared so the demo teaches that concept.

Verification assigns 40 points to Silver membership and values, 15 to quarantine, 35 to Gold totals/yield, and 10 to the top-place dashboard facts. Partial category scores are rounded down, so a near match cannot become 100%. The browser shows category feedback but does not receive expected Cacao results. The server generates a private fixture seed unless `CONTEST_SEED` is set for a reproducible rehearsal; when `STATE_FILE` is configured, the seed survives restarts.

**Stage completion:** Silver is correct at 40/40 valid rows and values plus 15/15 excluded rows. Gold is correct at 35/35 totals and yield plus 10/10 top-place facts. The Gold stage check uses the canonical Silver rows to isolate Gold query mistakes; the final Verify Accuracy replays both submitted queries together. The Cacao fixture varies area and yield together so the deliberately wrong row-average Gold starter remains detectably different from the required area-weighted yield.

## Architecture and limits

- Browser: local `sql.js` WebAssembly engine executes the edited, read-only Silver and Gold `SELECT` queries. The chart uses those actual Gold rows. Bronze and query outputs show all rows in scrollable tables. Missing cells are highlighted, and a summary shows the count of rows with missing fields, the required exclusion count, and the current exclusion progress.
- The completed Rice dashboard is visible beside the presenter's current dashboard during the demo. The completed Cacao dashboard appears only after the contest closes, so students can compare their results at the reveal.
- The Bronze reference panel stays visible while scrolling within the app. Browsers do not guarantee that a web page can stay above other desktop windows.
- Server: the same SQL engine replays submitted SQL on canonical data in a time-limited worker, compares the result with independently computed expected rows, and records verified scores and receipt times. The browser's score and clock are never accepted.
- Locally, sessions and scores stay in server memory unless `STATE_FILE` is set. On Railway, `STATE_FILE` must point to a mounted volume; the server saves its fixture seed, sessions, contest state, and verified scores after every change. A browser refresh restores that tab's session while the same contest remains available.
- The presenter view is a separate page. The earlier `/instructor` link and `INSTRUCTOR_PIN` setting still work for existing setups. The PIN protects contest start/stop and is rate limited, including if someone discovers the presenter URL. Display names are classroom labels, not verified identities; the presenter should supervise name use. For a larger public event, add participant authentication and deployment-specific resource controls.
- Paste blocking applies only to SQL editors. It is a classroom deterrent and cannot establish whether a student used AI or copied outside the app.

Run `npm test` to check fixture invariants, the 100% solution path, the valid-but-wrong path, and read-only query restrictions.
