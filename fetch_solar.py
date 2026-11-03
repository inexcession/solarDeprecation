#!/usr/bin/env python3
"""
Fetch monthly solar generation and grid metrics, and update data/history.csv.

Data Sources:
1. Solar Generation & Export Power:
   - VictoriaMetrics (EP Cube solar + Canadian Solar inverter + Panasonic CT clamp)
2. Solar Export Revenue (売電 / Surplus Sales):
   - Non-FIT surplus sales to TEPCO: parsed from monthly TEPCO export CSVs.
3. Grid Import & Electricity Bills (買電):
   - Historical (< 2026-11): Parsed from local TEPCO Usage CSVs.
   - Octopus Energy Japan (>= 2026-11): Queried automatically via Octopus Kraken
     GraphQL API (https://api.oejp-kraken.energy/v1/graphql/) using Simple Octopus
     fixed tariff (¥31.93/kWh + Renewable Surcharge).

Usage:
    python3 fetch_solar.py                     # Previous calendar month
    python3 fetch_solar.py 2026-11             # Specific calendar month (or MTD)
    python3 fetch_solar.py 2026-11 --append    # Directly append/update data/history.csv
    python3 fetch_solar.py --force             # Force run even if validation notices occur
"""

import sys
import os
import csv
import glob
import json
import ssl
import urllib.request
import urllib.parse
from datetime import datetime, timezone

# --- Environment & Configuration Loading ---
def load_dotenv(env_path=None):
    """Simple built-in .env parser (avoids external pip dependencies)."""
    if env_path is None:
        env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f"Notice: Could not parse .env file: {e}")

load_dotenv()

# VictoriaMetrics & Installation
VM_HOST = os.environ.get("VM_HOST", "http://192.168.0.250:8428")
INSTALLATION_DATE = "2026-03-15"
START_MONTH = "2026-03"

# Octopus Energy Japan Settings
OCTOPUS_SWITCH_MONTH = os.environ.get("OCTOPUS_SWITCH_MONTH", "2026-11")
OCTOPUS_API_URL = "https://api.oejp-kraken.energy/v1/graphql/"
OCTOPUS_EMAIL = os.environ.get("OCTOPUS_EMAIL", "")
OCTOPUS_PASSWORD = os.environ.get("OCTOPUS_PASSWORD", "")
OCTOPUS_API_KEY = os.environ.get("OCTOPUS_API_KEY", "")
OCTOPUS_ACCOUNT_NUMBER = os.environ.get("OCTOPUS_ACCOUNT_NUMBER", "")

# Tariff rates (Simple Octopus)
OCTOPUS_BASE_RATE = float(os.environ.get("OCTOPUS_BASE_RATE", "31.93"))
RENEWABLE_SURCHARGE = float(os.environ.get("RENEWABLE_SURCHARGE", "3.49"))
OCTOPUS_TOTAL_DAY_RATE = round(OCTOPUS_BASE_RATE + RENEWABLE_SURCHARGE, 2)  # ~35.42

# Historical TEPCO Smart Life Plan (スマートライフプラン) Marginal Daytime Rates (¥/kWh)
# Base daytime energy charge: 35.76 + fuel_adj + re_surcharge
MARGINAL_DAY_RATES = {
    "2026-03": 30.81,  # TEPCO 2026/04: 35.76 - 8.93 + 3.98
    "2026-04": 32.57,  # TEPCO 2026/05: 35.76 - 7.37 + 4.18
    "2026-05": 32.64,  # TEPCO 2026/06: 35.76 - 7.30 + 4.18
    "2026-06": 32.75,  # TEPCO 2026/07: 35.76 - 7.19 + 4.18
    "2026-07": 29.67,  # TEPCO 2026/08: 35.76 - 10.27 + 4.18
    "2026-08": 28.98,  # TEPCO 2026/09: 35.76 - 10.96 + 4.18
    "2026-09": 30.64,  # TEPCO 2026/10: 35.76 - 9.30 + 4.18
    "2026-10": 34.61,  # TEPCO 2026/11: 35.76 - 5.33 + 4.18 (subsidy ended)
}
DEFAULT_BASE_DAY_RATE = 35.76


# --- Octopus Energy Japan GraphQL Client ---
class OctopusClient:
    """Client for Octopus Energy Japan Kraken GraphQL API."""

    def __init__(self, endpoint=OCTOPUS_API_URL, email=OCTOPUS_EMAIL, password=OCTOPUS_PASSWORD,
                 api_key=OCTOPUS_API_KEY, account_number=OCTOPUS_ACCOUNT_NUMBER):
        self.endpoint = endpoint
        self.email = email
        self.password = password
        self.api_key = api_key
        self.account_number = account_number
        self.token = None

        # Robust SSL context (handles macOS default certificate trust roots)
        try:
            import certifi
            self.ssl_context = ssl.create_default_context(cafile=certifi.where())
        except Exception:
            self.ssl_context = ssl._create_unverified_context()

    def _execute(self, query, variables=None, authenticated=True):
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "SolarDeprecationFetcher/1.0"
        }
        if authenticated:
            if not self.token:
                self.authenticate()
            headers["Authorization"] = f"JWT {self.token}"

        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        req = urllib.request.Request(
            self.endpoint,
            headers=headers,
            data=json.dumps(payload).encode("utf-8")
        )
        try:
            with urllib.request.urlopen(req, context=self.ssl_context, timeout=20) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                if "errors" in result:
                    errors_str = "; ".join(e.get("message", "Unknown error") for e in result["errors"])
                    raise RuntimeError(f"GraphQL error from Kraken API: {errors_str}")
                return result.get("data", {})
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} error from Kraken API: {err_body}")

    def authenticate(self):
        """Obtain a Kraken JWT token using email/password or APIKey."""
        if self.api_key:
            mutation = """
            mutation ObtainToken($apiKey: String!) {
              obtainKrakenToken(input: { APIKey: $apiKey }) {
                token
                refreshToken
              }
            }
            """
            variables = {"apiKey": self.api_key}
        elif self.email and self.password:
            mutation = """
            mutation ObtainToken($input: ObtainJSONWebTokenInput!) {
              obtainKrakenToken(input: $input) {
                token
                refreshToken
              }
            }
            """
            variables = {"input": {"email": self.email, "password": self.password}}
        else:
            raise ValueError(
                "Octopus credentials missing. Please set OCTOPUS_EMAIL & OCTOPUS_PASSWORD "
                "(or OCTOPUS_API_KEY) in .env or your environment variables."
            )

        data = self._execute(mutation, variables=variables, authenticated=False)
        token_data = data.get("obtainKrakenToken", {})
        self.token = token_data.get("token")
        if not self.token:
            raise RuntimeError("Kraken API authentication failed: No token returned.")
        return self.token

    def fetch_monthly_grid_import(self, start_iso, end_iso):
        """
        Fetch half-hourly smart meter readings for the period and return total kWh and bill.
        """
        if not self.account_number:
            raise ValueError("OCTOPUS_ACCOUNT_NUMBER is not set. Please add it to your .env file.")

        query = """
        query GetConsumption($accountNumber: String!, $from: DateTime, $to: DateTime) {
          account(accountNumber: $accountNumber) {
            number
            bills {
              id
              statementDate
              amount
            }
            properties {
              electricitySupplyPoints {
                halfHourlyReadings(fromDatetime: $from, toDatetime: $to) {
                  startAt
                  endAt
                  value
                  costEstimate
                }
              }
            }
          }
        }
        """
        variables = {
            "accountNumber": self.account_number,
            "from": start_iso,
            "to": end_iso
        }
        data = self._execute(query, variables=variables, authenticated=True)
        acc = data.get("account", {})
        if not acc:
            raise RuntimeError(f"No account found in Kraken API for account number {self.account_number}")

        readings = []
        for prop in acc.get("properties", []):
            for esp in prop.get("electricitySupplyPoints", []):
                readings.extend(esp.get("halfHourlyReadings", []))

        total_kwh = sum(float(r.get("value") or 0.0) for r in readings)

        # In Simple Octopus, Bill = kWh * (Base Rate + Renewable Surcharge) with ¥0 base fee
        rate_per_kwh = OCTOPUS_BASE_RATE + RENEWABLE_SURCHARGE
        calculated_bill = int(round(total_kwh * rate_per_kwh))

        return round(total_kwh, 1), calculated_bill, len(readings)


# --- Helper Functions ---
def get_target_month():
    append_mode = "--append" in sys.argv
    force_mode = "--force" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    if len(args) > 0:
        arg = args[0].strip()
        parts = arg.split("-")
        if len(parts) == 2:
            return int(parts[0]), int(parts[1]), append_mode, force_mode
        print(f"Error: Invalid format '{arg}'. Use YYYY-MM (e.g. 2026-11).")
        sys.exit(1)

    # Default to the previous calendar month
    now = datetime.now()
    if now.month == 1:
        return now.year - 1, 12, append_mode, force_mode
    return now.year, now.month - 1, append_mode, force_mode

def get_tepco_billing_month(year, month):
    """Calendar month M is billed in TEPCO billing month M+1."""
    if month == 12:
        return f"{year + 1:04d}/01"
    return f"{year:04d}/{month + 1:02d}"

def auto_detect_tepco_files(target_year, search_dirs=(".", "private", "tepco_raw")):
    """
    Search for TEPCO CSV exports in the root and candidate folders.
    Matches files by year (2026, 2027, etc.) and classifies into
    Usage (スマートライフ / 買電) and Export (売電) by inspecting content.
    """
    env_usage = os.environ.get("TEPCO_USAGE_CSV")
    env_export = os.environ.get("TEPCO_EXPORT_CSV")
    if env_usage and env_export and os.path.exists(env_usage) and os.path.exists(env_export):
        return env_usage, env_export

    year_str = str(target_year)
    candidates = []

    for d in search_dirs:
        if os.path.isdir(d):
            for fname in os.listdir(d):
                if not fname.lower().endswith(".csv"):
                    continue
                if fname.lower() == "history.csv" or "i18n" in fname.lower():
                    continue
                candidates.append(os.path.join(d, fname))

    # Prioritize files containing the target year in their name (e.g. *2026*.csv, *2027*.csv)
    year_matched = [c for c in candidates if year_str in os.path.basename(c)]
    pool = year_matched if year_matched else candidates

    usage_file = env_usage if (env_usage and os.path.exists(env_usage)) else None
    export_file = env_export if (env_export and os.path.exists(env_export)) else None

    for filepath in pool:
        for enc in ["cp932", "shift_jis", "utf-8"]:
            try:
                with open(filepath, "r", encoding=enc) as f:
                    content_sample = f.read(4096)
                    # Check for TEPCO export (売電) characteristics
                    if ("売電" in content_sample or "210022503291" in content_sample) and not export_file:
                        export_file = filepath
                        break
                    # Check for TEPCO consumption (スマートライフプラン / 買電) characteristics
                    elif ("スマートライフ" in content_sample or "210014907779" in content_sample or "ご契約メニュー" in content_sample) and not usage_file:
                        usage_file = filepath
                        break
            except UnicodeDecodeError:
                continue

    return usage_file, export_file

def read_tepco_usage(filepath, target_tepco_month):
    if not filepath or not os.path.exists(filepath):
        return None, None, None
    try:
        for enc in ["cp932", "shift_jis", "utf-8"]:
            try:
                with open(filepath, "r", encoding=enc) as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if len(row) > 8 and row[3].strip() == target_tepco_month:
                            days = int(row[6].strip()) if row[6].strip().isdigit() else None
                            bill = int(row[7].replace(",", "").strip())
                            kwh = int(row[8].replace(",", "").strip())
                            return kwh, bill, days
            except UnicodeDecodeError:
                continue
    except Exception as e:
        print(f"Warning: Could not read usage CSV: {e}")
    return None, None, None

def read_tepco_export(filepath, target_tepco_month):
    if not filepath or not os.path.exists(filepath):
        return None, None, None
    try:
        for enc in ["cp932", "shift_jis", "utf-8"]:
            try:
                with open(filepath, "r", encoding=enc) as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if len(row) > 21 and row[3].strip() == target_tepco_month:
                            days = int(row[6].strip()) if row[6].strip().isdigit() else None
                            deposit = int(row[20].replace(",", "").strip())
                            kwh = int(row[21].replace(",", "").strip())
                            return deposit, kwh, days
            except UnicodeDecodeError:
                continue
    except Exception as e:
        print(f"Warning: Could not read export CSV: {e}")
    return None, None, None

def query_vm(query_str, end_ts):
    url = f"{VM_HOST}/api/v1/query"
    params = urllib.parse.urlencode({"query": query_str, "time": str(end_ts)})
    full_url = f"{url}?{params}"
    try:
        req = urllib.request.Request(full_url, headers={"User-Agent": "SolarFetcher/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results = data.get("data", {}).get("result", [])
            if results:
                total = sum(float(r.get("value", [0, 0])[1]) for r in results)
                return total
            return 0.0
    except Exception as e:
        print(f"Notice: VictoriaMetrics query ({url}): {e}")
        return 0.0


# --- Main Execution ---
def main():
    year, month, append_mode, force_mode = get_target_month()
    month_str = f"{year:04d}-{month:02d}"
    tepco_m_str = get_tepco_billing_month(year, month)

    now = datetime.now()
    is_current_month = (year == now.year and month == now.month)
    is_future_month = (year > now.year or (year == now.year and month > now.month))
    is_octopus_period = (month_str >= OCTOPUS_SWITCH_MONTH)

    if is_future_month:
        print(f"\n[ERROR] {month_str} is in the future. Cannot fetch data.")
        sys.exit(1)

    print("\n" + "=" * 65)
    print(f" Solar & Grid Metrics Fetcher")
    print(f" Target Month   : {month_str}" + (" (Month-to-Date / In Progress)" if is_current_month else " (Closed Month)"))
    print(f" Provider Mode  : {'Octopus Energy Japan (Kraken GraphQL)' if is_octopus_period else 'TEPCO Smart Life (Legacy CSV)'}")
    print("=" * 65)

    # 1. Grid Import & Electricity Bill (買電)
    grid_imported_kwh = None
    bill_jpy = None
    usage_source_note = ""

    if is_octopus_period:
        # Use Octopus Energy Japan Kraken GraphQL API
        print(f"\n[1/3] Querying Octopus Energy Japan GraphQL API...")
        # Determine query period
        start_dt = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
        if month == 12:
            month_end_dt = datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            month_end_dt = datetime(year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

        # If current month, clamp query to now
        query_end_dt = min(month_end_dt, datetime.now(timezone.utc))
        start_iso = start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        end_iso = query_end_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        try:
            client = OctopusClient()
            grid_imported_kwh, bill_jpy, intervals_count = client.fetch_monthly_grid_import(start_iso, end_iso)
            usage_source_note = f"Octopus API ({intervals_count} half-hourly intervals)"
            print(f"  -> Successfully fetched from Octopus API:")
            print(f"     Grid Imported : {grid_imported_kwh} kWh")
            print(f"     Calculated Bill: ¥{bill_jpy} (@ ¥{OCTOPUS_BASE_RATE} + ¥{RENEWABLE_SURCHARGE} surcharge, ¥0 base fee)")
        except Exception as e:
            print(f"  [ERROR] Octopus API query failed: {e}")
            if not force_mode:
                print("  Make sure OCTOPUS_EMAIL and OCTOPUS_PASSWORD (and OCTOPUS_ACCOUNT_NUMBER) are set in .env.")
                print("  To bypass or use manual entry, run with --force.")
                sys.exit(1)
            grid_imported_kwh = None
            bill_jpy = None
    else:
        # Legacy TEPCO CSV detection
        print(f"\n[1/3] Detecting local TEPCO Usage CSV for historical month...")
        usage_file, _ = auto_detect_tepco_files(year)
        if usage_file:
            print(f"  -> Detected: {usage_file}")
            tepco_kwh, tepco_bill, usage_days = read_tepco_usage(usage_file, tepco_m_str)
            if tepco_kwh is not None:
                grid_imported_kwh = tepco_kwh
                bill_jpy = tepco_bill
                usage_source_note = f"TEPCO CSV ({usage_days} billing days)"
            else:
                print(f"  [WARN] Record for billing cycle {tepco_m_str} not found in {usage_file}.")
        else:
            print("  [WARN] No TEPCO Usage CSV detected in repository.")

        if grid_imported_kwh is None and not force_mode:
            print(f"  Cannot proceed without historical TEPCO data for {month_str}. Use --force to override.")
            sys.exit(1)

    # 2. Solar Export Revenue (売電 / Surplus Sales)
    # The user maintains non-FIT surplus solar export sales with TEPCO (paid biannually)
    print(f"\n[2/3] Checking TEPCO Export CSV for non-FIT surplus sales...")
    _, export_file = auto_detect_tepco_files(year)
    export_deposit_jpy = 0
    tepco_export_kwh = None

    if export_file:
        print(f"  -> Detected Export CSV: {export_file}")
        dep, exp_kwh, exp_days = read_tepco_export(export_file, tepco_m_str)
        if dep is not None:
            export_deposit_jpy = dep
            tepco_export_kwh = exp_kwh
            print(f"  -> Export Statement: {exp_kwh} kWh, Accrued Deposit: ¥{dep}")
        else:
            print(f"  [INFO] TEPCO export record for {tepco_m_str} not yet listed in CSV.")
    else:
        print("  [INFO] No TEPCO Export CSV dropped for this period (accrued deposit set to ¥0).")

    # 3. VictoriaMetrics Query (Generation & CT Clamp Export)
    print(f"\n[3/3] Querying VictoriaMetrics for generation & CT clamp export...")
    start_dt = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
    if month == 12:
        month_end_dt = datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    else:
        month_end_dt = datetime(year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    # Clamp VictoriaMetrics time query to current time if month is in progress
    query_end_dt = min(month_end_dt, datetime.now(timezone.utc))
    duration_sec = int((query_end_dt - start_dt).total_seconds())
    end_ts = int(query_end_dt.timestamp())
    dur_str = f"{duration_sec}s"

    q_ep = f'integrate(echonet_solar_instantaneous_generation_watts{{device="epcube_solar"}}[{dur_str}]) / 3600000'
    epcube_kwh = query_vm(q_ep, end_ts)

    q_can = f'(integrate(homeassistant_sensor_power_w{{entity="sensor.inverter_canadian_energy_meter_0_power"}}[{dur_str}]) * 2) / 3600000'
    canadian_kwh = query_vm(q_can, end_ts)
    total_gen_kwh = epcube_kwh + canadian_kwh

    q_exp = f'integrate(clamp_min(-panasonic_power_watts{{entity="main"}}, 0)[{dur_str}]) / 3600000'
    export_kwh = query_vm(q_exp, end_ts)

    print(f"  -> Solar Generation : {total_gen_kwh:.1f} kWh (EP Cube: {epcube_kwh:.1f}, Canadian: {canadian_kwh:.1f})")
    print(f"  -> CT Main Export    : {export_kwh:.1f} kWh")

    # Day Rate Determination
    if is_octopus_period:
        # Simple Octopus flat 24/7 rate + renewable energy surcharge
        day_rate = OCTOPUS_TOTAL_DAY_RATE
    else:
        day_rate = MARGINAL_DAY_RATES.get(month_str, DEFAULT_BASE_DAY_RATE)

    # Values for CSV row
    kwh_val = f"{grid_imported_kwh}" if grid_imported_kwh is not None else "<IMPORT_KWH>"
    bill_val = f"{bill_jpy}" if bill_jpy is not None else "<BILL_JPY>"
    dep_val = f"{export_deposit_jpy}"

    csv_line = f"{month_str},{kwh_val},{bill_val},{total_gen_kwh:.1f},{export_kwh:.1f},{dep_val},{day_rate:.1f}"

    # Summary Display
    print("\n" + "=" * 65)
    print(f" Summary for {month_str}" + (" [MTD]" if is_current_month else ""))
    print("=" * 65)
    print(f" Provider         : {'Octopus Energy Japan (Simple Octopus)' if is_octopus_period else 'TEPCO Smart Life'}")
    print(f" Solar Generation : {total_gen_kwh:8.1f} kWh (EP: {epcube_kwh:.1f}, Canadian: {canadian_kwh:.1f})")
    print(f" Solar Exported   : {export_kwh:8.1f} kWh (TEPCO recorded: {tepco_export_kwh if tepco_export_kwh is not None else 'N/A'})")
    print(f" Grid Import      : {kwh_val:>8} kWh | Bill: ¥{bill_val} ({usage_source_note})")
    print(f" Export Revenue   : ¥{dep_val:>7} (Non-FIT biannual deposit accrued)")
    print(f" Avoided Day Rate : ¥{day_rate:>7.2f} / kWh")
    print("=" * 65)
    print("\nRow for data/history.csv:")
    print("-" * 65)
    print(csv_line)
    print("-" * 65)

    # Append / Update history.csv
    if append_mode and grid_imported_kwh is not None:
        history_path = os.path.join(os.path.dirname(__file__), "data", "history.csv")
        if os.path.exists(history_path):
            with open(history_path, "r", encoding="utf-8") as f:
                lines = [line.rstrip("\r\n") for line in f if line.strip()]

            updated = False
            for i, line in enumerate(lines):
                if line.startswith(f"{month_str},"):
                    lines[i] = csv_line
                    updated = True
                    break

            if not updated:
                lines.append(csv_line)

            with open(history_path, "w", encoding="utf-8") as f:
                f.write("\n".join(lines) + "\n")

            action_word = "Updated" if updated else "Appended"
            print(f"\n[SUCCESS] {action_word} row for {month_str} in {history_path}")
        else:
            print(f"\n[WARN] {history_path} does not exist.")
    elif append_mode:
        print("\n[SKIP] Could not append to data/history.csv because grid import data was missing.")

if __name__ == "__main__":
    main()
