import pandas as pd
import json
import os
import math

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
