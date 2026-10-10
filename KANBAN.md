# MIT Report Kanban — 2026-10-10

**Primary deliverable:** [HTML presentation](presentation/index.html) (**31 slides**, exactly 3 scenarios, full speaker scripts). Google Slides is an archived draft.

## Done
- [x] Select three 2023–2025 peer-reviewed/research papers and obtain PDFs.
- [x] R-01 Review Armbrust et al. (2023), *Making Data Engineering Declarative*: two-page CIDR paper; declarative pipelines, materialized views, incrementalization, expectations; >50% cost improvement pertains only to the specified fully incremental downstream ELT comparison, not a general benchmark.
- [x] R-02 Review Harby & Zulkernine (2025), *Data Lakehouse: A Survey and Experimental Study*: architecture survey, proposed model, IMDb workload; HDFS/Hive/Delta comparison evaluates four selected queries from 15; results depend on workload and implementation.
- [x] R-03 Review AbouZaid et al. (2025), *Building a modern data platform...*: Kubernetes, Argo Workflows, MinIO, Dremio, Iceberg; TPC-DS cache evaluation reported a **12% median** query-duration improvement in its setting.
- [x] R-04 Synthesize papers and verify cited publication details/DOIs in [presentation references](presentation/index.html): pipeline design → architecture choice → deployment/evaluation. Three papers are sufficient for the current requirement. Treat specific quantitative findings as conditional rather than universal.
- [x] P-01 Presentation outline and narrative.
- [x] P-02 Architecture visuals and HTML design.
- [x] P-03 Speaker scripts on every slide — **user-approved**.
- [x] P-04 Exactly three classroom scenario questions.
- [x] P-05 Presentation visuals/layout/Presenter View — **user-approved** (independent device/browser compatibility test not evidenced).
- [x] HTML presentation published to GitHub as the primary source, with presenter window, timer, controls, and custom visuals.
- [x] Add the Big Data analysis framework and production-vs-yield interpretation example.

## To do — Databricks Free Edition
- [ ] S-01 Verify runtime/permissions in the actual workspace.
- [ ] S-02 Generate and test synthetic agricultural data (no real farmer records).
- [ ] S-03 Run Bronze/Silver validation, deduplication, quarantine, and quality metrics.
- [ ] S-04 Run Gold analytics and charts.
- [ ] S-05 Verify Delta Lake history/versioning and rerun safety.
- [ ] S-06 Rehearse simulation and prepare offline backup.

## Delivery backlog
- [ ] Q-01 Full class rehearsal, timing and professor Q&A.
- [ ] Q-02 Optional real projector/second-device regression check.
- [ ] Q-03 Final downloadable offline backup after simulation changes.

## Research review decision
The 3 existing papers are sufficient and complementary. No extra paper is needed unless the professor explicitly requires an additional independent Big Data Analytics algorithms study. The bibliography on the final slide is compact for projection, rather than a fully formatted APA 7 hanging-indent bibliography. Numerical claims should always be presented with their tested conditions.

## Definition of done
The presentation/design and academic source review are approved. The remaining milestone is a working, reproducible Databricks simulation and rehearsed delivery.
