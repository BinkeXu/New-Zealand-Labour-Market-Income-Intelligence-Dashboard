"""
New Zealand Labour Market & Income Intelligence Dashboard
Data Processing & ETL Pipeline (process_data.py)

Author: NZ Labour Market Intelligence Team
Description:
    Processes raw MBIE Jobs Online CSV datasets, Stats NZ Income CSV datasets,
    and Stats NZ Census Population datasets located under `Dataset/active/` covering ALL 10
    New Zealand Labour Market Regions and all NZ cities, with working-age population filtering.
"""

import os
import sys
import json
import pandas as pd
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
    
    # Working-Age Population (15-64)
    df_work = df[
        (df['Census Year'] == latest_year) & 
        (df['Age group'] == '15-64')
    ].drop_duplicates(subset=['Region']).copy()
    
    raw_work_pop = {}
    for _, row in df_work.iterrows():
        reg_name = str(row['Region']).strip()
        val = int(row['Value'])
        raw_work_pop[reg_name] = val

    # Total Population (for reference)
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
            "working_age": raw_work_pop.get("Auckland", 956040),
            "total": raw_total_pop.get("Auckland", 1415550)
        },
        "Waikato": {
            "working_age": raw_work_pop.get("Waikato", 256584),
            "total": raw_total_pop.get("Waikato", 403638)
        },
        "Bay of Plenty": {
            "working_age": raw_work_pop.get("Bay of Plenty", 163146),
            "total": raw_total_pop.get("Bay of Plenty", 267744)
        },
        "Northland": {
            "working_age": raw_work_pop.get("Northland", 91176),
            "total": raw_total_pop.get("Northland", 151689)
        },
        "Gisborne/Hawkes Bay": {
            "working_age": raw_work_pop.get("Gisborne", 26799) + raw_work_pop.get("Hawke's Bay", 92823),
            "total": raw_total_pop.get("Gisborne", 43653) + raw_total_pop.get("Hawke's Bay", 151179)
        },
        "Manawatu-Whanganui/Taranaki": {
            "working_age": raw_work_pop.get("Manawatū-Whanganui", 139995) + raw_work_pop.get("Taranaki", 68667),
            "total": raw_total_pop.get("Manawatū-Whanganui", 222672) + raw_total_pop.get("Taranaki", 109608)
        },
        "Wellington": {
            "working_age": raw_work_pop.get("Wellington", 317043),
            "total": raw_total_pop.get("Wellington", 471315)
        },
        "Tasman/Nelson/Marlborough/West Coast": {
            "working_age": raw_work_pop.get("Tasman", 29262) + raw_work_pop.get("Nelson", 29586) + raw_work_pop.get("Marlborough", 26757) + raw_work_pop.get("West Coast", 20817),
            "total": raw_total_pop.get("Tasman", 47154) + raw_total_pop.get("Nelson", 46437) + raw_total_pop.get("Marlborough", 43416) + raw_total_pop.get("West Coast", 32148)
        },
        "Canterbury": {
            "working_age": raw_work_pop.get("Canterbury", 354900),
            "total": raw_total_pop.get("Canterbury", 539433)
        },
        "Otago/Southland": {
            "working_age": raw_work_pop.get("Otago", 135858) + raw_work_pop.get("Southland", 59529),
            "total": raw_total_pop.get("Otago", 202470) + raw_total_pop.get("Southland", 93342)
        }
    }
    
    return mbie_pop_map


def process_monthly_series() -> Dict[str, Any]:
    """Parses MBIE Jobs Online Monthly Series dataset (2007-2026)."""
    filepath = os.path.join(ACTIVE_DATA_DIR, "jol-monthly-unadjusted-series-from-may-2007-june-2026.csv")
    print(f"🔄 Processing Monthly Series from active folder: {filepath}")
    
    df = load_clean_monthly_series(filepath)
    dates = df['ACTUAL_DATE'].dt.strftime('%Y-%m').tolist()
    
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
    
    latest_row = df.iloc[-1]
    latest_date_str = latest_row['ACTUAL_DATE'].strftime('%B %Y')
    
    monthly_data = {
        "metadata": {
            "source": "MBIE Jobs Online Monthly Series (May 2007 - June 2026)",
            "last_updated": latest_date_str,
            "total_records": len(df),
            "start_date": dates[0],
            "end_date": dates[-1]
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


def process_regional_income() -> Dict[str, Any]:
    """
    Parses Stats NZ Income CSV dataset and merges with MBIE Consolidated Quarterly Vacancy Index
    and Stats NZ Working-Age Population dataset (Ages 15-64) for ALL 10 New Zealand regions.
    """
    population_map = load_population_data()
    
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
        pop_info = population_map.get(reg_name, {})
        work_pop = pop_info.get("working_age", None)
        tot_pop = pop_info.get("total", None)
        
        has_data = (vacancy_idx is not None) and (med_weekly is not None) and (work_pop is not None)
        
        if has_data:
            ann_income = calculate_annualized_income(med_weekly)
            hr_income = calculate_hourly_wage(med_weekly)
            vacancies_100k = calculate_vacancies_per_100k(vacancy_idx, work_pop)
            opp_score = calculate_opportunity_score(vacancy_idx, med_weekly, working_age_population=work_pop)
        else:
            ann_income = None
            hr_income = None
            vacancies_100k = None
            opp_score = None

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
            "annualized_income": ann_income,
            "hourly_income": hr_income,
            "opportunity_score": opp_score,
            "top_key_industries": ["IT", "Healthcare", "Business Services"] if reg_name in ['Auckland', 'Wellington'] else ["Construction", "Primary Industry", "Manufacturing"],
            "data_source_vacancy": "MBIE Jobs Online Quarterly Release (March 2026)",
            "data_source_income": f"Stats NZ Household Income Census ({latest_year})",
            "data_source_population": "Stats NZ Census Working-Age Population (Ages 15-64)"
        })
        
    national_weekly = raw_regional_incomes.get("Total Regions", 1380.0)
    output_data = {
        "metadata": {
            "source_vacancy": "MBIE Jobs Online Consolidated Quarterly Series (March 2026)",
            "source_income": f"Stats NZ Income Census ({latest_year})",
            "source_population": "Stats NZ Census Working-Age Population (Ages 15-64)",
            "income_year": int(latest_year),
            "national_median_weekly": national_weekly,
            "national_median_hourly": calculate_hourly_wage(national_weekly),
            "total_regions_covered": len(all_nz_regions)
        },
        "regions": regional_summary,
        "city_region_mapping": CITY_REGION_MAPPING
    }
    
    output_file = os.path.join(PUBLIC_DATA_DIR, "regional_summary.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"✅ Saved working-age population-adjusted regional summary for ALL {len(all_nz_regions)} NZ regions to {output_file}")
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
    """Parses detailed 4-digit ANZSCO occupation CSV from Dataset/active/."""
    filepath = os.path.join(ACTIVE_DATA_DIR, "jobs-online-detailed-occupational-data-march-2026-quarter.csv")
    print(f"🔄 Processing Detailed Occupation Dataset from active folder: {filepath}")
    
    df = load_csv_dataset(filepath)
    df['ACTUAL_DATE'] = pd.to_datetime(df['ACTUAL_DATE'], format='%d/%m/%Y', errors='coerce')
    df = df.dropna(subset=['ACTUAL_DATE'])
    latest_date = df['ACTUAL_DATE'].max()
    
    df_latest = df[df['ACTUAL_DATE'] == latest_date].copy()
    df_latest['ANNUAL_PERCENTAGE_CHANGE'] = pd.to_numeric(df_latest['ANNUAL_PERCENTAGE_CHANGE'], errors='coerce')
    
    df_sorted = df_latest.sort_values(by='ANNUAL_PERCENTAGE_CHANGE', ascending=False).dropna(subset=['ANNUAL_PERCENTAGE_CHANGE'])
    
    occupations_list = []
    for _, row in df_sorted.iterrows():
        title = str(row['ANZSCO_TITLE']).strip()
        code = str(row['ANZSCO_CODE'])
        change = sanitize_val(row['ANNUAL_PERCENTAGE_CHANGE'], None)
        
        salary_tier = "$75,000 - $120,000"
        hourly_tier = "$36.00 - $57.70 / hr"
        if any(kw in title.lower() for kw in ['executive', 'manager', 'director', 'engineer', 'architect', 'doctor']):
            salary_tier = "$110,000 - $175,000+"
            hourly_tier = "$52.88 - $84.13+ / hr"
        elif any(kw in title.lower() for kw in ['assistant', 'clerk', 'worker', 'labourer', 'receptionist']):
            salary_tier = "$55,000 - $75,000"
            hourly_tier = "$26.44 - $36.06 / hr"
            
        occupations_list.append({
            "code": code,
            "title": title,
            "annual_change_percent": change,
            "estimated_salary_range": salary_tier,
            "estimated_hourly_range": hourly_tier,
            "data_source": "MBIE Jobs Online Detailed ANZSCO Quarterly Data (March 2026)"
        })
        
    output_data = {
        "metadata": {
            "source": "MBIE Jobs Online Detailed ANZSCO Quarterly Release (March 2026)",
            "quarter": latest_date.strftime('%B %Y Quarter'),
            "total_occupations_tracked": len(occupations_list)
        },
        "top_growing_roles": occupations_list[:15],
        "all_occupations": occupations_list
    }
    
    output_file = os.path.join(PUBLIC_DATA_DIR, "detailed_occupations.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"✅ Saved detailed occupations to {output_file}")
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
                "nz_relocation_advice": "Auckland offers 60%+ of all tech openings, while Wellington leads in government tech/defence consulting."
            },
            {
                "id": "business_services",
                "label": "Business Services, HR & Marketing",
                "top_regions": ["Auckland", "Wellington", "Canterbury", "Waikato"],
                "median_salary": "$80,600 / yr ($1,550/wk • $38.75/hr)",
                "market_outlook": "Stable High Growth",
                "nz_relocation_advice": "Auckland has strong corporate headquarters demand; Wellington leads in public sector policy and legal roles."
            },
            {
                "id": "healthcare",
                "label": "Healthcare & Community Services",
                "top_regions": ["Auckland", "Canterbury", "Waikato", "Bay of Plenty", "Otago/Southland"],
                "median_salary": "$76,960 / yr ($1,480/wk • $37.00/hr)",
                "market_outlook": "Critical National Demand",
                "nz_relocation_advice": "Healthcare roles have high regional demand across all NZ Te Whatu Ora health districts with fast-track visa pathways."
            },
            {
                "id": "construction_engineering",
                "label": "Construction, Trades & Civil Engineering",
                "top_regions": ["Canterbury", "Auckland", "Waikato", "Manawatu-Whanganui/Taranaki"],
                "median_salary": "$73,840 / yr ($1,420/wk • $35.50/hr)",
                "market_outlook": "Strong Infrastructure Demand",
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
