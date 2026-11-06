# 📋 Changelog

All notable changes to the New Zealand Labour Market & Income Intelligence Dashboard are documented in this file.

---

## [Unreleased] - 2026-11-06

### 🏛️ Stats NZ September 2026 Labour Market Integration
- **Unemployment Rate**: Updated official HLFS unemployment rate to **5.7%** (Men: 5.6%, Women: 5.7%).
- **Underutilisation Rate**: Ingested latest rate of **13.8%** (Men: 12.4%, Women: 15.3%).
- **Employment Rate**: Ingested latest rate of **66.4%** (Men: 70.1%, Women: 62.8%).
- **Time Series Extension**: Expanded historical HLFS quarters from 58 to **59 quarters** (June 2012 – September 2026).
- **Deliverables**: Rebuilt `public/data/monthly_series.json` with September 2026 metadata.

### 💰 IRD 2026 Tax Year Wage & Salary Distribution Ingestion
- **Official Ingestion**: Integrated the Inland Revenue Department (IRD) August 2026 release (`Wage and salary distributions for individuals.xlsx`) for the tax year ended 31 March 2026.
- **Coordinate-Safe OpenXML Ingestion**: Updated `scripts/etl/income.py` with coordinate-based cell parsing (`_col2num(coord)`), eliminating cell-shift misalignment from omitted empty cells in earlier years.
- **2026 Decile Benchmarks**:
  - **10th Percentile**: $6,880 / yr ($132 / wk)
  - **50th Percentile (National Median)**: **$61,958 / yr** ($1,192 / wk) *(up from $59,917 in 2025)*
  - **Top 20% Threshold**: **$103,897 / yr** ($1,998 / wk) *(up from $99,932 in 2025)*
  - **Top 10% Threshold**: **$134,568 / yr** ($2,588 / wk) *(up from $129,850 in 2025)*
  - **Top 5% Threshold**: **$169,365 / yr** ($3,257 / wk) *(up from $163,391 in 2025)*
  - **Top 1% Threshold**: **$289,186 / yr** ($5,561 / wk) *(up from $278,754 in 2025)*
- **2026 Income Histogram**: Aggregated 200 $1k income bands into 10 clean distribution brackets covering **2,840,300 individual New Zealand taxpayers**.

### ⚙️ Auto-Collection Pipeline Resilience
- **Regex Pairing**: Resolved Stats NZ Silverstripe CMS header duplication using atomic block pairing regex.
- **Universal Delimiter**: Replaced `.split("\r\n")` with `.splitlines()` in `scripts/auto_collect_data.py`.
- **Newline Concatenation Safety**: Added binary EOF newline check before appending to prevent row-concatenation bugs.
- **Console UTF-8 Encoding**: Configured `sys.stdout` and `sys.stderr` for UTF-8 on Windows terminal to prevent Unicode BOM charmap crashes.

### 🎨 UI Reactivity & Bug Fixes
- **Overview.jsx**: Bound official unemployment rate dynamically to `{monthlyData?.metadata?.hlfs_labor_metrics?.unemployment_rate?.total || 5.7}%`.
- **KPICards.jsx**: Updated fallback defaults to `Sept-26` / `5.7%`.
- **Methodology.jsx**: Synchronised documentation and provenance tables to 59 quarters and 5.7% unemployment rate.
- **PercentileCalculator.jsx**: Made calculation points dynamic to 2026 boundaries, replaced static benchmark cards with dynamic hook, and bound histogram header to dynamic 2.84M taxpayer count.

### 🧪 Automated Testing Suite
- Added `scripts/tests/test_auto_collect.py` (5 tests covering Unix/Windows newlines, duplicate prevention, and concatenation safety).
- Added `scripts/tests/test_ird_income.py` (6 tests validating 2026 deciles, percentiles, and histogram data).
- Expanded total test suite to **25 passing tests** (0.056s execution time).
