import os
import sys

base_dir = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard"
process_data_path = os.path.join(base_dir, "scripts", "process_data.py")
vacancies_path = os.path.join(base_dir, "scripts", "etl", "vacancies.py")

# I will just write the new process_monthly_series to replace the old one in vacancies.py
new_monthly = """
def process_monthly_series() -> Dict[str, Any]:
    \"\"\"Parses MBIE Jobs Online Monthly Series dataset (2007-2026).\"\"\"
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
"""

with open(vacancies_path, "r", encoding="utf-8") as f:
    v_content = f.read()

import re
v_content = re.sub(r'def process_monthly_series\(.*?\)\s*->\s*Dict\[str,\s*Any\]:[\s\S]*?(?=\ndef\s)', new_monthly + '\n', v_content, count=1)

with open(vacancies_path, "w", encoding="utf-8") as f:
    f.write(v_content)

print("Done fixing process_monthly_series")
