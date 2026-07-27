"""
Unit Tests for Python ETL Calculators (test_calculators.py)

Tests domain metrics formulas:
- Working-Age Population-Adjusted Opportunity Score (Ages 15-64)
- Net Discretionary Income & Rent-Adjusted Purchasing Power Index
- Vacancies Per 100k Working-Age Population
- Hourly Wage
- Annualized Income
- YoY Growth
- Sanitization
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scripts.etl.calculators import (
    calculate_hourly_wage,
    calculate_annualized_income,
    calculate_vacancies_per_100k,
    calculate_net_discretionary_income,
    calculate_purchasing_power_index,
    calculate_opportunity_score,
    calculate_yoy_growth,
    sanitize_val
)


class TestCalculators(unittest.TestCase):

    def test_calculate_hourly_wage(self):
        self.assertEqual(calculate_hourly_wage(1400.0, 40.0), 35.0)
        self.assertEqual(calculate_hourly_wage(1496.0, 40.0), 37.4)
        self.assertIsNone(calculate_hourly_wage(0))

    def test_calculate_annualized_income(self):
        self.assertEqual(calculate_annualized_income(1000.0), 52000.0)

    def test_calculate_vacancies_per_100k(self):
        self.assertEqual(calculate_vacancies_per_100k(100.0, 100000), 100.0)
        self.assertIsNone(calculate_vacancies_per_100k(100.0, 0))

    def test_calculate_net_discretionary_income(self):
        # Wage = 1496, Rent = 553.75 -> Net = 942.25
        self.assertEqual(calculate_net_discretionary_income(1496.0, 553.75), 942.25)
        self.assertIsNone(calculate_net_discretionary_income(1000.0, 0))

    def test_calculate_purchasing_power_index(self):
        # Net Discretionary = 800 -> 100.0 pts
        self.assertEqual(calculate_purchasing_power_index(800.0), 100.0)

    def test_calculate_opportunity_score(self):
        self.assertEqual(calculate_opportunity_score(100.0, 1200.0, working_age_population=100000), 200.0)

    def test_calculate_yoy_growth(self):
        self.assertEqual(calculate_yoy_growth(110.0, 100.0), 10.0)

    def test_sanitize_val(self):
        self.assertEqual(sanitize_val(123.456), 123.46)


if __name__ == '__main__':
    unittest.main()
