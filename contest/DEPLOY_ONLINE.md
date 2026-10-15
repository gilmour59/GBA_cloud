# Put the classroom contest online

Use one Railway **web service** for this Node app. The presenter and students then share one public HTTPS domain: `https://YOUR-DOMAIN/presenter` for you and `https://YOUR-DOMAIN/` for classmates. The presenter page is separate, but its URL is not a secret; the private PIN protects contest controls.

## Set up Railway

1. In Railway, create a project from the GitHub repository `gilmour59/GBA_cloud` and select its `main` branch.
2. In the service's **Settings**, set **Root Directory** to `/contest`. Keep it at **one replica** so every request uses the same contest process and state file.
3. Attach a Railway **volume** to this service, mounted at `/data`. The app saves its fixture seed, contest state, participants, and verified scores there. Do this before starting a real contest.
4. Add these service variables:

   | Variable | Value |
   | --- | --- |
   | `STATE_FILE` | `/data/contest-state.json` |
   | `PRESENTER_PIN` | Optional private passphrase; if omitted, the app generates a 12-digit PIN, saves it on the volume, and prints it in private deployment logs |
   | `HOST` | `0.0.0.0` |
   | `RAILWAY_RUN_UID` | `0` if the service cannot write to the mounted volume |

   Railway provides `PORT`; do not fix it to `3000`. If Railway does not detect the commands, use build command `npm ci` and start command `npm start`.
5. In **Settings → Networking → Public Networking**, generate a Railway domain. Open `/api/status` on that domain to confirm the server is live, then open `/presenter` and `/`. If you skipped `PRESENTER_PIN`, read the generated PIN in the service deployment logs and keep it private.

## Rehearse before class

- Open the student URL on a second device using mobile data to confirm it works outside your own network.
- Start a rehearsal contest, join with a test name, run and verify queries, then end it and inspect results. When you click **Start Cacao contest** again for class, previous participants and scores are cleared.
- Restart the service once during rehearsal and check that the contest status, participant session, and results remain available. The browser tab can restore its session while the server state survives in the volume.
- Avoid changing code or Railway settings during the live 25-minute activity. A deployment or volume operation can briefly interrupt requests even though the saved state is retained.
- Keep the complete Cacao answer key in your private Google Doc; it is not in the public repository.

## How the live round works

Show Rice on `/presenter`. The contest controls are near the top of that page. At the handoff, enter the PIN and click **Start Cacao contest**. Share only the root student URL. Classmates join using unique display names. There is no automatic time limit: click **End contest & reveal** when you are ready, then **Show results**. Official verification and submission order use server time.

Use **View live progress** with the presenter PIN to monitor joined names, checked Silver and Gold stages, and best verified scores while the contest is open. Starting the round also opens this view automatically. A participant's local Run Silver/Run Gold clicks are not sent to the server; their stage checks and official verifications are.

## Important limits

The volume is required for reliable restart recovery. Without `STATE_FILE`, this app refuses to start on Railway. The state file is designed for **one app replica**, not concurrent replicas writing to the same file. Display names are classroom labels rather than authenticated identities, so supervise name use. For a larger public event, move sessions and scores to a database and add participant authentication.
