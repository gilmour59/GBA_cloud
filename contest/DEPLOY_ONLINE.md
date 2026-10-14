# Put the classroom contest online

Use one Railway **web service** for this Node app. The presenter and students then share one public HTTPS domain: `https://YOUR-DOMAIN/presenter` for you and `https://YOUR-DOMAIN/` for classmates. The presenter page is separate, but its URL is not a secret; the private PIN protects contest controls.

## Set up Railway

1. In Railway, create a project from the GitHub repository `gilmour59/GBA_cloud` and select its `main` branch.
2. In the service's **Settings**, set **Root Directory** to `/contest`. Keep it at **one replica** so every request uses the same contest process and state file.
3. Attach a Railway **volume** to this service, mounted at `/data`. The app saves its fixture seed, contest timer, participants, and verified scores there. Do this before starting a real contest.
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
- Start a rehearsal contest, join with a test name, run and verify queries, then end it and inspect results. When you click **Start 15-minute contest** again for class, previous participants and scores are cleared.
- Restart the service once during rehearsal and check that the contest status, participant session, and results remain available. The browser tab can restore its session while the server state survives in the volume.
- Avoid changing code or Railway settings during the live 25-minute activity. A deployment or volume operation can briefly interrupt requests even though the saved state is retained.
- Keep the complete Cacao answer key in your private Google Doc; it is not in the public repository.

## How the live round works

Show Rice on `/presenter`. At the handoff, enter the PIN and click **Start 15-minute contest**. Share only the root student URL. Classmates join using unique display names. The countdown and official verification use server time. After expiry, or after **End contest & reveal**, click **Show results** on the presenter page.

## Important limits

The volume is required for reliable restart recovery. Without `STATE_FILE`, this app refuses to start on Railway. The state file is designed for **one app replica**, not concurrent replicas writing to the same file. Display names are classroom labels rather than authenticated identities, so supervise name use. For a larger public event, move sessions and scores to a database and add participant authentication.
