
from scripts.etl.config import ACTIVE_DATA_DIR, PUBLIC_DATA_DIR, CONFIG_DIR, CITY_REGION_MAPPING, INDUSTRY_BENCHMARKS, ARCHIVE_OTHER_DIR, CONFIG
"""
ETL Vacancy Pipeline Module (vacancies.py)

Processes MBIE Jobs Online monthly series, city-industry vacancy matrices, and 4-digit ANZSCO detailed occupations.
"""

import os
import logging
import json
import re
import math
import pandas as pd
from typing import Dict, List, Any
from scripts.etl.ingestion import load_clean_monthly_series, load_clean_quarterly_series, load_csv_dataset
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
from scripts.etl.income import load_population_data, load_regional_rent_data

logger = logging.getLogger(__name__)


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
    
    pop_map = load_population_data()
    regional_wages = {
        "Auckland": 1438.0, "Waikato": 1320.0, "Bay of Plenty": 1290.0, "Northland": 1210.0,
        "Gisborne/Hawkes Bay": 1230.0, "Manawatu-Whanganui/Taranaki": 1240.0, "Wellington": 1496.0,
        "Tasman/Nelson/Marlborough/West Coast": 1220.0, "Canterbury": 1343.0, "Otago/Southland": 1280.0
    }
    
    industry_shares = CONFIG.get("industry_regional_shares", {})
    
    df_latest = df[df['ACTUAL_DATE'] == latest_q_date]
    df_prev = df[df['ACTUAL_DATE'] == prev_year_date]
    
    breakdown_list = []
    
    for reg_name in all_nz_regions:
        w_pop = pop_map.get(reg_name, {}).get("working_age", 300000)
        reg_wage = regional_wages.get(reg_name, 1380.0)
        wage_factor = reg_wage / 1380.0
        
        for ind in industries:
            curr_row = df_latest[(df_latest['KEYA'] == reg_name) & (df_latest['KEYBB'] == ind)]
            prev_row = df_prev[(df_prev['KEYA'] == reg_name) & (df_prev['KEYBB'] == ind)]
            
            curr_idx = sanitize_val(curr_row['AVI_SUM'].values[0], None) if len(curr_row) > 0 else None
            prev_idx = sanitize_val(prev_row['AVI_SUM'].values[0], None) if len(prev_row) > 0 else None
            
            yoy_growth = calculate_yoy_growth(curr_idx, prev_idx)
            
            salary = INDUSTRY_BENCHMARKS.get(ind, {'weekly': 1250, 'annual': 65000, 'description': 'General Sector'})
            effective_weekly = salary['weekly'] * wage_factor
            hourly = calculate_hourly_wage(effective_weekly)
            
            # Calibrate opportunity score using regional industry volume share weight
            ind_share = industry_shares.get(ind, {}).get(reg_name, 0.10)
            opp_score = round(((curr_idx or 0) * (ind_share / 0.10)) * (effective_weekly / 1200.0), 2) if curr_idx else None
            
            breakdown_list.append({
                "region_name": reg_name,
                "cities_included": CITY_REGION_MAPPING.get(reg_name, []),
                "industry": ind,
                "current_vacancy_index": curr_idx,
                "prev_year_vacancy_index": prev_idx,
                "yoy_growth_percent": yoy_growth,
                "median_weekly_income": round(effective_weekly, 2),
                "hourly_income": hourly,
                "opportunity_score": opp_score,
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
            opp_score = calculate_opportunity_score(current_idx, salary['weekly'])
            
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
                "opportunity_score": opp_score,
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
        mid_hourly = 45.0
        if any(kw in title_lower for kw in ['executive', 'manager', 'director', 'engineer', 'architect', 'doctor']):
            salary_tier = "$110,000 - $175,000+"
            hourly_tier = "$52.88 - $84.13+ / hr"
            mid_hourly = 60.0
        elif any(kw in title_lower for kw in ['assistant', 'clerk', 'worker', 'labourer', 'receptionist']):
            salary_tier = "$55,000 - $75,000"
            hourly_tier = "$26.44 - $36.06 / hr"
            mid_hourly = 30.0

        # Calculate ANZSCO opportunity score
        baseline_idx = max(20.0, 100.0 + (change or 0.0) * 3)
        opp_score = calculate_opportunity_score(baseline_idx, mid_hourly * 40.0)
            
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
            "opportunity_score": opp_score,
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


