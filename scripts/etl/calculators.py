"""
ETL Domain Metrics & Formula Calculators (calculators.py)

Contains pure mathematical domain functions for calculating:
- Working-Age Population-Adjusted Opportunity Score
- Net Discretionary Weekly Income & Real Rent-Adjusted Purchasing Power Index
- Vacancies Per 100k Working-Age Population (Ages 15-64)
- Hourly Wage (40-hour weekly baseline)
- Annualized Income
- Year-over-Year Growth Percentage
- Value sanitization
"""

import math
from typing import Optional, Any


def sanitize_val(val: Any, fallback: Optional[float] = None) -> Optional[float]:
    """Helper to ensure floating values are valid numbers or None for missing data."""
    if val is None:
        return fallback
    try:
        f_val = float(val)
        if math.isnan(f_val) or math.isinf(f_val):
            return fallback
        return round(f_val, 2)
    except (ValueError, TypeError):
        return fallback


def calculate_hourly_wage(weekly_income: float, hours_per_week: float = 40.0) -> Optional[float]:
    """Calculates hourly wage based on a standard weekly income and full-time baseline hours."""
    if weekly_income is None or weekly_income <= 0:
        return None
    return round(weekly_income / hours_per_week, 2)


def calculate_annualized_income(weekly_income: float, weeks_per_year: float = 52.0) -> Optional[float]:
    """Calculates annualized salary from weekly earnings."""
    if weekly_income is None or weekly_income <= 0:
        return None
    return round(weekly_income * weeks_per_year, 2)


def calculate_vacancies_per_100k(vacancy_index: float, working_age_population: int) -> Optional[float]:
    """
    Calculates vacancy density per 100,000 Working-Age residents (Ages 15-64).
    Vacancies Per 100k Working-Age = (Vacancy Index / Working Age Population) * 100,000
    """
    if vacancy_index is None or working_age_population is None or working_age_population <= 0:
        return None
    return round((vacancy_index / float(working_age_population)) * 100000.0, 2)


def calculate_net_discretionary_income(weekly_income: float, mean_weekly_rent: float) -> Optional[float]:
    """Calculates Net Discretionary Weekly Income after subtracting average weekly rent."""
    if weekly_income is None or mean_weekly_rent is None or weekly_income <= 0 or mean_weekly_rent <= 0:
        return None
    return round(weekly_income - mean_weekly_rent, 2)


def calculate_purchasing_power_index(net_discretionary_income: float, base_net_income: float = 800.0) -> Optional[float]:
    """Calculates Real Rent-Adjusted Purchasing Power Index relative to $800/wk net baseline."""
    if net_discretionary_income is None or net_discretionary_income <= 0:
        return None
    return round((net_discretionary_income / base_net_income) * 100.0, 2)


def calculate_opportunity_score(
    vacancy_index: float, 
    median_weekly_income: float, 
    working_age_population: Optional[int] = None,
    base_income: float = 1200.0
) -> Optional[float]:
    """
    Calculates the Working-Age Population-Adjusted New Zealand Regional Opportunity Score.
    Score = (Vacancies Per 100k Working-Age / 50.0) * (Median Weekly Income / Base Income) * 100
    """
    if vacancy_index is None or median_weekly_income is None:
        return None
        
    if working_age_population is not None and working_age_population > 0:
        vacancies_per_100k = (vacancy_index / float(working_age_population)) * 100000.0
        score = (vacancies_per_100k / 50.0) * (median_weekly_income / base_income) * 100.0
    else:
        score = (vacancy_index / 100.0) * (median_weekly_income / base_income) * 100.0
        
    return round(score, 2)


def calculate_yoy_growth(current_val: float, previous_val: float) -> Optional[float]:
    """Calculates Year-over-Year percentage growth."""
    if current_val is None or previous_val is None or previous_val <= 0:
        return None
    growth = ((current_val - previous_val) / previous_val) * 100.0
    return round(growth, 2)
