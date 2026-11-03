# Solar Depreciation & ROI Calculator

English | [日本語](README.ja.md)

A clean, client-side dashboard to track solar system payback, self-consumption savings, and electricity cost offsets over time.

## Overview

Calculates ROI and amortization timeline for residential solar installations (with or without batteries) using real electricity bill history and solar generation data.

- **Self-Consumption Savings:** Uses a historical per-month daytime replacement rate (`assumed_day_rate_jpy`) to calculate monetary savings from avoided daytime grid purchases, avoiding the mathematical distortions of fixed base fees.
- **Export Revenue:** Direct tracking of periodic utility feed-in deposits.
- **Self-Consumption Ratio:** Tracks the annual percentage of generated solar energy consumed on-site against subsidy quota requirements (e.g. ≥30%).
- **Payback & Amortization Tracking:** Shows cumulative return against net initial capital investment.

> **Note for Solar-Only Setups:** If your system does not include a battery, set `"batteryCapacityKwh": 0` in `web/data/config.json`. The dashboard will automatically adjust the UI and calculation labels.

---

## Calculation Methodology

The dashboard uses the following formulas for its monthly and cumulative calculations:

### 1. Net Capital Investment
```
Net Investment = System Cost - Subsidies Received
```
This is the baseline investment threshold the system needs to recover.

### 2. Self-Consumed Solar Energy (kWh)
```
Self-Consumed (kWh) = max(0, Solar Generated kWh - Solar Exported kWh)
```
Solar energy not exported to the grid is consumed directly by the home or stored in the battery for nighttime use.

### 3. Monthly Self-Consumption Savings (¥)
```
Monthly Savings (¥) = Self-Consumed (kWh) * Day Rate (¥/kWh)
```
Instead of dividing distorted utility bills by tiny grid imports, each month's self-consumed energy is multiplied by the daytime replacement rate (`assumed_day_rate_jpy`) for that specific month.

### 4. Total Monthly Economic Value (¥)
```
Total Monthly Value (¥) = Monthly Savings (¥) + Export Deposit (¥)
```
Combines bill reductions from self-consumption with actual cash deposits received from exported electricity.

### 5. Cumulative Return & Payback Progress
```
Cumulative Value = Sum of Total Monthly Values to date
Payback Progress (%) = min(100%, (Cumulative Value / Net Investment) * 100)
Remaining Balance (¥) = max(0, Net Investment - Cumulative Value)
```

### 6. Projected Break-Even Date
```
Average Monthly Value = Average of the Last 12 Recorded Months (TTM)
Months Remaining = ceil(Remaining Balance / Average Monthly Value)
Projected Date = Latest Recorded Month + Months Remaining
```

### 7. Self-Consumption Rate (%)
```
Self-Consumption Rate (%) = (Total Self-Consumed kWh / Total Solar Generated kWh) * 100
```
Tracks the percentage of generated solar energy utilized directly on-site versus exported to the grid, ensuring compliance with subsidy thresholds (e.g. ≥30%).

---

## How to Use This for Your Own Solar System

If you want to track your own installation:

1. **Fork the Repository:** Click the **Fork** button at the top right of this repository to create your own copy.
2. **Update Configuration (`web/data/config.json`):**
   - Set your gross system cost, subsidies received, and net investment.
   - Set your system capacities (`solarCapacityKw`, `batteryCapacityKwh`, `inverterCapacityKw`).
   - Configure your utility provider, tariff rate, and default language (`"en"` or `"ja"`).
3. **Add Your Data (`web/data/history.csv`):**
   - Fill in your monthly billing and generation history.
   - Columns: `month,grid_imported_kwh,bill_jpy,solar_generated_kwh,solar_exported_kwh,export_deposit_jpy,assumed_day_rate_jpy`.
   - *Tip on `assumed_day_rate_jpy`:* This is the price per kWh you would have paid to buy daytime electricity from the grid (Daytime energy base rate + monthly fuel cost adjustment + renewable energy surcharge).
4. **Publish via GitHub Pages:**
   - In your repository, go to **Settings** -> **Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
   - Push to `main`, and GitHub Actions will automatically test and deploy the `web/` directory.
   - Your dashboard will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## Automated Data Fetching (`fetch_solar.py`)

A built-in Python package automates populating `web/data/history.csv`:

1. **Grid Import & Bills (買電):**
   - **Octopus Energy Japan (from 2026-11 onwards):** Automatically queries the Kraken GraphQL API (`https://api.oejp-kraken.energy/v1/graphql/`) for 30-minute interval smart meter readings (`halfHourlyReadings`).
   - **Historical Months:** Can be passed via `--grid-import` and `--bill`.
2. **Solar Generation & CT Clamp Export:**
   - Queries local **VictoriaMetrics** for EP Cube battery/solar, Canadian Solar inverter generation, and Panasonic main breaker CT export in JST month windows.
3. **Surplus Export Revenue (売電 / Non-FIT Sales):**
   - Pass a monthly TEPCO Export CSV via `--tepco-export <path>` to parse non-FIT surplus solar energy sold to TEPCO.

### Configuration (`.env`)

Copy `.env.example` to `.env` (kept local and ignored by Git):

```bash
cp .env.example .env
```

Set your Octopus Energy portal email, password, and account number (`A-XXXXXXXX`), plus local VictoriaMetrics host:

```env
OCTOPUS_EMAIL="your-email@example.com"
OCTOPUS_PASSWORD="your-octopus-password"
OCTOPUS_ACCOUNT_NUMBER="A-XXXXXXXX"
VM_HOST="http://192.168.0.250:8428"
```

### Running the Fetcher

```bash
# 1. Fetch previous calendar month in dry-run preview mode
python3 fetch_solar.py

# 2. Fetch specific month
python3 fetch_solar.py 2026-11

# 3. Fetch and append/update web/data/history.csv in-place
python3 fetch_solar.py 2026-11 --append

# 4. Include TEPCO surplus export statement
python3 fetch_solar.py 2026-10 --append --tepco-export path/to/tepco_export.csv
```

### Running Tests

```bash
# Run Python fetcher unit tests
python3 -m unittest discover -s tests -p "test_*.py"

# Run JavaScript frontend model tests (works with macOS built-in jsc or Node.js)
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tests/model.test.mjs
```

---

## Repository Structure

- `web/`: The frontend application (only directory deployed to GitHub Pages).
  - `web/index.html`: Semantic HTML dashboard.
  - `web/style.css`: Clean, dark theme design system.
  - `web/js/`: Pure ES modules (`main.js`, `model.js`, `view.js`, `charts.js`, `i18n.js`).
  - `web/data/`: `config.json`, `history.csv`, and `i18n.json`.
- `fetcher/`: Modular Python ingestion package (`config`, `window`, `vm`, `octopus`, `tepco`, `history`).
- `fetch_solar.py`: CLI wrapper for the fetcher package.
- `tests/`: Automated unit tests for data fetching and calculations.
- `.github/workflows/deploy.yml`: GitHub Actions CI test and Pages deployment workflow.
