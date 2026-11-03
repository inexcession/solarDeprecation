"""CLI entry point for solar and grid metrics fetcher."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime

from .config import HISTORY_PATH, FetchError, load
from .history import HistoryRecord, upsert_history
from .octopus import fetch_usage
from .tepco import parse_export_csv, tepco_billing_month
from .vm import fetch_solar
from .window import month_window, previous_month

HISTORICAL_DAY_RATES = {
    "2026-03": 30.81,
    "2026-04": 32.57,
    "2026-05": 32.64,
    "2026-06": 32.75,
    "2026-07": 29.67,
    "2026-08": 28.98,
    "2026-09": 30.64,
    "2026-10": 34.61,
}


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch monthly solar generation, export, and electricity consumption metrics."
    )
    parser.add_argument(
        "month",
        nargs="?",
        help="Target month in YYYY-MM format (default: previous calendar month in JST)",
    )
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append or update the record in web/data/history.csv",
    )
    parser.add_argument(
        "--tepco-export",
        metavar="PATH",
        help="Path to TEPCO export CSV file (to parse surplus solar export deposit)",
    )
    parser.add_argument(
        "--grid-import",
        type=float,
        metavar="KWH",
        help="Override or manually supply grid import kWh",
    )
    parser.add_argument(
        "--bill",
        type=int,
        metavar="JPY",
        help="Override or manually supply grid bill in JPY",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    try:
        settings = load()
        now = datetime.now(settings.tz)
        target_month = args.month or previous_month(now)
        window = month_window(target_month, settings.tz, now=now)

        year, month = map(int, window.label.split("-"))
        is_octopus = window.label >= settings.octopus_start_month

        print("=" * 60)
        print(f" Solar & Grid Metrics Fetcher: {window.label}")
        print(f" Period : {window.start.strftime('%Y-%m-%d %H:%M %Z')} -> {window.end.strftime('%Y-%m-%d %H:%M %Z')}")
        print(f" Status : {'Month-to-Date (partial)' if window.partial else 'Complete Month'}")
        print(f" Mode   : {'Octopus Energy Japan (Kraken API)' if is_octopus else 'Historical TEPCO'}")
        print("=" * 60)

        # 1. VictoriaMetrics Solar Generation & CT Clamp Export
        print("\n[1/3] Querying VictoriaMetrics...")
        solar = fetch_solar(settings.vm_host, window)
        print(f"  Solar Generated : {solar.generated_kwh:.1f} kWh (EP Cube: {solar.epcube_kwh:.1f}, Canadian: {solar.canadian_kwh:.1f})")
        print(f"  CT Clamp Export : {solar.exported_kwh:.1f} kWh")

        # 2. Grid Import & Electricity Bill
        print("\n[2/3] Resolving Grid Import & Electricity Bill...")
        if args.grid_import is not None and args.bill is not None:
            grid_kwh = args.grid_import
            bill_jpy = args.bill
            print(f"  Using manual override: {grid_kwh} kWh, ¥{bill_jpy}")
        elif is_octopus:
            usage = fetch_usage(settings, window)
            grid_kwh = usage.imported_kwh
            bill_jpy = usage.calculated_bill_jpy
            print(f"  Octopus API ({usage.intervals_count} intervals): {grid_kwh} kWh, ¥{bill_jpy}")
            if usage.cost_estimate_jpy:
                print(f"  (API costEstimate sum: ¥{round(usage.cost_estimate_jpy)})")
        else:
            raise FetchError(
                f"{window.label} is before the Octopus switch month ({settings.octopus_start_month}). "
                "Provide historical data with --grid-import KWH --bill JPY."
            )

        # 3. Surplus Export Revenue (売電)
        print("\n[3/3] Checking Surplus Export Revenue...")
        export_deposit_jpy = 0
        if args.tepco_export:
            billing_m = tepco_billing_month(year, month)
            parsed = parse_export_csv(args.tepco_export, billing_m)
            if parsed:
                export_deposit_jpy = parsed.deposit_jpy
                print(f"  Parsed TEPCO CSV ({parsed.billing_month}): {parsed.exported_kwh:.1f} kWh, ¥{parsed.deposit_jpy}")
            else:
                print(f"  No record found in {args.tepco_export} for TEPCO billing month {billing_m} (deposit: ¥0)")
        else:
            print("  No TEPCO export CSV supplied (deposit: ¥0)")

        # Daytime rate determination
        day_rate = settings.octopus_day_rate if is_octopus else HISTORICAL_DAY_RATES.get(window.label, settings.octopus_day_rate)

        record = HistoryRecord(
            month=window.label,
            grid_imported_kwh=grid_kwh,
            bill_jpy=bill_jpy,
            solar_generated_kwh=solar.generated_kwh,
            solar_exported_kwh=solar.exported_kwh,
            export_deposit_jpy=export_deposit_jpy,
            assumed_day_rate_jpy=day_rate,
        )

        print("\n" + "-" * 60)
        print(" CSV Row Preview:")
        print(f" {record.to_csv_row()}")
        print("-" * 60)

        if args.append:
            updated = upsert_history(HISTORY_PATH, record)
            action = "Updated" if updated else "Appended"
            print(f"\n[SUCCESS] {action} {record.month} in {HISTORY_PATH}")
        else:
            print("\n[DRY RUN] Pass --append to write to web/data/history.csv")

        return 0

    except FetchError as e:
        print(f"\n[ERROR] {e}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nAborted.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
