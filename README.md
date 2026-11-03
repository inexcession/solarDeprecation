# Solar Depreciation & ROI Calculator

English | [日本語](README.ja.md)

A clean, client-side dashboard to track solar system payback, self-consumption savings, and electricity cost offsets over time.

## Overview

Calculates ROI and amortization timeline for residential solar installations (with or without batteries) using real electricity bill history and solar generation data.

- **Self-Consumption Savings:** Uses a historical per-month daytime replacement rate (`assumed_day_rate_jpy`) to calculate monetary savings from avoided daytime grid purchases, avoiding the mathematical distortions of fixed base fees.
- **Export Revenue:** Direct tracking of periodic utility feed-in deposits.
- **Self-Consumption Ratio:** Tracks the annual percentage of generated solar energy consumed on-site against subsidy quota requirements (e.g. ≥30%).
- **Payback & Amortization Tracking:** Shows cumulative return against net initial capital investment.

> **Note for Solar-Only Setups:** If your system does not include a battery, simply set `"batteryCapacityKwh": 0` (or remove the field) in `data/config.json`. The dashboard will automatically adjust the UI and the math handles solar-only self-consumption.

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

If you want to track your own installation, fork or clone this repository to your own GitHub account:

1. **Fork the Repository:** Click the **Fork** button at the top right of this repository to create your own copy.
2. **Update Configuration (`data/config.json`):**
   - Set your gross system cost, subsidies received, and net investment.
   - Set your system capacities (`solarCapacityKw`, `batteryCapacityKwh`, `inverterCapacityKw`).
   - Choose your default language (`"en"` or `"ja"`).
3. **Add Your Data (`data/history.csv`):**
   - Fill in your monthly billing and generation history.
   - Columns: `month,grid_imported_kwh,bill_jpy,solar_generated_kwh,solar_exported_kwh,export_deposit_jpy,assumed_day_rate_jpy`.
   - *Tip on `assumed_day_rate_jpy`:* This is the price per kWh you would have paid to buy daytime electricity from the grid (Daytime energy base rate + monthly fuel cost adjustment + renewable energy surcharge). Tracking the actual daytime tier accurately values your self-consumption without being distorted by fixed monthly base fees.
   - *Note on Utility Billing Periods (e.g., TEPCO):* Power bills often state a month (e.g., "April") when the actual meter reading period was the preceding month (e.g., March 2 to April 1). Align your rows consistently so that your solar generation figures match the corresponding electricity usage period.
4. **Publish via GitHub Pages:**
   - In your forked repository, go to **Settings** -> **Pages**.
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Select branch `main` and folder `/ (root)`, then click **Save**.
   - Your private, personalized dashboard will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## Automated Data Fetching (`fetch_solar.py`)

A built-in Python script automates populating [`data/history.csv`](file:///Users/sty/src/solarDeprecation/data/history.csv) by pulling from multiple data sources:

1. **Grid Import & Bills (買電):**
   - **Octopus Energy Japan (from 2026-11 onwards):** Automatically queries the Kraken GraphQL API (`https://api.oejp-kraken.energy/v1/graphql/`) for 30-minute interval smart meter readings (`halfHourlyReadings`). Uses the **Simple Octopus** 24/7 flat rate (¥31.93/kWh + Renewable Surcharge) with ¥0 base fee.
   - **TEPCO Smart Life Plan (historical < 2026-11):** Automatically parses local TEPCO Usage CSVs and uses historical marginal day rates.
2. **Solar Generation & CT Clamp Export:**
   - Queries local **VictoriaMetrics** for EP Cube battery/solar, Canadian Solar inverter generation, and Panasonic main breaker CT export.
3. **Surplus Export Revenue (売電 / Non-FIT Sales):**
   - Automatically detects and parses monthly **TEPCO Export CSVs** for non-FIT surplus solar energy sold to TEPCO (paid biannually).

### Configuration (`.env`)

Copy `.env.example` to `.env` (kept local and ignored by Git):

```bash
cp .env.example .env
```

Set your Octopus Energy portal email, password, and account number (`A-XXXXXXXX`):

```env
OCTOPUS_EMAIL="your-email@example.com"
OCTOPUS_PASSWORD="your-octopus-password"
OCTOPUS_ACCOUNT_NUMBER="A-XXXXXXXX"
OCTOPUS_SWITCH_MONTH="2026-11"
OCTOPUS_BASE_RATE=31.93
RENEWABLE_SURCHARGE=3.49
VM_HOST="http://192.168.0.250:8428"
```

### Running the Fetcher

```bash
# 1. Fetch previous calendar month (default monthly cadence)
python3 fetch_solar.py

# 2. Fetch specific month (closed month or mid-month Month-To-Date)
python3 fetch_solar.py 2026-11

# 3. Fetch and append/update data/history.csv in-place
python3 fetch_solar.py 2026-11 --append
```

---

## Repository Structure

- `data/config.json`: System specifications, initial costs, subsidies, provider info, and language setting.
- `data/history.csv`: Monthly ledger containing grid import, bills, solar generation, export kWh, export deposits, and daytime rates.
- `data/i18n.json`: String definitions for English and Japanese translations.
- `fetch_solar.py`: Automated fetcher combining Octopus GraphQL API, VictoriaMetrics, and TEPCO export CSVs.
- `index.html`, `style.css`, `app.js`: Client-side dashboard application.
