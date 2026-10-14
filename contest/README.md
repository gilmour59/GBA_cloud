# Data Engineering Challenge

A standalone, Databricks-inspired classroom app for the **5-minute Rice demo → 15-minute Cacao contest → 5-minute reveal**. All crop records and place names are synthetic. It does not require a Databricks account or use the separate 437-row notebook exercise.

## Run

Requires Node.js 20 or newer.

```sh
cd contest
npm ci
INSTRUCTOR_PIN=choose-a-private-pin npm start
```

Open `http://127.0.0.1:3000`. For classmates on the same network, run with `HOST=0.0.0.0` and open the instructor computer's LAN address at port 3000. Set `PORT` if needed. Keep the instructor PIN private. If `INSTRUCTOR_PIN` is omitted, the server generates one and prints it in the terminal. The SQL engine is served from the installed package, so the app does not depend on a CDN during class.

## How to present

1. Open **Rice demo**. Click **Run Query**: the starter SQL executes and draws a plausible but incorrect dashboard. Click **Verify Accuracy** to show that execution is not correctness.
2. Click **Load Rice correction**, then **Run Query** and **Verify Accuracy** again. The server should report 100%. Show the changed production chart and quarantined count.
3. In **Instructor controls**, start the 15-minute contest. Classmates open the site, enter a unique display name, and join **Cacao contest**. Their SQL runs in an isolated browser SQLite database. They may ask AI for help but must type changes into the editor.
4. At time expiry, or by using **End contest & reveal**, open **Show results**. The first server-verified 100% submission wins ₱50 GCash. If no entry reaches 100%, the highest verified score wins. Equal scores use the earlier server receipt time. The server, not the browser, determines the score and time.

## Scoring contract

Bronze rows include unique `row_uid`, business `record_id`, location, commodity, harvested area, production, and year. Valid Silver rows have a known nonblank place, the correct crop after trimming/case normalization, numeric production at least zero, numeric harvested area greater than zero, and one row per `record_id` (keep the lowest `row_uid`). All excluded rows are the quarantine set. Gold groups by place, sums production and harvested area, and calculates area-weighted yield as `SUM(production_mt) / SUM(harvested_area_ha)`, rounded to two decimals.

Verification assigns 40 points to Silver membership and values, 15 to quarantine, 35 to Gold totals/yield, and 10 to the top-place dashboard facts. Partial category scores are rounded down, so a near match cannot become 100%. The browser shows category feedback but does not receive expected Cacao results. The server uses a private per-process fixture seed unless `CONTEST_SEED` is set for a reproducible rehearsal.

## Architecture and limits

- Browser: local `sql.js` WebAssembly engine executes the edited, read-only Silver and Gold `SELECT` queries. The chart uses those actual Gold rows.
- Server: the same SQL engine replays submitted SQL on canonical data in a time-limited worker, compares the result with independently computed expected rows, and records verified scores and receipt times. The browser's score and clock are never accepted.
- Sessions and scores are kept in server memory. Restarting the server resets the current contest, so keep it running throughout class. A browser refresh restores that tab's session while the server remains running.
- The instructor PIN protects contest start/stop and is rate limited. Display names are classroom labels, not verified identities; the instructor should supervise name use. For an internet-facing event, add authentication, durable storage, TLS, and deployment-specific resource controls before using this prototype.
- Paste blocking applies only to SQL editors. It is a classroom deterrent and cannot establish whether a student used AI or copied outside the app.

Run `npm test` to check fixture invariants, the 100% solution path, the valid-but-wrong path, and read-only query restrictions.
