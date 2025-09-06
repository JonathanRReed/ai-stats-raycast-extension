# AI-Stats (Raycast Extension)

A Raycast extension that provides quick access to AI model statistics and leaderboards.
It connects to a Supabase database (hosted by Jonathan Reed) that syncs with [ArtificialAnalysis.ai](https://artificialanalysis.ai/).
Search models, view benchmark results, compare prices, and check leaderboards — all without leaving Raycast.

🌐 Web version: [https://aistats.jonathanreed.com](https://aistats.jonathanreed.com)

## Features

- 🔍 **Search Models** – Find models by name, slug, or creator. Most recent models shown first.
- 🏷️ **Price Badges** – Blended/input/output prices per 1M tokens at a glance.
- 🚀 **Throughput** – Median tokens/sec and TTFT, with clear color cues.
- 🏆 **Leaderboards** – Rank by MMLU, GPQA, TPS, TTFT, prices, and more.
- 📄 **Model Detail Pages** – “About” pages with overview, pricing, throughput, benchmarks, and raw JSON.
- 📌 **Pin a Model** – Pin a model and the extension auto-opens it on launch.
- ⌨️ **Quick Switcher (Cmd+K)** – Jump between search/leaderboards and pick leaderboard metrics instantly.

## Setup

1. Install the extension in Raycast (Developer Mode if running locally).
2. Run the command: `View`
   - Use the search list and Action menu (or Cmd+K) to switch to leaderboards.

## Data Source

- 📡 Stats come from [ArtificialAnalysis.ai](https://artificialanalysis.ai/) (via their free API).
- Data and benchmarks are owned by ArtificialAnalysis.com.
- Inspired by [Theo Browne’s Model Prices](https://model-prices.vercel.app/).

## Tech Stack

- Raycast API – extension framework
- Supabase – hosted database (read-only, RLS-enforced)

## License

MIT License

## Disclaimer

This is a hobbyist project. Data is owned by ArtificialAnalysis.com.
The Supabase database is hosted and maintained by Jonathan Reed.
