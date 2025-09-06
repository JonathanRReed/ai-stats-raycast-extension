---

# AI-Stats (Raycast Extension)

A Raycast extension that provides quick access to AI model statistics and leaderboards.
It connects to a **Supabase database** (hosted and maintained by Jonathan Reed) that syncs with [ArtificialAnalysis.ai](https://artificialanalysis.ai/). You can search models, view benchmark results, and check leaderboards — all without leaving Raycast.

🌐 Web version: [https://aistats.jonathanreed.com](https://aistats.jonathanreed.com)

---

## Features

* 🔍 **Search Models** – Find any AI model by name, slug, or creator.
* 📊 **Detailed Stats** – Benchmarks (MMLU, GPQA, coding/math indices, throughput, latency), pricing info, and metadata.
* 🏆 **Leaderboards** – View top models by benchmark scores, tokens/sec, or latency.
* 📋 **Quick Actions** – Copy values to clipboard, open documentation links, or refresh results.

---

## Setup

1. **Install the extension** in Raycast (Developer Mode required if running locally).
2. Run the commands:

   * `View`
   This will open the extension in Raycast, allowing you to search models, view leaderboards & stats.

---

## Data Source

* 📡 All stats come from **[ArtificialAnalysis.com](https://artificialanalysis.ai/)** (via their free API).
* Data and benchmarks are **owned by ArtificialAnalysis.com**.
* This project was inspired by [Theo Browne’s Model Prices](https://model-prices.vercel.app/).

---

## Tech Stack

* **Raycast API** – extension framework
* **Supabase** – hosted database (read-only access provided)

---

## License

MIT License

---

## Disclaimer

This is a **hobbyist project**, not intended for commercial use.
All data and benchmarks belong to **ArtificialAnalysis.com**.
The Supabase database is hosted and maintained by Jonathan Reed to avoid over using the free tier for artificialanalysis.ai.

---