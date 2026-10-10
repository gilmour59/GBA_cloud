# Big Data Analytics and Cloud-Based Data Engineering

WVSU Master in Information Technology — Topic 11 report.

## Primary presentation: HTML

**[Open the 31-slide HTML source](presentation/index.html)** — download the file and open it in a browser, or serve the repository locally. Includes presenter scripts, audience/presenter dual-screen mode, custom SVG technical visuals, and exactly 3 classroom scenario questions.

Google Slides is an [archived early draft](https://docs.google.com/presentation/d/1ISXQBh2vxGKsdH-0Jnx-BNxJ1EEM17SBEM9agKYvnzA/edit), not the presentation source of truth.

The teaching narrative covers how to analyze Big Data from question definition and data profiling to ingestion, validation, transformation, analytical measures, aggregation, checking conclusions and communicating insights. All agricultural examples are fictional.

## Project management and simulation

- [KANBAN.md](KANBAN.md): current status and remaining QA.
- [GitHub Issues](https://github.com/gilmour59/GBA_cloud/issues): task tracker.
- [Simulation plan](simulation/README.md) and [starter PySpark script](simulation/agri_demo.py). Databricks Free Edition testing is still pending.

## Research papers

1. Armbrust et al. (2023), *Making Data Engineering Declarative*, CIDR 2023.
2. Harby & Zulkernine (2025), *Data Lakehouse: A Survey and Experimental Study*, Information Systems 127, 102460.
3. AbouZaid et al. (2025), *Building a Modern Data Platform Based on the Data Lakehouse Architecture and Cloud-Native Ecosystem*, Discover Applied Sciences 7, 166.

## Run locally

Download `presentation/index.html` and open it in Chrome. Press **P** for Presenter View, **N** for notes, and arrow keys to navigate. To improve multiwindow synchronization run `python3 -m http.server 8000 --bind 127.0.0.1` from the presentation directory and open `http://127.0.0.1:8000`.

No actual government/farmer data is included. Do not add personal data to a public repository.
