import os

base_dir = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard"
process_data_path = os.path.join(base_dir, "scripts", "process_data.py")
vacancies_path = os.path.join(base_dir, "scripts", "etl", "vacancies.py")
income_path = os.path.join(base_dir, "scripts", "etl", "income.py")
workforce_path = os.path.join(base_dir, "scripts", "etl", "workforce.py")

with open(process_data_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

def get_lines(start, end):
    return "".join(lines[start-1:end]) + "\n\n"

# load_hlfs_labor_slack_metrics is lines 177 to 225
hlfs_logic = get_lines(177, 225)

with open(vacancies_path, "r", encoding="utf-8") as f:
    v_content = f.read()

# Add imports for config
config_import = "\nfrom scripts.etl.config import ACTIVE_DATA_DIR, PUBLIC_DATA_DIR, CONFIG_DIR, CITY_REGION_MAPPING, INDUSTRY_BENCHMARKS, ARCHIVE_OTHER_DIR\n"

with open(vacancies_path, "w", encoding="utf-8") as f:
    f.write(config_import + v_content + "\n" + hlfs_logic)

with open(income_path, "r", encoding="utf-8") as f:
    i_content = f.read()
    
with open(income_path, "w", encoding="utf-8") as f:
    f.write(config_import + i_content)
    
with open(workforce_path, "r", encoding="utf-8") as f:
    w_content = f.read()

with open(workforce_path, "w", encoding="utf-8") as f:
    f.write(config_import + w_content)

new_process_data = """import os
import sys

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
"""

with open(process_data_path, "w", encoding="utf-8") as f:
    f.write(new_process_data)

print("Done generating clean process_data.py")
