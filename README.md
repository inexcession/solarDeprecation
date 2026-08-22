# Solar Deprecation & ROI Calculator

A clean, client-side dashboard to track solar system payback, self-consumption savings, and electricity cost offsets over time.

## Overview

Calculates ROI and amortization timeline for residential solar and battery installations using real electricity bill history and solar generation data.

- **Self-Consumption Savings:** Uses the effective monthly electricity rate (`Total Bill / Total Imported kWh`) to calculate monetary savings from avoided grid purchases.
- **Export Revenue:** Direct tracking of periodic utility feed-in deposits.
- **Payback & Amortization Tracking:** Shows cumulative return against net initial capital investment.

## Configuration & Data

- `data/config.json`: System cost, battery specifications, installation date, and calculation multipliers.
- `data/history.csv`: Monthly grid imports, electricity bill, solar generation, solar exports, and export deposits.

## Publishing to GitHub Pages

1. Go to repository **Settings** -> **Pages**.
2. Under **Build and deployment**, select **Source** as **Deploy from a branch**.
3. Choose branch `main` and folder `/ (root)`.
