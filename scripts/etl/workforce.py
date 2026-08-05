from scripts.etl.config import ACTIVE_DATA_DIR, PUBLIC_DATA_DIR, CONFIG_DIR, CITY_REGION_MAPPING, INDUSTRY_BENCHMARKS, ARCHIVE_OTHER_DIR, CONFIG
import pandas as pd
import json
import os
import math
import re
from typing import Dict, Any, List
from scripts.etl.ingestion import load_csv_dataset, load_clean_quarterly_series
from scripts.etl.calculators import sanitize_val

def process_job_volumes(leed_path, geo_path, output_path, benchmarks_path):
    print("Loading geographic units (Business Demography) dataset...")
    geo_df = pd.read_csv(geo_path, low_memory=False)
    
    print("Loading LEED dataset...")
    leed_df = pd.read_csv(leed_path, low_memory=False)

    print("Loading benchmarks configuration...")
    with open(benchmarks_path, 'r', encoding='utf-8') as f:
        benchmarks = json.load(f)

    # ---------------------------------------------------------
    # 1. PROCESS INDUSTRY SIZE (From Geographic Units)
    # ---------------------------------------------------------
    # Filter for the most recent year available
    max_year = geo_df['year'].max()
    geo_latest = geo_df[geo_df['year'] == max_year].copy()
    
    # We map ANZSIC06 letter codes to our dashboard categories
    anzsic_division_map = {
        'A': 'Primary', 'B': 'Primary',
        'C': 'Manufacturing',
        'D': 'Other',
        'E': 'Construction',
        'F': 'Sales', 'G': 'Sales',
        'H': 'Hospitality',
        'I': 'Other',
        'J': 'IT',
        'K': 'Business services', 'L': 'Business services', 'M': 'Business services', 'N': 'Business services',
        'O': 'Other',
        'P': 'Education',
        'Q': 'Health care',
        'R': 'Other',
        'S': 'Other'
    }
    
    # Map division to dashboard industry
    geo_latest['Dashboard_Industry'] = geo_latest['anzsic06'].map(anzsic_division_map)
    geo_latest = geo_latest.dropna(subset=['Dashboard_Industry'])
    
    # Convert ec_count to numeric, coercing errors
    geo_latest['ec_count'] = pd.to_numeric(geo_latest['ec_count'], errors='coerce').fillna(0)
    
    # Sum the employee counts by Dashboard Industry to get Total National Size
    industry_sizes = geo_latest.groupby('Dashboard_Industry')['ec_count'].sum().to_dict()
    
    # ---------------------------------------------------------
    # 2. PROCESS ANNUAL TURNOVER RATE (From LEED)
    # ---------------------------------------------------------
    # Map LEED industries to dashboard categories
    leed_industry_map = {
        'Manufacturing': 'Manufacturing',
        'Health care and social assistance': 'Health care',
        'Professional, scientific, technical services, administrative, and support services': 'Business services',
        'Transport, storage, information media, and telecommunications': 'IT',
        'Education and training': 'Education',
        'Financial, insurance, rental, hiring, and real estate services': 'Business services',
        'Wholesale trade': 'Sales',
        'Accommodation and food services': 'Hospitality',
        'Agriculture, forestry, and fishing': 'Primary',
        'Mining, electricity, gas, water, and waste services; and construction': 'Construction',
        'Retail trade': 'Sales'
    }
    
    leed_df['Dashboard_Industry'] = leed_df['Industry'].map(leed_industry_map)
    leed_mapped = leed_df.dropna(subset=['Dashboard_Industry']).copy()
    
    # Get the latest quarter available in the dataset
    max_quarter = leed_mapped['QUARTER_LEED_Q3W_016'].max()
    
    leed_mapped['Observation value'] = pd.to_numeric(leed_mapped['Observation value'], errors='coerce').fillna(0)
    
    latest_leed = leed_mapped[leed_mapped['QUARTER_LEED_Q3W_016'] == max_quarter]
    
    industry_turnover = {}
    
    for industry, group in latest_leed.groupby('Dashboard_Industry'):
        # Get total separations
        separations = group[group['Measure'] == 'Worker separations']['Observation value'].sum()
        # Get total filled jobs
        filled_jobs = group[group['Measure'] == 'Total filled jobs']['Observation value'].sum()
        
        if filled_jobs > 0:
            quarterly_turnover = separations / filled_jobs
            annual_turnover = quarterly_turnover * 4
            # Cap at realistic levels
            industry_turnover[industry] = min(annual_turnover, 0.80)
        else:
            industry_turnover[industry] = 0.15 
            
    default_turnover = 0.15

    # ---------------------------------------------------------
    # 3. GENERATE JOB VOLUME ESTIMATES
    # ---------------------------------------------------------
    seniority_distribution = {
        "Junior": 0.20,
        "Intermediate": 0.45,
        "Senior": 0.25,
        "Lead / Executive": 0.10
    }
    
    regional_shares = benchmarks.get('industry_regional_shares', {})
    
    volume_estimates = {
        "metadata": {
            "source": "Stats NZ LEED & Business Demography",
            "description": "Absolute job volume estimates extrapolated from official employee counts and turnover rates."
        },
        "industries": {}
    }
    
    for ind in benchmarks.get('industry_salaries', {}).keys():
        total_workforce = industry_sizes.get(ind, 100000) 
        turnover_rate = industry_turnover.get(ind, default_turnover)
        
        annual_vacancies_national = total_workforce * turnover_rate
        
        vol_ind = {
            "total_national_workforce": int(total_workforce),
            "annual_turnover_rate_percent": round(turnover_rate * 100, 1),
            "estimated_annual_vacancies_national": int(annual_vacancies_national),
            "regions": {}
        }
        
        region_dist = regional_shares.get(ind, {})
        for region, share in region_dist.items():
            regional_vacancies = annual_vacancies_national * share
            
            levels_data = {}
            for level, dist_share in seniority_distribution.items():
                level_vacancies = regional_vacancies * dist_share
                levels_data[level] = int(level_vacancies)
                
            vol_ind["regions"][region] = {
                "estimated_regional_vacancies": int(regional_vacancies),
                "levels": levels_data
            }
            
        volume_estimates["industries"][ind] = vol_ind
        
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(volume_estimates, f, indent=2)
        
    print(f"Successfully generated Job Volume Estimates at {output_path}")

if __name__ == "__main__":
    leed_path = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard\Dataset\archive_other\Industry Size & Total Workforce Count\STATSNZ,LEED_Q3W_016,1.0,filtered,2026-08-05 14-00-00.csv"
    geo_path = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard\Dataset\archive_other\Industry Size & Total Workforce Count\geographic-units-by-industry-and-statistical-area-2000-2025-descending-order\geographic-units-by-industry-and-statistical-area-2000-2025-descending-order-february-2025.csv"
    output_path = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard\public\data\job_volume_estimates.json"
    benchmarks_path = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard\scripts\config\benchmarks.json"
    
    process_job_volumes(leed_path, geo_path, output_path, benchmarks_path)

def process_level_industry_benchmarks() -> Dict[str, Any]:
    """Generates level-specific salary benchmarks, regional distributions, and opportunity scores for all industries."""
    print("🔄 Processing Multi-Level Industry & Regional Salary Benchmarks...")
    
    industries = ['Business services', 'Construction', 'Education', 'Health care', 
                  'Hospitality', 'IT', 'Manufacturing', 'Primary', 'Sales', 'Other']
                  
    all_nz_regions = [
        "Auckland", "Waikato", "Bay of Plenty", "Northland", 
        "Gisborne/Hawkes Bay", "Manawatu-Whanganui/Taranaki", "Wellington", 
        "Tasman/Nelson/Marlborough/West Coast", "Canterbury", "Otago/Southland"
    ]
    
    industry_shares = CONFIG.get("industry_regional_shares", {})
    regional_wages = {
        "Auckland": 1438.0, "Waikato": 1320.0, "Bay of Plenty": 1290.0, "Northland": 1210.0,
        "Gisborne/Hawkes Bay": 1230.0, "Manawatu-Whanganui/Taranaki": 1240.0, "Wellington": 1496.0,
        "Tasman/Nelson/Marlborough/West Coast": 1220.0, "Canterbury": 1343.0, "Otago/Southland": 1280.0
    }
    
    # Extract baseline current vacancy index from MBIE Jobs Online 
    filepath = os.path.join(ACTIVE_DATA_DIR, "jobs-online-all-unadjusted-quarterly-data-consolidated-march-2026.csv")
    df = load_clean_quarterly_series(filepath)
    latest_q_date = df['ACTUAL_DATE'].max()
    df_latest = df[df['ACTUAL_DATE'] == latest_q_date]
    
    levels_data = {
        "Junior": {"level_name": "Junior / Entry-Level (0-2 Yrs)", "experience_range": "0-2 Years Experience", "salary_multiplier": 0.65, "competition_index": 2.5, "industries": {}},
        "Intermediate": {"level_name": "Intermediate (3-5 Yrs)", "experience_range": "3-5 Years Experience", "salary_multiplier": 1.00, "competition_index": 1.0, "industries": {}},
        "Senior": {"level_name": "Senior (6+ Yrs)", "experience_range": "6+ Years Experience", "salary_multiplier": 1.42, "competition_index": 0.5, "industries": {}},
        "Lead / Executive": {"level_name": "Lead / Executive (10+ Yrs)", "experience_range": "10+ Years Experience", "salary_multiplier": 1.85, "competition_index": 0.3, "industries": {}}
    }
    
    for level_key, level_info in levels_data.items():
        multiplier = level_info["salary_multiplier"]
        comp_index = level_info["competition_index"]
        
        for ind in industries:
            base_salary = INDUSTRY_BENCHMARKS.get(ind, {'weekly': 1250, 'annual': 65000, 'description': 'General Sector'})
            base_weekly = base_salary['weekly']
            level_weekly = base_weekly * multiplier
            level_annual = level_weekly * 52.0
            
            # Create range bands +/- 10-15%
            lower_annual = int(level_annual * 0.88)
            upper_annual = int(level_annual * 1.12)
            lower_hourly = round(lower_annual / 2080.0, 2)
            upper_hourly = round(upper_annual / 2080.0, 2)
            
            regional_distribution = {}
            for reg_name in all_nz_regions:
                # Get current vacancy index
                curr_row = df_latest[(df_latest['KEYA'] == reg_name) & (df_latest['KEYBB'] == ind)]
                curr_idx = sanitize_val(curr_row['AVI_SUM'].values[0], None) if len(curr_row) > 0 else None
                
                ind_share = industry_shares.get(ind, {}).get(reg_name, 0.10)
                reg_wage = regional_wages.get(reg_name, 1380.0)
                wage_factor = reg_wage / 1380.0
                effective_weekly = level_weekly * wage_factor
                
                # Opportunity Score = (Vacancy Index * Share) * (Wage / 1200) / Competition Index
                if curr_idx:
                    opp_score = round(((curr_idx) * (ind_share / 0.10)) * (effective_weekly / 1200.0) * (1.0 / comp_index), 2)
                else:
                    opp_score = None
                    
                reg_lower_annual = int(lower_annual * wage_factor)
                reg_upper_annual = int(upper_annual * wage_factor)
                
                regional_distribution[reg_name] = {
                    "opportunity_score": opp_score,
                    "vacancies_share": f"{int(ind_share * 100)}%",
                    "salary_annual": f"${reg_lower_annual:,} - ${reg_upper_annual:,}",
                    "current_vacancy_index": curr_idx
                }
                
            level_info["industries"][ind] = {
                "salary_range_annual": f"${lower_annual:,} - ${upper_annual:,}",
                "salary_range_hourly": f"${lower_hourly:.2f} - ${upper_hourly:.2f} / hr",
                "median_weekly": round(level_weekly, 2),
                "regional_distribution": regional_distribution,
                "description": base_salary['description']
            }
            
    output_data = {
        "metadata": {
            "source": "Absolute IT NZ, Hays Salary Guide FY26-27, MBIE Jobs Online, and Stats NZ Income Census",
            "seniority_levels": ["Junior", "Intermediate", "Senior", "Lead / Executive"],
            "total_industries_per_level": len(industries)
        },
        "levels": levels_data
    }
    
    output_file = os.path.join(PUBLIC_DATA_DIR, "level_industry_benchmarks.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"✅ Saved multi-level industry & regional salary benchmarks to {output_file}")
    return output_data


