"""Manage web/data/history.csv reading, updating, and formatting."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

COLUMNS = [
    "month",
    "grid_imported_kwh",
    "bill_jpy",
    "solar_generated_kwh",
    "solar_exported_kwh",
    "export_deposit_jpy",
    "assumed_day_rate_jpy",
]


@dataclass(frozen=True)
class HistoryRecord:
    month: str
    grid_imported_kwh: float
    bill_jpy: int
    solar_generated_kwh: float
    solar_exported_kwh: float
    export_deposit_jpy: int
    assumed_day_rate_jpy: float

    def to_csv_row(self) -> str:
        grid_val = float(self.grid_imported_kwh)
        grid_str = (
            f"{int(grid_val)}"
            if grid_val.is_integer()
            else f"{grid_val:.1f}"
        )
        return (
            f"{self.month},"
            f"{grid_str},"
            f"{int(self.bill_jpy)},"
            f"{self.solar_generated_kwh:.1f},"
            f"{self.solar_exported_kwh:.1f},"
            f"{int(self.export_deposit_jpy)},"
            f"{self.assumed_day_rate_jpy:.2f}"
        )


def read_history(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [row for row in reader if row.get("month")]


def upsert_history(path: Path, record: HistoryRecord) -> bool:
    """Insert or update a month record in history.csv, maintaining month sort order.

    Returns True if an existing row was updated, False if appended.
    """
    rows = read_history(path)
    updated = False
    new_rows = []

    for row in rows:
        if row["month"] == record.month:
            updated = True
        else:
            new_rows.append(row)

    # Convert record to dict matching COLUMNS
    grid_val = float(record.grid_imported_kwh)
    grid_str = (
        f"{int(grid_val)}"
        if grid_val.is_integer()
        else f"{grid_val:.1f}"
    )
    rec_dict = {
        "month": record.month,
        "grid_imported_kwh": grid_str,
        "bill_jpy": str(int(record.bill_jpy)),
        "solar_generated_kwh": f"{record.solar_generated_kwh:.1f}",
        "solar_exported_kwh": f"{record.solar_exported_kwh:.1f}",
        "export_deposit_jpy": str(int(record.export_deposit_jpy)),
        "assumed_day_rate_jpy": f"{record.assumed_day_rate_jpy:.2f}",
    }
    new_rows.append(rec_dict)
    new_rows.sort(key=lambda r: r["month"])

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(new_rows)

    return updated
