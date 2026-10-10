# Databricks Simulation

## Agricultural Big Data Analytics
A fictional Western Visayas crop-production dataset will demonstrate ingestion → Bronze raw → Silver clean → Gold aggregated analytics → visualization, with data quality counts and Delta version history when supported.

Run in Databricks Free Edition. Validate its runtime and catalog capabilities before the live presentation. We will not claim that Free Edition proves multi-node scalability.

Synthetic records only; do not commit or upload sensitive real farmer data. See `agri_demo.py` for starter PySpark demonstration logic.

## Getting started

Follow the [Databricks Rice CSV upload guide](DATABRICKS_UPLOAD_GUIDE.md) to upload `rice_raw_synthetic.csv` and verify the expected 437 records before starting the Silver/Gold notebook work.
