"""Unit tests for the fetcher package."""

import csv
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from fetcher.history import HistoryRecord, read_history, upsert_history
from fetcher.tepco import parse_export_csv, tepco_billing_month
from fetcher.window import month_window, previous_month

JST = ZoneInfo("Asia/Tokyo")


class WindowTests(unittest.TestCase):
    def test_previous_month(self):
        self.assertEqual(previous_month(datetime(2026, 11, 4, tzinfo=JST)), "2026-10")
        self.assertEqual(previous_month(datetime(2027, 1, 15, tzinfo=JST)), "2026-12")

    def test_month_window_closed(self):
        fixed_now = datetime(2026, 11, 4, 12, 0, 0, tzinfo=JST)
        w = month_window("2026-10", JST, now=fixed_now)
        self.assertEqual(w.label, "2026-10")
        self.assertEqual(w.start, datetime(2026, 10, 1, 0, 0, 0, tzinfo=JST))
        self.assertEqual(w.end, datetime(2026, 11, 1, 0, 0, 0, tzinfo=JST))
        self.assertFalse(w.partial)
        self.assertEqual(w.seconds, 31 * 86400)

    def test_month_window_current_partial(self):
        fixed_now = datetime(2026, 11, 4, 15, 30, 0, tzinfo=JST)
        w = month_window("2026-11", JST, now=fixed_now)
        self.assertTrue(w.partial)
        self.assertEqual(w.start, datetime(2026, 11, 1, 0, 0, 0, tzinfo=JST))
        self.assertEqual(w.end, fixed_now)

    def test_month_window_validation(self):
        fixed_now = datetime(2026, 11, 4, tzinfo=JST)
        with self.assertRaises(ValueError):
            month_window("2026-13", JST, now=fixed_now)
        with self.assertRaises(ValueError):
            month_window("2026-12", JST, now=fixed_now)  # future month


class TepcoTests(unittest.TestCase):
    def test_billing_month(self):
        self.assertEqual(tepco_billing_month(2026, 4), "2026/05")
        self.assertEqual(tepco_billing_month(2026, 12), "2027/01")

    def test_parse_export_csv(self):
        with tempfile.NamedTemporaryFile("w", encoding="cp932", newline="", delete=False) as f:
            writer = csv.writer(f)
            # Construct standard 22+ column TEPCO export CSV row
            row = [""] * 25
            row[3] = "2026/05"
            row[6] = "30"
            row[20] = "8,338"
            row[21] = "952.2"
            writer.writerow(row)
            f_path = Path(f.name)

        try:
            parsed = parse_export_csv(f_path, "2026/05")
            self.assertIsNotNone(parsed)
            self.assertEqual(parsed.deposit_jpy, 8338)
            self.assertEqual(parsed.exported_kwh, 952.2)
            self.assertEqual(parsed.billing_days, 30)

            # Non-existent month
            self.assertIsNone(parse_export_csv(f_path, "2026/06"))
        finally:
            f_path.unlink()


class HistoryTests(unittest.TestCase):
    def test_formatting(self):
        rec = HistoryRecord(
            month="2026-11",
            grid_imported_kwh=120.0,
            bill_jpy=4250,
            solar_generated_kwh=1450.6,
            solar_exported_kwh=620.3,
            export_deposit_jpy=5200,
            assumed_day_rate_jpy=35.42,
        )
        self.assertEqual(
            rec.to_csv_row(),
            "2026-11,120,4250,1450.6,620.3,5200,35.42",
        )

    def test_upsert(self):
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as f:
            f.write("month,grid_imported_kwh,bill_jpy,solar_generated_kwh,solar_exported_kwh,export_deposit_jpy,assumed_day_rate_jpy\n")
            f.write("2026-03,228,10798,572.7,206.4,0,30.81\n")
            f.write("2026-05,32,1958,2115.8,1267.6,10880,32.64\n")
            f_path = Path(f.name)

        try:
            # 1. Insert 2026-04 (should be ordered between 03 and 05)
            rec_04 = HistoryRecord("2026-04", 73, 5442, 1592.1, 778.2, 833, 32.57)
            updated = upsert_history(f_path, rec_04)
            self.assertFalse(updated)

            rows = read_history(f_path)
            self.assertEqual([r["month"] for r in rows], ["2026-03", "2026-04", "2026-05"])

            # 2. Update 2026-03
            rec_03_updated = HistoryRecord("2026-03", 228, 10798, 572.7, 206.4, 500, 30.81)
            updated = upsert_history(f_path, rec_03_updated)
            self.assertTrue(updated)

            rows = read_history(f_path)
            self.assertEqual(rows[0]["export_deposit_jpy"], "500")
        finally:
            f_path.unlink()


if __name__ == "__main__":
    unittest.main()
