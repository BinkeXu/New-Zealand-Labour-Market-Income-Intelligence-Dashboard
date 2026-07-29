"""
New Zealand Labour Market & Income Intelligence Dashboard
Data Processing & ETL Pipeline (process_data.py)

Author: NZ Labour Market Intelligence Team
Description:
    Processes raw MBIE Jobs Online CSV datasets, Stats NZ Income CSV datasets,
    Stats NZ Census Population datasets, Stats NZ Rent datasets, Stats NZ HLFS Unemployment
    and Underutilisation datasets, and detailed 58-quarter ANZSCO Occupational series.
"""

import os
import sys
import json
import pandas as pd
import re
from typing import Dict, List, Any

# Root directory setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Dataset directory paths
DATASET_DIR = os.path.join(BASE_DIR, "Dataset")
ACTIVE_DATA_DIR = os.path.join(DATASET_DIR, "active")

if not os.path.exists(ACTIVE_DATA_DIR):
    ACTIVE_DATA_DIR = os.path.join(BASE_DIR, "datasets", "active")
if not os.path.exists(ACTIVE_DATA_DIR):
    ACTIVE_DATA_DIR = DATASET_DIR

PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "public", "data")
CONFIG_DIR = os.path.join(BASE_DIR, "scripts", "config")

from scripts.etl.calculators import (
    sanitize_val,
    calculate_hourly_wage,
    calculate_annualized_income,
    calculate_vacancies_per_100k,
    calculate_net_discretionary_income,
    calculate_purchasing_power_index,
    calculate_opportunity_score,
    calculate_yoy_growth
)
from scripts.etl.ingestion import load_clean_monthly_series, load_clean_quarterly_series, load_csv_dataset


def load_config() -> Dict[str, Any]:
    """Loads external ANZSIC benchmark configuration and city mappings."""
    config_file = os.path.join(CONFIG_DIR, "benchmarks.json")
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)


CONFIG = load_config()
CITY_REGION_MAPPING = CONFIG.get("city_region_mapping", {})
INDUSTRY_BENCHMARKS = CONFIG.get("industry_salaries", {})


def ensure_directories():
    """Ensure output directories exist."""
    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)
    print(f"📁 Output directory verified: {PUBLIC_DATA_DIR}")


def load_population_data() -> Dict[str, Dict[str, int]]:
    """
    Parses Census Population CSV dataset and calculates working-age (Ages 15-64)
    and total populations for all 10 MBIE Labour Market Regions.
    Excludes children under 15/18 and retirees over 65 to measure active labor supply.
    """
    filepath = os.path.join(ACTIVE_DATA_DIR, "Census_Population_by_age_by_Regional_Council_2001_2006_2013.csv")
    print(f"🔄 Processing Working-Age Population Dataset (Ages 15-64): {filepath}")
    
    df = load_csv_dataset(filepath)
    latest_year = df['Census Year'].max()
    
    df_work = df[
        (df['Census Year'] == latest_year) & 
        (df['Age group'] == '15-64')
    ].drop_duplicates(subset=['Region']).copy()
    
    raw_work_pop = {}
    for _, row in df_work.iterrows():
        reg_name = str(row['Region']).strip()
        val = int(row['Value'])
        raw_work_pop[reg_name] = val

    df_total = df[
        (df['Census Year'] == latest_year) & 
        (df['Age group'] == 'Total people')
    ].drop_duplicates(subset=['Region']).copy()
    
    raw_total_pop = {}
    for _, row in df_total.iterrows():
        reg_name = str(row['Region']).strip()
        val = int(row['Value'])
        raw_total_pop[reg_name] = val
        
    mbie_pop_map = {
        "Auckland": {
            "working_age": raw_work_pop["Auckland"],
            "total": raw_total_pop["Auckland"]
        },
        "Waikato": {
            "working_age": raw_work_pop["Waikato"],
            "total": raw_total_pop["Waikato"]
        },
        "Bay of Plenty": {
            "working_age": raw_work_pop["Bay of Plenty"],
            "total": raw_total_pop["Bay of Plenty"]
        },
        "Northland": {
            "working_age": raw_work_pop["Northland"],
            "total": raw_total_pop["Northland"]
        },
        "Gisborne/Hawkes Bay": {
            "working_age": raw_work_pop["Gisborne"] + raw_work_pop["Hawke's Bay"],
            "total": raw_total_pop["Gisborne"] + raw_total_pop["Hawke's Bay"]
        },
        "Manawatu-Whanganui/Taranaki": {
            "working_age": raw_work_pop["Manawatū-Whanganui"] + raw_work_pop["Taranaki"],
            "total": raw_total_pop["Manawatū-Whanganui"] + raw_total_pop["Taranaki"]
        },
        "Wellington": {
            "working_age": raw_work_pop["Wellington"],
            "total": raw_total_pop["Wellington"]
        },
        "Tasman/Nelson/Marlborough/West Coast": {
            "working_age": raw_work_pop["Tasman"] + raw_work_pop["Nelson"] + raw_work_pop["Marlborough"] + raw_work_pop["West Coast"],
            "total": raw_total_pop["Tasman"] + raw_total_pop["Nelson"] + raw_total_pop["Marlborough"] + raw_total_pop["West Coast"]
        },
        "Canterbury": {
            "working_age": raw_work_pop["Canterbury"],
            "total": raw_total_pop["Canterbury"]
        },
        "Otago/Southland": {
            "working_age": raw_work_pop["Otago"] + raw_work_pop["Southland"],
            "total": raw_total_pop["Otago"] + raw_total_pop["Southland"]
        }
    }
    
    return mbie_pop_map


def load_regional_rent_data() -> Dict[str, float]:
    """Parses Stats NZ / MBIE Tenancy Services mean weekly rent CSV dataset (2026 Release)."""
    filepath = os.path.join(ACTIVE_DATA_DIR, "mean_weekly_rent.csv")
    print(f"🔄 Processing Regional Rent Dataset: {filepath}")
    
    df = load_csv_dataset(filepath)
    latest_year = df[df['units'] == 'dollars']['year'].max()
    df_rent = df[(df['year'] == latest_year) & (df['units'] == 'dollars')]
    
    rent_map = dict(zip(df_rent['area'], df_rent['value']))
    
    mbie_rent_map = {
        "Auckland": rent_map["Auckland"],
        "Waikato": rent_map["Waikato"],
        "Bay of Plenty": rent_map["Bay of Plenty"],
        "Northland": rent_map["Northland"],
        "Gisborne/Hawkes Bay": round((rent_map["Gisborne"] + rent_map["Hawke's Bay"]) / 2.0, 2),
        "Manawatu-Whanganui/Taranaki": round((rent_map["Manawatu-Wanganui"] + rent_map["Taranaki"]) / 2.0, 2),
        "Wellington": rent_map["Wellington"],
        "Tasman/Nelson/Marlborough/West Coast": round((rent_map["Tasman"] + rent_map["Nelson"] + rent_map["Marlborough"] + rent_map["West Coast"]) / 4.0, 2),
        "Canterbury": rent_map["Canterbury"],
        "Otago/Southland": round((rent_map["Otago"] + rent_map["Southland"]) / 2.0, 2)
    }
    
    return mbie_rent_map


def load_hlfs_labor_slack_metrics() -> Dict[str, Any]:
    """Parses Stats NZ HLFS Unemployment & Underutilisation rate datasets (March 2012 - March 2026 Quarters)."""
    filepath_unemp = os.path.join(ACTIVE_DATA_DIR, "unemployment_rate_by_sex.csv")
    filepath_under = os.path.join(ACTIVE_DATA_DIR, "underutilisation_rate_by_sex.csv")
    
    print(f"🔄 Processing Historical HLFS Time Series (57 Quarters): {filepath_unemp}")
    
    df_unemp = load_csv_dataset(filepath_unemp)
    df_under = load_csv_dataset(filepath_under)
    
    unemp_series = []
    for _, row in df_unemp.iterrows():
        unemp_series.append({
            "quarter": str(row['Quarter']),
            "total": float(row['Total']),
            "men": float(row['Men']),
            "women": float(row['Women'])
        })

    under_series = []
    for _, row in df_under.iterrows():
        under_series.append({
            "quarter": str(row['Quarter']),
            "total": float(row['Total']),
            "men": float(row['Men']),
            "women": float(row['Women'])
        })
    
    if df_unemp.empty or df_under.empty:
        raise ValueError("Empty dataset after cleaning")
        
    latest_unemp = df_unemp.iloc[-1]
    latest_under = df_under.iloc[-1]
    
    return {
        "quarter": str(latest_unemp['Quarter']),
        "unemployment_rate": {
            "total": float(latest_unemp['Total']),
            "men": float(latest_unemp['Men']),
            "women": float(latest_unemp['Women'])
        },
        "underutilisation_rate": {
            "total": float(latest_under['Total']),
            "men": float(latest_under['Men']),
            "women": float(latest_under['Women'])
        },
        "historical_unemployment": unemp_series,
        "historical_underutilisation": under_series
    }


def process_monthly_series() -> Dict[str, Any]:
    """Parses MBIE Jobs Online Monthly Series dataset (2007-2026)."""
    filepath = os.path.join(ACTIVE_DATA_DIR, "jol-monthly-unadjusted-series-from-may-2007-june-2026.csv")
    print(f"🔄 Processing Monthly Series from active folder: {filepath}")
    
    df = load_clean_monthly_series(filepath)
    dates = df['ACTUAL_DATE'].dt.strftime('%Y-%m').tolist()
    
    hlfs_metrics = load_hlfs_labor_slack_metrics()
    
    monthly_regions = ['Auckland', 'Wellington', 'North Island Other', 'Canterbury', 'South Island Other']
    industries = ['Business services', 'Construction', 'Education', 'Health care', 
                  'Hospitality', 'IT', 'Manufacturing', 'Primary', 'Sales', 'Other']
    occupations = [
        'Managers', 'Professionals', 'Technicians and Trades Workers',
        'Community and Personal Service Workers', 'Clerical and Administrative Workers',
        'Sales Workers', 'Machinery Operators and Drivers', 'Labourers'
    ]
    skill_levels = ['Highly-Skilled', 'Skilled', 'Semi-Skilled', 'Low-Skilled', 'Unskilled']
    
    totals = [sanitize_val(v, 100.0) for v in df['TOTALS'].tolist()]
    annual_change = [sanitize_val(v, 0.0) for v in df['ANNUAL_CHANGE'].tolist()]
    
    region_series = {r: [sanitize_val(v, 100.0) for v in df[r].tolist()] for r in monthly_regions if r in df.columns}
    industry_series = {ind: [sanitize_val(v, 100.0) for v in df[ind].tolist()] for ind in industries if ind in df.columns}
    occupation_series = {occ: [sanitize_val(v, 100.0) for v in df[occ].tolist()] for occ in occupations if occ in df.columns}
    skill_series = {sk: [sanitize_val(v, 100.0) for v in df[sk].tolist()] for sk in skill_levels if sk in df.columns}
    
    if df.empty:
        raise ValueError("Empty dataset after cleaning")
        
    latest_row = df.iloc[-1]
    latest_date_str = latest_row['ACTUAL_DATE'].strftime('%B %Y')
    
    monthly_data = {
        "metadata": {
            "source": "MBIE Jobs Online Monthly Series (May 2007 - June 2026)",
            "last_updated": latest_date_str,
            "total_records": len(df),
            "start_date": dates[0],
            "end_date": dates[-1],
            "hlfs_labor_metrics": hlfs_metrics
        },
        "dates": dates,
        "totals": totals,
        "annual_change": annual_change,
        "regions": region_series,
        "industries": industry_series,
        "occupations": occupation_series,
        "skills": skill_series,
        "city_region_mapping": CITY_REGION_MAPPING
    }
    
    output_file = os.path.join(PUBLIC_DATA_DIR, "monthly_series.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(monthly_data, f, indent=2)
        
    print(f"✅ Saved monthly series to {output_file}")
    return monthly_data


def extract_national_income_distribution(df_inc: pd.DataFrame, latest_year: int) -> Dict[str, Any]:
    """Extracts national income source breakdown, ethnic distribution, gender distribution, quintile benchmarks, and 28-year historical income growth."""
    df_nat = df_inc[(df_inc['Region'] == 'Total Regions')].copy()
    
    df_hist_inc = df_nat[
        (df_nat['Income Source'] == 'Wage and Salary Income') & 
        (df_nat['Sex'] == 'Total Both Sexes') & 
        (df_nat['Ethnic Group'] == 'Total Ethnic Groups') & 
        (df_nat['Measure'] == 'Median Weekly Income')
    ].sort_values(by='Year')
    
    historical_income_series = []
    for _, row in df_hist_inc.iterrows():
        yr = int(row['Year'])
        val = sanitize_val(row['OBS_VALUE'], None)
        if val:
            historical_income_series.append({
                "year": yr,
                "median_weekly": val,
                "median_hourly": calculate_hourly_wage(val),
                "annualized": calculate_annualized_income(val)
            })

    df_nat_latest = df_nat[df_nat['Year'] == latest_year].copy()
    
    sources_list = []
    source_names = [
        ('Wage and Salary Income', 'Primary employment wages & salaries', '#4f46e5', 'Includes PAYE wages, salaries, bonuses, and overtime pay.'),
        ('Self-employment Income', 'Business owner & sole trader net earnings', '#059669', 'Includes net profit/earnings from business ownership, partnership, and sole trading.'),
        ('Government Transfer Income', 'Superannuation, benefits & student allowances', '#d97706', 'Includes NZ Superannuation, Jobseeker Support, Sole Parent Support, Accommodation Supplement, and Student Allowances.'),
        ('All sources collected', 'Combined total income from all sources', '#0284c7', 'Total aggregate income across wages, self-employment, transfers, investments, and pensions.')
    ]
    
    for src_key, src_desc, src_color, src_note in source_names:
        sub_med = df_nat_latest[
            (df_nat_latest['Income Source'] == src_key) & 
            (df_nat_latest['Sex'] == 'Total Both Sexes') & 
            (df_nat_latest['Ethnic Group'] == 'Total Ethnic Groups') & 
            (df_nat_latest['Measure'] == 'Median Weekly Income')
        ]
        sub_avg = df_nat_latest[
            (df_nat_latest['Income Source'] == src_key) & 
            (df_nat_latest['Sex'] == 'Total Both Sexes') & 
            (df_nat_latest['Ethnic Group'] == 'Total Ethnic Groups') & 
            (df_nat_latest['Measure'] == 'Average Weekly Income')
        ]
        sub_cnt = df_nat_latest[
            (df_nat_latest['Income Source'] == src_key) & 
            (df_nat_latest['Sex'] == 'Total Both Sexes') & 
            (df_nat_latest['Ethnic Group'] == 'Total Ethnic Groups') & 
            (df_nat_latest['Measure'] == 'Number of People (000)')
        ]
        
        med_val = sanitize_val(sub_med['OBS_VALUE'].values[0], None) if len(sub_med) > 0 else None
        avg_val = sanitize_val(sub_avg['OBS_VALUE'].values[0], None) if len(sub_avg) > 0 else None
        cnt_val = sanitize_val(sub_cnt['OBS_VALUE'].values[0], None) if len(sub_cnt) > 0 else None
        
        # 28-Year Historical Time Series for this specific income source
        df_src_hist = df_nat[
            (df_nat['Income Source'] == src_key) & 
            (df_nat['Sex'] == 'Total Both Sexes') & 
            (df_nat['Ethnic Group'] == 'Total Ethnic Groups') & 
            (df_nat['Measure'] == 'Median Weekly Income')
        ].sort_values(by='Year')
        
        src_history = []
        for _, hrow in df_src_hist.iterrows():
            h_yr = int(hrow['Year'])
            h_val = sanitize_val(hrow['OBS_VALUE'], None)
            if h_val:
                src_history.append({
                    "year": h_yr,
                    "median_weekly": h_val,
                    "median_hourly": calculate_hourly_wage(h_val),
                    "annualized": calculate_annualized_income(h_val)
                })

        sources_list.append({
            "source_name": src_key,
            "description": src_desc,
            "color": src_color,
            "policy_note": src_note,
            "median_weekly": med_val,
            "median_hourly": calculate_hourly_wage(med_val) if med_val else None,
            "annualized_median": calculate_annualized_income(med_val) if med_val else None,
            "average_weekly": avg_val,
            "average_hourly": calculate_hourly_wage(avg_val) if avg_val else None,
            "annualized_average": calculate_annualized_income(avg_val) if avg_val else None,
            "people_count_thousands": cnt_val,
            "historical_series": src_history
        })
        
    ethnic_groups = ['European', 'Other Ethnicity', 'MELAA', 'Asian', 'Māori', 'Pacific Peoples']
    ethnicity_list = []
    for eth in ethnic_groups:
        sub_eth = df_nat_latest[
            (df_nat_latest['Income Source'] == 'Wage and Salary Income') & 
            (df_nat_latest['Sex'] == 'Total Both Sexes') & 
            (df_nat_latest['Ethnic Group'] == eth) & 
            (df_nat_latest['Measure'] == 'Median Weekly Income')
        ]
        val = sanitize_val(sub_eth['OBS_VALUE'].values[0], None) if len(sub_eth) > 0 else None
        ethnicity_list.append({
            "ethnic_group": eth,
            "median_weekly": val,
            "median_hourly": calculate_hourly_wage(val) if val else None
        })
        
    gender_list = []
    for s_name in ['Male', 'Female', 'Total Both Sexes']:
        sub_gen = df_nat_latest[
            (df_nat_latest['Income Source'] == 'Wage and Salary Income') & 
            (df_nat_latest['Sex'] == s_name) & 
            (df_nat_latest['Ethnic Group'] == 'Total Ethnic Groups') & 
            (df_nat_latest['Measure'] == 'Median Weekly Income')
        ]
        val = sanitize_val(sub_gen['OBS_VALUE'].values[0], None) if len(sub_gen) > 0 else None
        gender_list.append({
            "sex": s_name,
            "median_weekly": val,
            "median_hourly": calculate_hourly_wage(val) if val else None
        })

    quintiles = [
        {"tier": "Tier 1 (Lower 20% / Entry-Level)", "weekly_range": "< $650 / wk", "hourly_range": "< $16.25 / hr", "annual_range": "< $33,800 / yr", "description": "Entry-level trainees, part-time workers & apprentices"},
        {"tier": "Tier 2 (Lower-Mid 20-40%)", "weekly_range": "$650 - $1,100 / wk", "hourly_range": "$16.25 - $27.50 / hr", "annual_range": "$33,800 - $57,200 / yr", "description": "Customer support, administrative & entry service roles"},
        {"tier": "Tier 3 (National Median 50%)", "weekly_range": "$1,380 / wk", "hourly_range": "$34.50 / hr", "annual_range": "$71,760 / yr", "description": "New Zealand national median wage benchmark (Stats NZ 2025)"},
        {"tier": "Tier 4 (Upper-Mid 60-80%)", "weekly_range": "$1,400 - $1,850 / wk", "hourly_range": "$35.00 - $46.25 / hr", "annual_range": "$72,800 - $96,200 / yr", "description": "Mid-level software engineers, nurses & qualified trades"},
        {"tier": "Tier 5 (Top 20% / Executive & Tech Lead)", "weekly_range": "$2,000+ / wk", "hourly_range": "$50.00+ / hr", "annual_range": "$104,000+ / yr", "description": "Senior IT architects, medical specialists & executive heads"}
    ]

    return {
        "income_sources": sources_list,
        "ethnicity_distribution": ethnicity_list,
        "gender_distribution": gender_list,
        "income_quintiles": quintiles,
        "historical_income_series": historical_income_series
    }


def process_regional_income() -> Dict[str, Any]:
    """
    Parses Stats NZ Income CSV dataset, Rent dataset, Population dataset, and MBIE Vacancy dataset
    to calculate regional income, rent, net discretionary income, and real purchasing power for ALL 10 regions.
    """
    population_map = load_population_data()
    rent_map = load_regional_rent_data()
    
    filepath_income = os.path.join(ACTIVE_DATA_DIR, "Income by sex, region, ethnic groups and income source.csv")
    print(f"🔄 Processing Regional Income Dataset from active folder: {filepath_income}")
    
    df_inc = load_csv_dataset(filepath_income)
    
    df_filtered = df_inc[
        (df_inc['Income Source'] == 'Wage and Salary Income') &
        (df_inc['Sex'] == 'Total Both Sexes') &
        (df_inc['Ethnic Group'] == 'Total Ethnic Groups') &
        (df_inc['Measure'] == 'Median Weekly Income')
    ].copy()
    
    latest_year = df_filtered['Year'].max()
    df_latest = df_filtered[df_filtered['Year'] == latest_year]
    
    national_distribution = extract_national_income_distribution(df_inc, latest_year)
    
    raw_regional_incomes = {}
    for _, row in df_latest.iterrows():
        raw_reg = str(row['Region'])
        val = sanitize_val(row['OBS_VALUE'], None)
        if val is not None:
            raw_regional_incomes[raw_reg] = val

    mbie_income_map = {
        "Auckland": raw_regional_incomes.get("Auckland Region", 1438.0),
        "Waikato": raw_regional_incomes.get("Waikato Region", 1304.0),
        "Bay of Plenty": raw_regional_incomes.get("Bay of Plenty Region", 1296.0),
        "Northland": raw_regional_incomes.get("Northland Region", 1305.0),
        "Gisborne/Hawkes Bay": raw_regional_incomes.get("Gisborne/Hawkes Bay Regions", 1343.0),
        "Manawatu-Whanganui/Taranaki": round((raw_regional_incomes.get("Manawatu-Wanganui Region", 1280.0) + raw_regional_incomes.get("Taranaki Region", 1408.0)) / 2.0, 2),
        "Wellington": raw_regional_incomes.get("Wellington Region", 1496.0),
        "Tasman/Nelson/Marlborough/West Coast": raw_regional_incomes.get("Nelson/Tasman/Marlborough/West Coast Regions", 1253.0),
        "Canterbury": raw_regional_incomes.get("Canterbury Region", 1343.0),
        "Otago/Southland": round((raw_regional_incomes.get("Otago Region", 1360.0) + raw_regional_incomes.get("Southland", 1254.0)) / 2.0, 2)
    }

    filepath_quarterly = os.path.join(ACTIVE_DATA_DIR, "jobs-online-all-unadjusted-quarterly-data-consolidated-march-2026.csv")
    print(f"🔄 Processing MBIE Quarterly Regional Vacancies from active folder: {filepath_quarterly}")
    df_q = load_clean_quarterly_series(filepath_quarterly)
    
    latest_q_date = df_q['ACTUAL_DATE'].max()
    df_q_totals = df_q[(df_q['KEYA'] == 'Totals') & (df_q['ACTUAL_DATE'] == latest_q_date)]
    
    regional_summary = []
    all_nz_regions = [
        "Auckland", "Waikato", "Bay of Plenty", "Northland", 
        "Gisborne/Hawkes Bay", "Manawatu-Whanganui/Taranaki", "Wellington", 
        "Tasman/Nelson/Marlborough/West Coast", "Canterbury", "Otago/Southland"
    ]
    
    island_map = {
        "Auckland": "North Island",
        "Waikato": "North Island",
        "Bay of Plenty": "North Island",
        "Northland": "North Island",
        "Gisborne/Hawkes Bay": "North Island",
        "Manawatu-Whanganui/Taranaki": "North Island",
        "Wellington": "North Island",
        "Tasman/Nelson/Marlborough/West Coast": "South Island",
        "Canterbury": "South Island",
        "Otago/Southland": "South Island"
    }

    for reg_name in all_nz_regions:
        reg_row = df_q_totals[df_q_totals['KEYBB'] == reg_name]
        vacancy_idx = sanitize_val(reg_row['AVI_SUM'].values[0], None) if len(reg_row) > 0 else None
        
        med_weekly = mbie_income_map.get(reg_name, None)
        mean_rent = rent_map.get(reg_name, None)
        pop_info = population_map.get(reg_name, {})
        work_pop = pop_info.get("working_age", None)
        tot_pop = pop_info.get("total", None)
        
        has_data = (vacancy_idx is not None) and (med_weekly is not None) and (work_pop is not None)
        
        if has_data:
            ann_income = calculate_annualized_income(med_weekly)
            hr_income = calculate_hourly_wage(med_weekly)
            vacancies_100k = calculate_vacancies_per_100k(vacancy_idx, work_pop)
            opp_score = calculate_opportunity_score(vacancy_idx, med_weekly, working_age_population=work_pop)
            net_discretionary = calculate_net_discretionary_income(med_weekly, mean_rent)
            purchasing_power_idx = calculate_purchasing_power_index(net_discretionary)
        else:
            ann_income = None
            hr_income = None
            vacancies_100k = None
            opp_score = None
            net_discretionary = None
            purchasing_power_idx = None

        regional_summary.append({
            "region_name": reg_name,
            "island": island_map.get(reg_name, "New Zealand"),
            "cities_included": CITY_REGION_MAPPING.get(reg_name, []),
            "working_age_population": work_pop,
            "total_population": tot_pop,
            "vacancies_per_100k": vacancies_100k,
            "has_data": has_data,
            "vacancy_index": vacancy_idx,
            "median_weekly_income": med_weekly,
            "mean_weekly_rent": mean_rent,
            "net_discretionary_income": net_discretionary,
            "purchasing_power_index": purchasing_power_idx,
            "annualized_income": ann_income,
            "hourly_income": hr_income,
            "opportunity_score": opp_score,
            "top_key_industries": ["IT", "Healthcare", "Business Services"] if reg_name in ['Auckland', 'Wellington'] else ["Construction", "Primary Industry", "Manufacturing"],
            "data_source_vacancy": "MBIE Jobs Online Quarterly Release (March 2026)",
            "data_source_income": f"Stats NZ Household Income Census ({latest_year})",
            "data_source_rent": "Stats NZ / MBIE Tenancy Services Mean Weekly Rent (2026)",
            "data_source_population": "Stats NZ Census Working-Age Population (Ages 15-64)"
        })
        
    national_weekly = raw_regional_incomes.get("Total Regions", 1380.0)
    output_data = {
        "metadata": {
            "source_vacancy": "MBIE Jobs Online Consolidated Quarterly Series (March 2026)",
            "source_income": f"Stats NZ Income Census ({latest_year})",
            "source_rent": "Stats NZ Mean Weekly Rent (2026)",
            "source_population": "Stats NZ Census Working-Age Population (Ages 15-64)",
            "income_year": int(latest_year),
            "national_median_weekly": national_weekly,
            "national_median_hourly": calculate_hourly_wage(national_weekly),
            "total_regions_covered": len(all_nz_regions)
        },
        "regions": regional_summary,
        "national_income_distribution": national_distribution,
        "city_region_mapping": CITY_REGION_MAPPING
    }
    
    output_file = os.path.join(PUBLIC_DATA_DIR, "regional_summary.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"✅ Saved population-adjusted regional summary for ALL {len(all_nz_regions)} NZ regions to {output_file}")
    return output_data


def process_city_industry_breakdown() -> Dict[str, Any]:
    """
    Parses MBIE Jobs Online Consolidated Quarterly dataset from Dataset/active/ to compute
    the exact vacancy index and YoY growth for EACH industry in EACH New Zealand region/city.
    """
    filepath = os.path.join(ACTIVE_DATA_DIR, "jobs-online-all-unadjusted-quarterly-data-consolidated-march-2026.csv")
    print(f"🔄 Processing Industry Vacancies per City/Region from active folder: {filepath}")
    
    df = load_clean_quarterly_series(filepath)
    latest_q_date = df['ACTUAL_DATE'].max()
    
    dates = sorted(df['ACTUAL_DATE'].unique())
    prev_year_date = dates[-5] if len(dates) >= 5 else dates[0]
    
    industries = ['Business services', 'Construction', 'Education', 'Health care', 
                  'Hospitality', 'IT', 'Manufacturing', 'Primary', 'Sales', 'Other']
                  
    all_nz_regions = [
        "Auckland", "Waikato", "Bay of Plenty", "Northland", 
        "Gisborne/Hawkes Bay", "Manawatu-Whanganui/Taranaki", "Wellington", 
        "Tasman/Nelson/Marlborough/West Coast", "Canterbury", "Otago/Southland"
    ]
    
    df_latest = df[df['ACTUAL_DATE'] == latest_q_date]
    df_prev = df[df['ACTUAL_DATE'] == prev_year_date]
    
    breakdown_list = []
    
    for reg_name in all_nz_regions:
        for ind in industries:
            curr_row = df_latest[(df_latest['KEYA'] == reg_name) & (df_latest['KEYBB'] == ind)]
            prev_row = df_prev[(df_prev['KEYA'] == reg_name) & (df_prev['KEYBB'] == ind)]
            
            curr_idx = sanitize_val(curr_row['AVI_SUM'].values[0], None) if len(curr_row) > 0 else None
            prev_idx = sanitize_val(prev_row['AVI_SUM'].values[0], None) if len(prev_row) > 0 else None
            
            yoy_growth = calculate_yoy_growth(curr_idx, prev_idx)
            
            salary = INDUSTRY_BENCHMARKS.get(ind, {'weekly': 1250, 'annual': 65000, 'description': 'General Sector'})
            hourly = calculate_hourly_wage(salary['weekly'])
            
            breakdown_list.append({
                "region_name": reg_name,
                "cities_included": CITY_REGION_MAPPING.get(reg_name, []),
                "industry": ind,
                "current_vacancy_index": curr_idx,
                "prev_year_vacancy_index": prev_idx,
                "yoy_growth_percent": yoy_growth,
                "median_weekly_income": salary['weekly'],
                "hourly_income": hourly,
                "data_source": "MBIE Jobs Online Quarterly Release (March 2026)"
            })
            
    output_data = {
        "metadata": {
            "source": "MBIE Jobs Online Consolidated Industry Series per Region (March 2026)",
            "total_matrix_cells": len(breakdown_list)
        },
        "city_industry_matrix": breakdown_list,
        "industries": industries,
        "regions": all_nz_regions
    }
    
    output_file = os.path.join(PUBLIC_DATA_DIR, "city_industry_vacancies.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"✅ Saved industry vacancy matrix per city/region ({len(breakdown_list)} cells) to {output_file}")
    return output_data


def process_industry_matrix() -> Dict[str, Any]:
    """Combines MBIE industry vacancy growth with ANZSIC industry median income data."""
    filepath_monthly = os.path.join(ACTIVE_DATA_DIR, "jol-monthly-unadjusted-series-from-may-2007-june-2026.csv")
    df_monthly = load_clean_monthly_series(filepath_monthly)
    
    industries = ['Business services', 'Construction', 'Education', 'Health care', 
                  'Hospitality', 'IT', 'Manufacturing', 'Primary', 'Sales', 'Other']
    
    if df_monthly.empty:
        raise ValueError("Empty dataset after cleaning")
        
    latest_row = df_monthly.iloc[-1]
    prev_year_row = df_monthly.iloc[-13] if len(df_monthly) >= 13 else df_monthly.iloc[0]
    
    matrix = []
    
    for ind in industries:
        if ind in latest_row:
            current_idx = sanitize_val(latest_row[ind], None)
            prev_idx = sanitize_val(prev_year_row[ind], current_idx)
            
            yoy_growth = calculate_yoy_growth(current_idx, prev_idx)
                
            salary = INDUSTRY_BENCHMARKS.get(ind, {'weekly': 1250, 'annual': 65000, 'description': 'General Sector'})
            hourly = calculate_hourly_wage(salary['weekly'])
            
            high_salary = salary['weekly'] >= 1400
            high_growth = (yoy_growth is not None) and (yoy_growth >= 0.0)
            
            if high_salary and high_growth:
                quadrant = "Star (High Growth & High Income)"
                recommendation = "Top priority target for high career progression & compensation in NZ."
            elif high_growth and not high_salary:
                quadrant = "High Demand (High Volume & Accessible Entry)"
                recommendation = "Excellent entry opportunities with rapid hiring demand across NZ regions."
            elif high_salary and not high_growth:
                quadrant = "High Salary / Specialized Niche"
                recommendation = "High-earning sector; requires targeted networking and specialized skills."
            else:
                quadrant = "Stable / Moderate Growth"
                recommendation = "Steady sector; focus on upskilling to stand out among applicants."
                
            matrix.append({
                "industry": ind,
                "current_vacancy_index": current_idx,
                "yoy_growth_percent": yoy_growth,
                "median_weekly_income": salary['weekly'],
                "annualized_income": salary['annual'],
                "hourly_income": hourly,
                "description": salary['description'],
                "quadrant": quadrant,
                "recommendation": recommendation,
                "data_source": "MBIE Jobs Online & Stats NZ ANZSIC Earnings"
            })
            
    output_data = {
        "metadata": {
            "source": "MBIE Vacancy Series & Stats NZ Income Benchmarks (June 2026)",
            "last_updated": "June 2026"
        },
        "industry_matrix": matrix
    }
    
    output_file = os.path.join(PUBLIC_DATA_DIR, "industry_matrix.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"✅ Saved industry matrix to {output_file}")
    return output_data


def process_detailed_occupations() -> Dict[str, Any]:
    """Parses detailed 4-digit ANZSCO occupation CSV and extracts 58-quarter historical time series for each role."""
    filepath = os.path.join(ACTIVE_DATA_DIR, "jobs-online-detailed-occupational-data-march-2026-quarter.csv")
    print(f"🔄 Processing Detailed Occupation Dataset with 58-quarter history & INZ Green List tags: {filepath}")
    
    df = load_csv_dataset(filepath)
    df['ACTUAL_DATE'] = pd.to_datetime(df['ACTUAL_DATE'], format='%d/%m/%Y', errors='coerce')
    initial_len = len(df)
    df = df.dropna(subset=['ACTUAL_DATE'])
    dropped_count = initial_len - len(df)
    if dropped_count > 0:
        print(f"⚠️ Dropped {dropped_count} rows missing ACTUAL_DATE")
    
    latest_date = df['ACTUAL_DATE'].max()
    df_latest = df[df['ACTUAL_DATE'] == latest_date].copy()
    df_latest['ANNUAL_PERCENTAGE_CHANGE'] = pd.to_numeric(df_latest['ANNUAL_PERCENTAGE_CHANGE'], errors='coerce')
    
    df_sorted = df_latest.sort_values(by='ANNUAL_PERCENTAGE_CHANGE', ascending=False).dropna(subset=['ANNUAL_PERCENTAGE_CHANGE'])
    
    green_list_tier1_keywords = ['developer', 'software', 'programmer', 'analyst', 'ict manager', 'architect', 'engineer', 'doctor', 'nurse', 'general practitioner', 'civil']
    green_list_tier2_keywords = ['network engineer', 'support engineer', 'technician', 'plumber', 'electrician', 'mechanic']

    # Pre-group historical data by ANZSCO_CODE
    df_grouped = df.groupby('ANZSCO_CODE')

    occupations_list = []
    for _, row in df_sorted.iterrows():
        title = str(row['ANZSCO_TITLE']).strip()
        code = str(row['ANZSCO_CODE'])
        change = sanitize_val(row['ANNUAL_PERCENTAGE_CHANGE'], None)
        
        title_lower = title.lower()
        
        inz_tier = None
        if any(re.search(rf'\b({re.escape(kw)})\b', title_lower) for kw in green_list_tier1_keywords):
            inz_tier = "Tier 1 (Straight to Residence)"
        elif any(re.search(rf'\b({re.escape(kw)})\b', title_lower) for kw in green_list_tier2_keywords):
            inz_tier = "Tier 2 (Work to Residence)"
            
        salary_tier = "$75,000 - $120,000"
        hourly_tier = "$36.00 - $57.70 / hr"
        if any(kw in title_lower for kw in ['executive', 'manager', 'director', 'engineer', 'architect', 'doctor']):
            salary_tier = "$110,000 - $175,000+"
            hourly_tier = "$52.88 - $84.13+ / hr"
        elif any(kw in title_lower for kw in ['assistant', 'clerk', 'worker', 'labourer', 'receptionist']):
            salary_tier = "$55,000 - $75,000"
            hourly_tier = "$26.44 - $36.06 / hr"
            
        # Extract historical quarters for this specific ANZSCO role
        role_history = []
        if code in df_grouped.groups:
            role_df = df_grouped.get_group(code).sort_values(by='ACTUAL_DATE')
            for _, r_row in role_df.iterrows():
                r_date = r_row['ACTUAL_DATE'].strftime('%b %Y')
                r_change = sanitize_val(r_row['ANNUAL_PERCENTAGE_CHANGE'], 0.0)
                role_history.append({
                    "date": r_date,
                    "annual_change": r_change
                })

        occupations_list.append({
            "code": code,
            "title": title,
            "annual_change_percent": change,
            "estimated_salary_range": salary_tier,
            "estimated_hourly_range": hourly_tier,
            "inz_green_list_tier": inz_tier,
            "historical_quarters": role_history,
            "data_source": "MBIE Jobs Online Detailed ANZSCO & Immigration NZ Green List (March 2026)"
        })
        
    output_data = {
        "metadata": {
            "source": "MBIE Jobs Online Detailed ANZSCO & INZ Green List Release (March 2026)",
            "quarter": latest_date.strftime('%B %Y Quarter'),
            "total_occupations_tracked": len(occupations_list)
        },
        "top_growing_roles": occupations_list[:15],
        "all_occupations": occupations_list
    }
    
    output_file = os.path.join(PUBLIC_DATA_DIR, "detailed_occupations.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"✅ Saved detailed occupations with 58-quarter history & INZ Green List tags to {output_file}")
    return output_data


def generate_career_pathfinder_rules():
    """Generates decision logic rules for the NZ Career Pathfinder interactive guide."""
    rules = {
        "target_industries": [
            {
                "id": "it_tech",
                "label": "IT, Software & Data Analytics",
                "top_regions": ["Auckland", "Wellington", "Canterbury"],
                "median_salary": "$96,200 / yr ($1,850/wk • $46.25/hr)",
                "market_outlook": "High Demand",
                "inz_visa_status": "🟢 INZ Green List Tier 1 (Straight to Residence)",
                "nz_relocation_advice": "Auckland offers 60%+ of all tech openings, while Wellington leads in government tech/defence consulting."
            },
            {
                "id": "business_services",
                "label": "Business Services, HR & Marketing",
                "top_regions": ["Auckland", "Wellington", "Canterbury", "Waikato"],
                "median_salary": "$80,600 / yr ($1,550/wk • $38.75/hr)",
                "market_outlook": "Stable High Growth",
                "inz_visa_status": "Standard Skilled Pathway",
                "nz_relocation_advice": "Auckland has strong corporate headquarters demand; Wellington leads in public sector policy and legal roles."
            },
            {
                "id": "healthcare",
                "label": "Healthcare & Community Services",
                "top_regions": ["Auckland", "Canterbury", "Waikato", "Bay of Plenty", "Otago/Southland"],
                "median_salary": "$76,960 / yr ($1,480/wk • $37.00/hr)",
                "market_outlook": "Critical National Demand",
                "inz_visa_status": "🟢 INZ Green List Tier 1 (Straight to Residence)",
                "nz_relocation_advice": "Healthcare roles have high regional demand across all NZ Te Whatu Ora health districts with fast-track visa pathways."
            },
            {
                "id": "construction_engineering",
                "label": "Construction, Trades & Civil Engineering",
                "top_regions": ["Canterbury", "Auckland", "Waikato", "Manawatu-Whanganui/Taranaki"],
                "median_salary": "$73,840 / yr ($1,420/wk • $35.50/hr)",
                "market_outlook": "Strong Infrastructure Demand",
                "inz_visa_status": "🟢 INZ Green List Tier 1 / Tier 2",
                "nz_relocation_advice": "Christchurch/Canterbury and regional South Island have massive ongoing civil infrastructure rebuild & renewable energy projects."
            }
        ],
        "career_level_guidance": {
            "entry_level": {
                "title": "Junior / Entry-Level Job Seeker Strategy",
                "key_advice": "Focus on high-growth demand sectors (IT, Healthcare, Business Services). Build a portfolio showing real NZ problem solving. Consider regional centers like Canterbury where living costs are lower relative to starting salaries."
            },
            "mid_level": {
                "title": "Mid-Level Professional Strategy",
                "key_advice": "Target Auckland and Wellington for maximum salary leverage and specialized technical roles. Benchmark your income against Stats NZ median industry rates ($35.00 - $46.25/hr)."
            },
            "senior_level": {
                "title": "Senior / Leadership Strategy",
                "key_advice": "Focus on ANZSCO Major Group 1 (Managers) & Group 2 (Professionals). Auckland accounts for the highest concentration of executive compensation ($52.00+/hr), followed by Wellington public sector heads."
            }
        }
    }
    
    output_file = os.path.join(PUBLIC_DATA_DIR, "career_pathfinder_rules.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(rules, f, indent=2)
        
    print(f"✅ Saved career pathfinder rules to {output_file}")


def main():
    print("🚀 Starting New Zealand Labour Market Data Processing Pipeline...")
    ensure_directories()
    process_monthly_series()
    process_regional_income()
    process_city_industry_breakdown()
    process_industry_matrix()
    process_detailed_occupations()
    generate_career_pathfinder_rules()
    print("🎉 ETL Data Processing Pipeline completed successfully!")


if __name__ == "__main__":
    main()
