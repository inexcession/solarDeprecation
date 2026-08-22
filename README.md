# Solar Deprecation & ROI Calculator

English | [日本語](README.ja.md)

A clean, client-side dashboard to track solar system payback, self-consumption savings, and electricity cost offsets over time.

## Overview

Calculates ROI and amortization timeline for residential solar installations (with or without batteries) using real electricity bill history and solar generation data.

> **Note for Solar-Only Setups:** If your system does not include a battery, simply set `"batteryCapacityKwh": 0` (or remove the field) in `data/config.json`. The dashboard will automatically adjust the UI and the math perfectly handles solar-only self-consumption.

- **Self-Consumption Savings:** Uses the effective monthly electricity rate (`Total Bill / Total Imported kWh`) to calculate monetary savings from avoided grid purchases.
- **Export Revenue:** Direct tracking of periodic utility feed-in deposits.
- **Payback & Amortization Tracking:** Shows cumulative return against net initial capital investment.

## Configuration & Data

- `data/config.json`: Language (`"en"` or `"ja"`), system cost, battery specifications, installation date, and calculation multipliers.
- `data/history.csv`: Monthly grid imports, electricity bill, solar generation, solar exports, and export deposits.
- `data/i18n.json`: String definitions for English and Japanese translations.

## Publishing to GitHub Pages

1. Go to repository **Settings** -> **Pages**.
2. Under **Build and deployment**, select **Source** as **Deploy from a branch**.
3. Choose branch `main` and folder `/ (root)`.
