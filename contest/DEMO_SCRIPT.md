# Five-minute Rice demo script

Use this document as your private speaking notes. It does not appear in the classroom app.

**Before the timer:** Open the [Presenter page](http://127.0.0.1:3000/presenter), select **Rice demo**, and click **Reset starter SQL**. Have your presenter PIN and the [student page](http://127.0.0.1:3000/) ready to share. Keep the Rice correction unloaded until the fix step.

## 0:00–0:45 — Bronze: show the raw data

**On screen:** Show the Bronze table. Point to the blank location in the visible rows. You can mention that more errors, including bad numbers and duplicates, appear farther down.

**Say:** “This is our synthetic Rice dataset. Bronze keeps the records as they arrived, including mistakes. A dashboard built directly from this raw table could be misleading, so our first job is to decide which rows belong in the cleaned data.”

## 0:45–1:30 — Silver: run, then check

**On screen:** Click **Run Silver**. Show the Silver and quarantine previews. Click **Check Silver**; it should report **Needs work**.

**Say:** “The SQL ran, and we got cleaned and excluded rows. But ‘ran successfully’ only means the query executed. The server's check says some records are still handled incorrectly. We need to check the result, not just the syntax.”

## 1:30–2:20 — Gold and dashboard: show the consequence

**On screen:** Click **Run Gold**, then **Check Gold**. Show the production chart and click **Verify Accuracy**. Expect the overall score to be below 100%.

**Say:** “Gold groups the Silver rows into production, area, and yield by place. The Gold formula can be correct, yet the dashboard can still be wrong because bad rows came from Silver. This overall verification checks the complete pipeline.”

If **Check Gold** says **Correct**, that is expected: it checks the Gold query using clean Silver reference rows. The dashboard on screen still uses your current Silver output.

## 2:20–4:10 — Fix Rice and prove the result

**On screen:** Click **Load Rice correction → Run Silver → Check Silver → Run Gold → Verify Accuracy**. Expect **Silver correct** and **100% accuracy**. Point out that the chart changed.

**Say:** “Now the Silver query rejects the bad numeric value and extra copies of a record. We run Gold again because it must use the new Silver rows. The server now reports 100%, and the dashboard reflects the corrected data.”

## 4:10–5:00 — Hand over the Cacao contest

**On screen:** Open **Presenter controls and results**, enter your PIN, and click **Start 15-minute contest**. Share the student page URL. Switch to **Cacao contest** and join with your own display name if you are competing too.

**Say:** “Your challenge uses the same Bronze → Silver → Gold → Dashboard flow with a different synthetic crop: Cacao. Run each stage, use its check for feedback, and press Verify Accuracy for your official score. AI help is allowed, but type your SQL changes. The first server-verified 100% wins the ₱50 GCash prize. You have 15 minutes—go!”
