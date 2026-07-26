"""
Unit Tests for Python ETL Calculators (test_calculators.py)

Tests domain metrics formulas:
- Working-Age Population-Adjusted Opportunity Score (Ages 15-64)
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
        # Vacancy Index = 100, Working-Age Population = 100,000 -> 100.0 vacancies per 100k working-age
        self.assertEqual(calculate_vacancies_per_100k(100.0, 100000), 100.0)
        self.assertIsNone(calculate_vacancies_per_100k(100.0, 0))

    def test_calculate_opportunity_score(self):
        # Working-Age Population-adjusted Opportunity Score
        # Vacancy = 100, Working-Age Pop = 100,000 (100 per 100k), Income = 1200 -> Score = (100/50) * (1200/1200) * 100 = 200.0
        self.assertEqual(calculate_opportunity_score(100.0, 1200.0, working_age_population=100000), 200.0)

    def test_calculate_yoy_growth(self):
        self.assertEqual(calculate_yoy_growth(110.0, 100.0), 10.0)

    def test_sanitize_val(self):
        self.assertEqual(sanitize_val(123.456), 123.46)


if __name__ == '__main__':
    unittest.main()
