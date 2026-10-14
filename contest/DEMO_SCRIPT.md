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

## Presenter answer: what to do at each phase

Keep this section in your own notes during the demo. **Bronze has no query to fix:** inspect the raw source rows. **Silver needs a correction:** the starter executes, but it lets nonnumeric production and duplicate records through. The **Load Rice correction** button puts the exact query below into the Silver editor; you can use the button during the five-minute demo rather than type it. Run Silver and click **Check Silver**. **Gold's Rice starter is already correct:** run it again after fixing Silver, because Gold reads the current Silver output. Then use **Verify Accuracy** to check the complete pipeline. The dashboard has no separate query; it draws from Gold.

### Exact Rice Silver query

```sql
WITH ranked AS (
  SELECT row_uid, record_id, TRIM(location) AS location,
    UPPER(TRIM(commodity)) AS commodity,
    harvested_area_ha, production_mt, year,
    ROW_NUMBER() OVER (PARTITION BY record_id ORDER BY row_uid) AS rn
  FROM bronze
)
SELECT row_uid, record_id, location, commodity,
  CAST(harvested_area_ha AS REAL) AS harvested_area_ha,
  CAST(production_mt AS REAL) AS production_mt, year
FROM ranked
WHERE location IN ('Pinefield', 'Riverbend', 'Hillcrest', 'Lakeside')
  AND commodity = 'RICE'
  AND CAST(harvested_area_ha AS REAL) > 0
  AND CAST(production_mt AS REAL) >= 0
  AND TRIM(production_mt) <> ''
  AND TRIM(production_mt) NOT GLOB '*[^0-9.]*'
  AND rn = 1
```

The final three conditions are the fix: reject blank production, reject nonnumeric production such as `n/a`, and keep only the first copy of each `record_id`.

### Exact Rice Gold query

```sql
SELECT
  location,
  ROUND(SUM(production_mt), 2) AS total_production_mt,
  ROUND(SUM(harvested_area_ha), 2) AS total_area_ha,
  ROUND(SUM(production_mt) / SUM(harvested_area_ha), 2) AS yield_mt_ha
FROM silver
GROUP BY location
ORDER BY location
```

The Rice Gold starter already contains this query. If **Check Gold** says **Correct** while the chart is still wrong, that means Silver is feeding it bad rows. After correcting Silver, click **Run Gold** again so the chart and final verification use the cleaned rows.

### Why the contest is not the same answer

The Cacao dataset uses different places and crop values, and also includes a wrong year and a blank business record ID. Its Silver criteria show those extra rules. Its Gold starter averages row yields, so contestants must change it to total production divided by total area. They can reuse the *method* from the Rice demo, but the Rice query alone cannot earn 100% on Cacao. Keep any full Cacao answer key off the shared screen until the results reveal.
