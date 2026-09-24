"""
Auto-Collect NZ Government Data Pipeline
Automates the retrieval and ingestion of new releases from Stats NZ and MBIE.

Features:
- Scrapes the latest Stats NZ Labour Market Statistics information release.
- Automatically extracts Unemployment, Underutilisation, and Employment quarterly CSV series.
- Updates Dataset/active/ CSV files if newer quarters are detected.
- Triggers scripts/process_data.py to rebuild production JSON datasets.
"""

import os
import sys
import re
import html
import urllib.request
import subprocess
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACTIVE_DATA_DIR = os.path.join(BASE_DIR, "Dataset", "active")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def fetch_url(url: str) -> str:
    """Fetches text content from URL with realistic user-agent."""
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read().decode('utf-8', errors='ignore')

def update_hlfs_data() -> bool:
    """
    Checks Stats NZ for the latest Labour Market Statistics release and updates CSVs.
    Returns True if new data was found and written, False otherwise.
    """
    print("🔍 Checking Stats NZ for latest Labour Market Statistics releases...")
    
    base_url = "https://www.stats.govt.nz"
    releases_url = "https://www.stats.govt.nz/topics/labour-market"
    
    found_url = None
    try:
        html_content = fetch_url(releases_url)
        matches = re.findall(r'href="([^"]*labour-market-statistics-[a-z]+-202[0-9]-quarter[^"]*)"', html_content, re.IGNORECASE)
        if matches:
            found_url = matches[0]
            if not found_url.startswith("http"):
                found_url = base_url + found_url
    except Exception as e:
        print(f"⚠️ Error querying Stats NZ index: {e}")

    current_year = datetime.now().year
    candidate_urls = []
    if found_url:
        candidate_urls.append(found_url)
    for y in [current_year, current_year - 1]:
        for q in ["september", "june", "march", "december"]:
            candidate_urls.append(f"https://www.stats.govt.nz/information-releases/labour-market-statistics-{q}-{y}-quarter/")

    release_page = None
    target_url = None
    for url in candidate_urls:
        try:
            content = fetch_url(url)
            if "GraphCsvData" in content or "Unemployment rate by sex" in content:
                release_page = content
                target_url = url
                print(f"✅ Found active Stats NZ release page: {target_url}")
                break
        except Exception:
            continue

    if not release_page:
        print("ℹ️ No new release page found or accessible.")
        return False

    unescaped = html.unescape(release_page)
    headings = re.findall(r'"GraphHeading":\s*"([^"]+)"', unescaped)
    csv_blocks = re.findall(r'"GraphCsvData":\s*"([^"]+)"', unescaped)

    updated_any = False

    for i, raw_csv in enumerate(csv_blocks):
        heading = headings[i] if i < len(headings) else ""
        try:
            clean_csv = raw_csv.encode('utf-8').decode('unicode_escape')
        except Exception:
            clean_csv = raw_csv

        # 1. Unemployment Rate
        if "unemployment rate by sex" in heading.lower() and "seasonally adjusted" in heading.lower():
            if update_csv_from_transposed(clean_csv, os.path.join(ACTIVE_DATA_DIR, "unemployment_rate_by_sex.csv"), "Unemployment"):
                updated_any = True

        # 2. Underutilisation Rate
        elif "underutilisation rate by sex" in heading.lower():
            if update_csv_from_transposed(clean_csv, os.path.join(ACTIVE_DATA_DIR, "underutilisation_rate_by_sex.csv"), "Underutilisation"):
                updated_any = True

        # 3. Employment Rate
        elif "employment rate by sex" in heading.lower():
            if update_csv_from_transposed(clean_csv, os.path.join(ACTIVE_DATA_DIR, "employment_rate_by_sex.csv"), "Employment"):
                updated_any = True

    return updated_any

def update_csv_from_transposed(stats_csv: str, local_csv_path: str, metric_name: str) -> bool:
    """
    Parses Stats NZ transposed CSV (Row 1: Quarters, Row 2: Men, Row 3: Women, Row 4: Total)
    and updates the local vertical CSV ("Quarter","Men","Women","Total").
    """
    lines = [l.strip() for l in stats_csv.split("\r\n") if l.strip()]
    if len(lines) < 4:
        return False

    quarters = [q.strip('"\ufeff') for q in lines[0].split(",")[1:]]
    men_vals = [v.strip('"\ufeff') for v in lines[1].split(",")[1:]]
    women_vals = [v.strip('"\ufeff') for v in lines[2].split(",")[1:]]
    total_vals = [v.strip('"\ufeff') for v in lines[3].split(",")[1:]]

    if not (len(quarters) == len(men_vals) == len(women_vals) == len(total_vals)):
        print(f"⚠️ Column count mismatch for {metric_name}, skipping.")
        return False

    existing_quarters = set()
    if os.path.exists(local_csv_path):
        with open(local_csv_path, 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split(",")
                if parts and parts[0] != '"Quarter"':
                    existing_quarters.add(parts[0].strip('"'))

    new_rows = []
    for q, m, w, t in zip(quarters, men_vals, women_vals, total_vals):
        if q not in existing_quarters:
            new_rows.append(f'"{q}",{m},{w},{t}')

    if new_rows:
        print(f"✨ Found {len(new_rows)} new quarter(s) for {metric_name}: {[r.split(',')[0] for r in new_rows]}")
        with open(local_csv_path, 'a', encoding='utf-8', newline='') as f:
            for row in new_rows:
                f.write(row + "\n")
        print(f"✅ Appended new rows to {local_csv_path}")
        return True
    else:
        print(f"✓ {metric_name} is already up to date with latest quarter ({quarters[-1]}).")
        return False

def run_etl_pipeline():
    """Runs scripts/process_data.py to regenerate all JSON deliverables."""
    print("⚙️ Executing ETL Data Processing Pipeline (process_data.py)...")
    process_script = os.path.join(BASE_DIR, "scripts", "process_data.py")
    res = subprocess.run([sys.executable, process_script], cwd=BASE_DIR, capture_output=True, text=True)
    if res.returncode == 0:
        print("🎉 ETL Pipeline completed successfully!")
    else:
        print(f"❌ ETL Pipeline failed with code {res.returncode}:\n{res.stderr}")

def main():
    print("=" * 70)
    print("🇳🇿 NEW ZEALAND LABOUR MARKET INTELLIGENCE — AUTO DATA COLLECTOR")
    print("=" * 70)
    
    updated = update_hlfs_data()
    
    if updated or (len(sys.argv) > 1 and sys.argv[1] == "--force-rebuild"):
        print("\n📦 Changes detected or force rebuild requested. Triggering ETL pipeline...")
        run_etl_pipeline()
    else:
        print("\n✨ All datasets are currently up to date. No rebuild necessary.")

if __name__ == "__main__":
    main()
