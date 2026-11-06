import os
import sys

# Configure standard streams for UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from scripts.etl.config import ensure_directories, ARCHIVE_OTHER_DIR, PUBLIC_DATA_DIR, CONFIG_DIR
from scripts.etl.income import process_regional_income, process_ird_income_distributions
from scripts.etl.vacancies import process_monthly_series, process_city_industry_breakdown, process_industry_matrix, process_detailed_occupations, generate_career_pathfinder_rules
from scripts.etl.workforce import process_level_industry_benchmarks, process_job_volumes

def main():
    print("🚀 Starting New Zealand Labour Market Data Processing Pipeline...")
    ensure_directories()
    
    # 1. Vacancies
    process_monthly_series()
    process_city_industry_breakdown()
    process_industry_matrix()
    process_detailed_occupations()
    generate_career_pathfinder_rules()
    
    # 2. Income
    process_regional_income()
    process_ird_income_distributions()
    
    # 3. Workforce
    process_level_industry_benchmarks()
    
    leed_path = os.path.join(ARCHIVE_OTHER_DIR, "Industry Size & Total Workforce Count", "STATSNZ,LEED_Q3W_016,1.0,filtered,2026-08-05 14-00-00.csv")
    geo_path = os.path.join(ARCHIVE_OTHER_DIR, "Industry Size & Total Workforce Count", "geographic-units-by-industry-and-statistical-area-2000-2025-descending-order", "geographic-units-by-industry-and-statistical-area-2000-2025-descending-order-february-2025.csv")
    output_vol_path = os.path.join(PUBLIC_DATA_DIR, "job_volume_estimates.json")
    benchmarks_path = os.path.join(CONFIG_DIR, "benchmarks.json")
    
    if os.path.exists(leed_path) and os.path.exists(geo_path):
        print("🚀 Found LEED and Business Demography datasets! Processing Job Volume Estimates...")
        process_job_volumes(leed_path, geo_path, output_vol_path, benchmarks_path)
    
    print("🎉 ETL Data Processing Pipeline completed successfully!")

if __name__ == "__main__":
    main()
