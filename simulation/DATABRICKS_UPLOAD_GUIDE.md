# Databricks Free Edition — Rice CSV Upload Guide

This is the **S-01/S-02 ingestion setup** for the WVSU MIT Big Data Analytics and Cloud-Based Data Engineering classroom demonstration.

## 1. Prepare the synthetic data

Download the classroom dataset ZIP from the ChatGPT project conversation (`rice_analytics_synthetic.zip`), extract it, and locate **`rice_raw_synthetic.csv`**. The ZIP is not currently stored in this repository. This is **synthetic sample data**; do not use real farmer or agency records.

The generated example contains **437 CSV data records**, including intentionally invalid and duplicated records for later exercises.

## 2. Upload the CSV

1. Sign in to your **Databricks Free Edition** workspace.
2. In the sidebar, choose **+ New → Add or upload data** (exact wording can vary by workspace).
3. Select **Create or modify a table**.
4. Upload `rice_raw_synthetic.csv`.
5. Choose an available **catalog** and **schema**. For example, some workspaces expose `workspace` and `default`, but **use the names actually shown in your account**.
6. Set the table name to **`rice_bronze`**. Confirm the CSV header is recognized as column names.
7. Review the preview and click **Create**.

This starter workflow imports the CSV to a managed table. Later we will distinguish archived original files from the Bronze Delta table.

## 3. Confirm the table and counts

Create/open a notebook, select SQL for a cell, and replace the example catalog/schema with the ones you chose:

```sql
SELECT * FROM workspace.default.rice_bronze LIMIT 10;
```

```sql
SELECT COUNT(*) AS total_records
FROM workspace.default.rice_bronze;
```

**Expected count: 437**, if all data rows were ingested exactly once with the header interpreted correctly.

You can also check the available catalog and schema:

```sql
SELECT current_catalog(), current_schema();
```

If Databricks generates slightly different column names or data types, inspect the preview before proceeding.

## 4. What to show classmates

- **Raw ingestion:** The CSV contains original fictional entries, including mistakes on purpose.
- **Bronze:** Preserve source content and trace where each record came from.
- **Silver (next):** Check nulls, duplicate record identifiers, negative figures, invalid provinces/months, and quarantine failures.
- **Gold (later):** Summarize area, production and yield for comparable seasons/provinces, explaining numerator, denominator and limitations.

Do **not** deduplicate or delete records in the upload interface: errors are necessary for our data-quality demonstration.

## 5. Troubleshooting

- **Table not found:** Check the chosen catalog, schema and exact table name. Update the SQL three-part path.
- **Incorrect record count:** Make sure the first CSV row is used as a header; inspect skipped or rejected records and verify the file was not uploaded twice.
- **No available compute:** Run the notebook on the workspace's available serverless compute, where provided.
- **Databricks Genie ChatGPT OAuth error `client_id: chatgpt not available`:** This is an account-side OAuth application authorization/availability problem. Genie is **optional** for this project; use notebooks with PySpark/SQL. There is no need to fix Genie before the simulation.

## 6. Next step

Send the notebook's count output (and chosen table path) so we can proceed with **S-02 profiling and S-03 Bronze → Silver cleaning**.

> Never commit real DA/RSBSA farmer records, access tokens, personal identifiers, or credentials to a public repository.
