"""
Unit Tests for IRD Income Percentile & Distribution Pipeline (test_ird_income.py)

Verifies:
1. Ingestion of 2026 tax year individual PAYE wage and salary data.
2. Official Decile benchmarks (50th percentile / median = $61,958).
3. High-Earner Percentiles (Top 10% = $134,568, Top 1% = $289,186).
4. Total NZ wage earner count (2.84 million).
5. 10-bracket histogram completeness.
"""

import os
import sys
import unittest
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scripts.etl.income import process_ird_income_distributions
from scripts.etl.config import PUBLIC_DATA_DIR


class TestIrdIncome(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Run processor to ensure latest JSON deliverable is generated
        cls.data = process_ird_income_distributions()

    def test_metadata_structure(self):
        """Verifies IRD metadata contains 2026 tax year and official earner counts."""
        meta = self.data.get("metadata", {})
        self.assertEqual(meta.get("tax_year"), 2026)
        self.assertEqual(meta.get("total_wage_earners"), 2840300)
        self.assertEqual(meta.get("total_wage_earners_2026_millions"), "2.84")
        self.assertIn("2026 PAYE Final Release", meta.get("last_updated", ""))

    def test_all_deciles_present(self):
        """Verifies that all 9 deciles (10th to 90th percentile) are present."""
        deciles = self.data.get("deciles", [])
        self.assertEqual(len(deciles), 9)
        decile_nums = [d["decile"] for d in deciles]
        self.assertEqual(decile_nums, list(range(1, 10)))

    def test_national_median_decile_5(self):
        """Verifies the 2026 national median wage boundary ($61,958)."""
        deciles = self.data.get("deciles", [])
        median_decile = next(d for d in deciles if d["decile"] == 5)
        # Annual boundary is $61,957.92 -> round to $61,958
        self.assertAlmostEqual(median_decile["annual_boundary_2026"], 61957.92, places=1)
        self.assertAlmostEqual(median_decile["annual_boundary"], 61957.92, places=1)
        # Weekly boundary is ~$1,191.50
        self.assertAlmostEqual(median_decile["weekly_boundary_2026"], 1191.50, places=1)

    def test_top_decile_thresholds(self):
        """Verifies the Top 20% ($103,897) and Top 10% ($134,568) thresholds."""
        deciles = self.data.get("deciles", [])
        d8 = next(d for d in deciles if d["decile"] == 8)
        d9 = next(d for d in deciles if d["decile"] == 9)

        self.assertAlmostEqual(d8["annual_boundary_2026"], 103896.50, places=1)
        self.assertAlmostEqual(d9["annual_boundary_2026"], 134568.00, places=1)

    def test_top_percentiles_present(self):
        """Verifies high-earner percentiles 91 through 99."""
        top_p = self.data.get("top_percentiles", [])
        self.assertEqual(len(top_p), 9)
        p_nums = [p["percentile"] for p in top_p]
        self.assertEqual(p_nums, list(range(91, 100)))

        # Top 5% (95th percentile)
        p95 = next(p for p in top_p if p["percentile"] == 95)
        self.assertAlmostEqual(p95["annual_boundary_2026"], 169365.41, places=1)

        # Top 1% (99th percentile)
        p99 = next(p for p in top_p if p["percentile"] == 99)
        self.assertAlmostEqual(p99["annual_boundary_2026"], 289185.87, places=1)

    def test_income_histogram_completeness(self):
        """Verifies that 10 brackets exist in the histogram."""
        histogram = self.data.get("income_histogram", [])
        self.assertEqual(len(histogram), 10)
        total_pct = sum(b["percentage_of_earners"] for b in histogram)
        # Total percentage across buckets should be ~100%
        self.assertGreater(total_pct, 99.0)
        self.assertLessEqual(total_pct, 101.0)


if __name__ == '__main__':
    unittest.main()
