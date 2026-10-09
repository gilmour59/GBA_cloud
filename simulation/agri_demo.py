# Databricks notebook source
# GBA_cloud MIT lesson: synthetic agricultural Bronze -> Silver -> Gold
# Intended for a Databricks notebook with PySpark and Delta enabled.
from pyspark.sql import functions as F
from pyspark.sql import types as T

# COMMAND ----------
# Fictional data; do not treat these values as official Philippine statistics.
provinces = ["Iloilo", "Capiz", "Antique", "Aklan", "Guimaras"]
commodities = ["Rice/Palay", "Corn", "Cacao", "Coffee"]
N = 10000  # Increase only after testing free-tier quota/performance.
base = (
    spark.range(N)
    .select(
        F.col("id").cast("long").alias("record_id"),
        F.element_at(F.array(*[F.lit(x) for x in provinces]), (F.col("id") % len(provinces) + 1).cast("int")).alias("province"),
        F.element_at(F.array(*[F.lit(x) for x in commodities]), (F.col("id") % len(commodities) + 1).cast("int")).alias("commodity"),
        (F.lit(1.0) + (F.col("id") % 70) / 10).cast("double").alias("area_ha"),
        (F.lit(1.0) + (F.col("id") % 70) / 10).cast("double").alias("production_mt"),
        F.lit(2026).alias("year")
    )
)
# Inject three known data-quality problems and one duplicate record.
dirty = (base
    .withColumn("province", F.when(F.col("record_id") == 1, F.lit(None)).otherwise(F.col("province")))
    .withColumn("production_mt", F.when(F.col("record_id") == 2, F.lit(-4.0)).otherwise(F.col("production_mt")))
    .withColumn("commodity", F.when(F.col("record_id") == 3, F.lit("Unknown")).otherwise(F.col("commodity")))
)
raw = dirty.unionByName(dirty.filter(F.col("record_id") == 4))
print("Bronze raw rows:", raw.count())
# COMMAND ----------
# Use allowed schema/catalog in your workspace (default may vary).
# Managed table names avoid committing secrets, credentials, or external URLs.
bronze_table = "gba_agri_bronze"
silver_table = "gba_agri_silver"
gold_table = "gba_agri_gold"
raw.write.format("delta").mode("overwrite").saveAsTable(bronze_table)
bronze = spark.table(bronze_table)
valid = (F.col("province").isin(provinces) &
         F.col("commodity").isin(commodities) &
         F.col("area_ha").isNotNull() & (F.col("area_ha") > 0) &
         F.col("production_mt").isNotNull() & (F.col("production_mt") >= 0))
rejected = bronze.filter(~F.coalesce(valid, F.lit(False)))
silver = bronze.filter(F.coalesce(valid, F.lit(False))).dropDuplicates(["record_id"])
print("Rejected dirty rows:", rejected.count())
print("Silver valid unique rows:", silver.count())
assert bronze.count() == N + 1
assert rejected.count() == 3
assert silver.count() == N - 3
silver.write.format("delta").mode("overwrite").saveAsTable(silver_table)
# COMMAND ----------
gold = (spark.table(silver_table)
    .groupBy("province", "commodity")
    .agg(
        F.count("*").alias("record_count"),
        F.round(F.sum("area_ha"), 2).alias("total_area_ha"),
        F.round(F.sum("production_mt"), 2).alias("total_production_mt")
    ))
gold.write.format("delta").mode("overwrite").saveAsTable(gold_table)
print("Gold summary:")
display(spark.table(gold_table).orderBy("province", "commodity"))
# COMMAND ----------
# Run in a Databricks SQL cell:
# SELECT province, SUM(total_production_mt) AS total_production_mt
# FROM gba_agri_gold GROUP BY province ORDER BY total_production_mt DESC;
# In the display output, select a bar chart visualization.
# COMMAND ----------
# Optional table history (requires Delta-managed tables and privileges):
# spark.sql("DESCRIBE HISTORY gba_agri_silver").show(truncate=False)
# For a controlled table update and time travel, use a disposable demo table
# instead of changing core learning datasets.
