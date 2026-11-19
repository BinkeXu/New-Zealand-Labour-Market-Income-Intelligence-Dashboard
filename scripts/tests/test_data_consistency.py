"""
Cross-dataset and UI consistency regression tests.
Ensures production JSON datasets stay internally consistent and that
stale hardcoded figures do not reappear in key React components.
"""

import json
import os
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC_DATA = os.path.join(BASE_DIR, "public", "data")
SRC_DIR = os.path.join(BASE_DIR, "src")


class TestDataConsistency(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(PUBLIC_DATA, "regional_summary.json"), encoding="utf-8") as f:
            self.regional = json.load(f)
        with open(os.path.join(PUBLIC_DATA, "monthly_series.json"), encoding="utf-8") as f:
            self.monthly = json.load(f)
        with open(os.path.join(PUBLIC_DATA, "ird_income_distributions.json"), encoding="utf-8") as f:
            self.ird = json.load(f)

    def test_national_median_matches_population_weighted_regional_median(self):
        """Metadata national median ($1,380) should align within 1% of population-weighted regional medians."""
        meta_median = self.regional["metadata"]["national_median_weekly"]
        regions = self.regional["regions"]
        total_pop = sum(r["working_age_population"] for r in regions)
        weighted = sum(r["median_weekly_income"] * r["working_age_population"] for r in regions) / total_pop
        self.assertAlmostEqual(meta_median, weighted, delta=5.0)

    def test_regional_derived_rent_and_discretionary_fields(self):
        """Each region's net_discretionary_income and rent_to_income_pct must match wage and rent."""
        for r in self.regional["regions"]:
            wage = r["median_weekly_income"]
            rent = r["mean_weekly_rent"]
            expected_net = round(wage - rent, 1)
            self.assertAlmostEqual(r["net_discretionary_income"], expected_net, delta=0.5, msg=r["region_name"])

            expected_ratio = round((rent / wage) * 100, 1)
            self.assertAlmostEqual(r["rent_to_income_pct"], expected_ratio, delta=0.2, msg=r["region_name"])
            self.assertIsNotNone(r.get("unemployment_rate"), msg=f"Missing unemployment_rate for {r['region_name']}")

    def test_map_paths_cover_all_regions(self):
        """Every region in regional_summary.json must have a corresponding SVG path in nzRegionsPaths.js."""
        with open(os.path.join(SRC_DIR, "data", "nzRegionsPaths.js"), encoding="utf-8") as f:
            paths_js = f.read()
        for r in self.regional["regions"]:
            self.assertIn(f'"{r["region_name"]}"', paths_js)

    def test_no_stale_hardcoded_figures_in_overview_or_methodology(self):
        """Prevent regression to stale hardcoded Vacancy Index (115.7) or IRD taxpayer count (2.46M)."""
        with open(os.path.join(SRC_DIR, "components", "Overview.jsx"), encoding="utf-8") as f:
            overview_src = f.read()
        self.assertNotIn("115.7", overview_src)
        self.assertNotIn("2.46M", overview_src)

        with open(os.path.join(SRC_DIR, "components", "Methodology.jsx"), encoding="utf-8") as f:
            meth_src = f.read()
        self.assertNotIn("2.46 million", meth_src)
        self.assertNotIn("2.46M", meth_src)

    def test_front_page_kpi_and_map_use_same_national_median_source(self):
        """KPICards and NZRegionalMap must both derive National Median Wage from metadata.national_median_weekly."""
        with open(os.path.join(SRC_DIR, "components", "KPICards.jsx"), encoding="utf-8") as f:
            kpi_src = f.read()
        with open(os.path.join(SRC_DIR, "components", "NZRegionalMap.jsx"), encoding="utf-8") as f:
            map_src = f.read()
        with open(os.path.join(SRC_DIR, "components", "RegionalMatrix.jsx"), encoding="utf-8") as f:
            matrix_src = f.read()

        self.assertIn("national_median_weekly", kpi_src)
        self.assertIn("metadata={regionalData.metadata}", matrix_src)
        self.assertIn("nationalMedianWeekly", map_src)
        self.assertNotIn("avgWeeklyIncome", map_src)


if __name__ == "__main__":
    unittest.main()
