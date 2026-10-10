# Databricks Rice Analytics — Executed Lab Log

**Project:** WVSU MIT Topic 11, Big Data Analytics and Cloud-Based Data Engineering  
**Updated:** October 10, 2026  
**Status:** Bronze ingestion and initial profiling confirmed using notebook screenshots. Silver and Gold not executed yet.

## Source and safety
- **Input:** `rice_raw_synthetic.csv`, fictional Western Visayas rice data, supplied in the classroom synthetic dataset ZIP.
- **Notebook:** `GBA_Agricultural_Big_Data_Demo`
- **Table:** `workspace.default.rice_bronze`
- Do not upload real farmer identities, RSBSA information, or operational DA datasets to the public repository.

## Step 1 — Import synthetic CSV (confirmed)
1. In Databricks Free Edition select **+ New → Add or upload data → Create or modify a table**.
2. Upload `rice_raw_synthetic.csv`. Check that the first row is used as the header.
3. Choose catalog `workspace`, schema `default`, table name `rice_bronze`.
4. Create the table.

Verify:
```sql
SELECT *
FROM workspace.default.rice_bronze
LIMIT 10;
```

```sql
SELECT COUNT(*) AS total_records
FROM workspace.default.rice_bronze;
```

**Observed:** Preview query returned 10 records; count returned **437**. This confirms successful loading, not that all 437 records are correct.

## Step 2 — Inspect data types (confirmed)
```sql
DESCRIBE TABLE workspace.default.rice_bronze;
```

**Observed 12 columns:**

| Column | Databricks type |
|---|---|
| record_id | string |
| year | bigint |
| month | bigint |
| season | string |
| province | string |
| water_source | string |
| commodity | string |
| planted_area_ha | double |
| harvested_area_ha | double |
| production_mt | **string** |
| source_system | string |
| ingestion_date | date |

**Explanation:** `production_mt` is text, even though production is a numeric measure. Explicit numeric conversion and quality checks are needed before aggregation.

## Step 3 — Detect duplicated IDs (confirmed)
```sql
SELECT
    record_id,
    COUNT(*) AS occurrences
FROM workspace.default.rice_bronze
GROUP BY record_id
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;
```

**Observed:** Five IDs have two occurrences each:
`RICE-00090`, `RICE-00251`, `RICE-00015`, `RICE-00391`, `RICE-00156`.

**Explanation:** Five excess rows would exist if all of these are exact duplicate submissions. We need a documented duplicate policy, not automatic deletion of legitimate multi-period measurements.

## Step 4 — Profile year/province coverage (confirmed)
```sql
SELECT
    year,
    province,
    COUNT(*) AS record_count
FROM workspace.default.rice_bronze
GROUP BY year, province
ORDER BY year, province;
```

**Observed:** Data from **2023–2025** spanning **Aklan, Antique, Capiz, Guimaras, Iloilo, Negros Occidental** and **at least one NULL province in 2023**. Screenshot shows 20 grouped rows. It is a synthetic dataset; these are not official agricultural statistics.

## Step 5 — Check unparseable production values (next, NOT YET CONFIRMED)
```sql
SELECT
    record_id, province, year, month, production_mt
FROM workspace.default.rice_bronze
WHERE production_mt IS NULL
   OR TRY_CAST(production_mt AS DOUBLE) IS NULL
ORDER BY record_id;
```

Expected purpose: detect missing/non-numeric values before numeric transformations. **Do not announce the count until the query has run.**

## Planned work — NOT YET EXECUTED
- **S-03 Silver:** Convert numeric fields, validate province, year, month, season, nonnegative values, reasonable cultivated area, appropriate grain units, and deduplicate using an explicit rule; write `rice_silver`.
- **Quarantine:** Preserve rejected submissions plus reason flags in `rice_quarantine`; never silently discard.
- **S-04 Gold:** Aggregate production and harvested area by province/year/season; yield = SUM(production_mt) / SUM(harvested_area_ha), where denominator > 0 and comparable grouping is valid.
- **S-05 Delta:** Inspect history/repeatability if available in Free Edition.
- **S-06:** Rehearse demonstration and prepare offline screenshots.

## Key teaching point
**An imported table is not the same as trustworthy analytics.** We inspect raw data, quantify quality defects, document cleaning rules, and only then calculate interpretable statistics.
