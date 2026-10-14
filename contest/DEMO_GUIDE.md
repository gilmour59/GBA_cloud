# Five-minute Rice demo guide

Open the [Presenter view](http://127.0.0.1:3000/presenter) and select **Rice demo**. Keep the starter SQL loaded. This demo uses synthetic Rice data; the classmates' Cacao answers stay separate.

| Time | Show and click | What to say |
| --- | --- | --- |
| **0:00–0:45** | Show Bronze. Point out the blank location in the preview. Use **Pin Bronze** if you want the raw records beside the editors. | “Bronze stores the records as received. Some rows need cleaning before they can support a dashboard.” |
| **0:45–1:30** | Click **Run Silver**. Show kept and quarantined rows, then **Check Silver**. Expect **Needs work**. | “The SQL ran, but the server found missing cleaning rules. Running a query is different from getting the right result.” |
| **1:30–2:20** | Click **Run Gold**, then **Check Gold**. Show the dashboard and click **Verify Accuracy**. Expect an overall score below 100%. | “Gold summarizes the Silver rows. Even a correct formula can display the wrong totals when Silver has bad records.” |
| **2:20–4:15** | Click **Load Rice correction → Run Silver → Check Silver → Run Gold → Verify Accuracy**. Expect **Silver correct** and **100% accuracy**. Compare the new chart with the first one. | “Now the bad rows are excluded. The same dashboard uses corrected input, and the server confirms the complete pipeline.” |
| **4:15–5:00** | Open **Presenter controls and results**, enter your PIN, and click **Start 15-minute contest**. Share the student page URL. If you are competing, switch to **Cacao contest**, enter your display name, and join. | “You will apply the same Bronze → Silver → Gold → Dashboard flow to Cacao. AI help is allowed; type your SQL edits.” |

## Keep these points clear

- **Run Silver / Run Gold** means the query executed. It does not mean the answer is correct.
- **Check Silver / Check Gold** gives stage feedback. These checks do not submit a contest score.
- **Verify Accuracy** checks both submitted queries together. A server-verified **100%** completes the challenge.
- For the Rice demo, **Check Gold** can say Correct while the overall score is low: it checks Gold's formula using clean Silver reference rows. The actual dashboard still uses your current Silver result.

The separate [student page](http://127.0.0.1:3000/) opens Cacao after you start the contest. The Rice correction button appears only on the Presenter view.
