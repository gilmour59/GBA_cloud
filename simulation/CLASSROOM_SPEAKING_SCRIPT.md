# Live Classroom Speaking Script — Rice Data Engineering Demonstration

**WVSU MIT Topic 11 — Big Data Analytics and Cloud-Based Data Engineering**

Use these lines as a **read-aloud presenter script**. Bracketed instructions are presenter actions, not spoken dialogue. The first four stages are backed by screenshots from our executed notebook; the remaining stages are future steps. Estimated runtime for the current portion: **5–7 minutes**, depending on pauses.

## Opening — 30 seconds

“Good day, everyone. We've discussed the principles of Big Data Analytics and cloud-based data engineering. For this demonstration, I want to show what happens when we bring an actual dataset-shaped problem into a cloud analytics environment. To keep this classroom example safe, every record we're using is synthetic, or fictional. The dataset is inspired by rice production reporting concepts, but these are not official Department of Agriculture statistics.

Our objective is not just to display a table. It is to show why we cannot trust analytical results until we understand the quality of the data that produced them.”

## Step 1 — Ingestion: Raw data becomes a Bronze table — 60 seconds

[Show `workspace.default.rice_bronze` and the first 10 rows.]

“We uploaded a CSV file into Databricks Free Edition and created a table called `rice_bronze`. In a data engineering pipeline, we call this the Bronze layer because it holds data close to the original source. We want a traceable starting point, even if the records contain mistakes.

Let's count the rows.”

[Show `SELECT COUNT(*) ...`, then point at **437**.]

“Databricks reports 437 records. So our upload succeeded—but notice that this number only tells us how many records are stored. It does not tell us whether all records are valid. That's where data profiling comes in.”

## Step 2 — Data profiling: Understand schema and types — 75 seconds

[Show `DESCRIBE TABLE workspace.default.rice_bronze;`.]

“The schema tells us that our table contains 12 columns. We have identifiers, reporting year and month, season, province, water source, area measurements, production, source system, and ingestion date.

Look carefully at `production_mt`. Although production should represent metric tons as a number, Databricks imported this column as a string, meaning text. This can happen when source records contain inconsistent values or formatted text.

A data engineer must explicitly verify which values are numeric before aggregating them. Otherwise, SQL calculations can fail or misleadingly discard bad entries. This is one reason why we cannot skip the cleaning stage.”

## Step 3 — Data profiling: Duplicates — 75 seconds

[Show the `GROUP BY record_id HAVING COUNT(*) > 1` output.]

“Now let's check for duplicate identifiers. Here we found five record IDs that each appear twice.

If these are duplicate submissions and we sum both copies, the total rice production can be overstated. However, a repeated ID is not automatically proof of an invalid row in every real system: we need to understand what makes a record unique. In our synthetic exercise, these IDs are intentionally duplicated to demonstrate why uniqueness rules matter.

Later, in the Silver layer, we'll define a clear policy for retaining one valid record and preserving rejected ones for review.”

## Step 4 — Data profiling: Coverage and missing provinces — 60 seconds

[Show the year/province grouped counts.]

“Our next query groups rows by year and province. We can see fictional reporting data across 2023, 2024, and 2025, covering six Western Visayas province labels in this dataset.

One group has a missing, or NULL, province. If we ignore that problem, a province-level summary could leave some production uncategorized or exclude it entirely.

This is a simple but important analytical principle: before comparing provinces or years, we must confirm that records are grouped under valid, consistent categories.”

## Step 5 — Next validation: Numeric conversion — 45 seconds

[Run the `TRY_CAST` query **before** delivering any numeric results; if it has not run, simply introduce it.]

“Our next check will attempt to convert production values into numeric form using `TRY_CAST`. Unlike an ordinary cast, this returns a NULL for values it cannot convert. That helps us identify suspicious records without stopping the whole query.

We haven't established the count of invalid production values yet, so we will inspect the query's results before drawing conclusions.”

## Transition to the next lesson — 45 seconds

“So far, we have ingested 437 records, inspected 12 columns, identified five repeated IDs, noticed missing location information, and discovered a numeric measure stored as text. These findings demonstrate a central message: **large data is not automatically reliable data**.

Next, our Silver layer will apply documented quality rules and create a quarantine table for failures. Our Gold layer will aggregate valid production and harvested area and calculate yield. We'll then compare results before and after cleaning to show how data quality affects decisions.

This workflow—ingest, profile, clean, aggregate, and interpret—is what transforms raw records into defensible analytics.”

## Anticipated questions

**Why use synthetic records?** “To explain real engineering concepts without exposing actual farmer information or using internal operational datasets.”

**Is 437 rows really Big Data?** “No. This is a teaching-scale dataset that demonstrates the same stages used in larger data systems. We aren't claiming a performance or scalability benchmark.”

**Why not delete duplicate rows immediately?** “A repeated identifier requires a business uniqueness rule. We preserve the original data, review the reason, and use a documented deduplication policy.”

**Why do we use Bronze, Silver, and Gold?** “Bronze preserves raw inputs, Silver enforces reliable data quality, and Gold delivers aggregate measures for analysis.”

**Can we calculate yield simply by averaging yields?** “Not necessarily. For comparable records, an area-weighted yield is total production divided by total harvested area; averaging individual ratios can distort the result.”

**Does a successful CSV upload prove the dataset is trustworthy?** “No. It proves the data arrived. Trustworthiness requires profiling, validation, and documented transformations.”
