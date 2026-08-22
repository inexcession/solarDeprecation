# Solar Deprecation & ROI Calculator

English | [日本語](README.ja.md)

A clean, client-side dashboard to track solar system payback, self-consumption savings, and electricity cost offsets over time.

## Overview

Calculates ROI and amortization timeline for residential solar installations (with or without batteries) using real electricity bill history and solar generation data.

- **Self-Consumption Savings:** Uses a historical per-month configured replacement rate (`assumed_day_rate_jpy`) to calculate monetary savings from avoided daytime grid purchases, avoiding the mathematical distortions of fixed base fees.
- **Export Revenue:** Direct tracking of periodic utility feed-in deposits.
- **Payback & Amortization Tracking:** Shows cumulative return against net initial capital investment.

> **Note for Solar-Only Setups:** If your system does not include a battery, simply set `"batteryCapacityKwh": 0` (or remove the field) in `data/config.json`. The dashboard will automatically adjust the UI and the math handles solar-only self-consumption.

---

## How to Use This for Your Own Solar System

If you want to track your own installation, fork or clone this repository to your own GitHub account:

1. **Fork the Repository:** Click the **Fork** button at the top right of this repository to create your own copy.
2. **Update Configuration (`data/config.json`):**
   - Set your gross system cost, subsidies received, and net investment.
   - Set your system capacities (`solarCapacityKw`, `batteryCapacityKwh`).
   - Choose your default language (`"en"` or `"ja"`).
3. **Add Your Data (`data/history.csv`):**
   - Fill in your monthly billing and generation history.
   - Columns: `month,grid_imported_kwh,bill_jpy,solar_generated_kwh,solar_exported_kwh,export_deposit_jpy,assumed_day_rate_jpy`.
   - *Tip on `assumed_day_rate_jpy`:* This is the price per kWh you would have paid to buy daytime electricity from the grid. Set it to your utility's daytime tier (e.g. `35.0` JPY/kWh) to accurately value your self-consumption without being distorted by fixed monthly base fees.
   - *Note on Utility Billing Periods (e.g., TEPCO):* Power bills often state a month (e.g., "April") when the actual meter reading period was the preceding month (e.g., March 2 to April 1). Align your rows consistently so that your solar generation figures match the corresponding electricity usage period.
4. **Publish via GitHub Pages:**
   - In your forked repository, go to **Settings** -> **Pages**.
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Select branch `main` and folder `/ (root)`, then click **Save**.
   - Your private, personalized dashboard will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## Repository Structure

- `data/config.json`: System specifications, language, and calculation multipliers.
- `data/history.csv`: Monthly records for grid import, bills, solar generation, and export deposits.
- `data/i18n.json`: String definitions for English and Japanese translations.
- `index.html`, `style.css`, `app.js`: Client-side dashboard application.
