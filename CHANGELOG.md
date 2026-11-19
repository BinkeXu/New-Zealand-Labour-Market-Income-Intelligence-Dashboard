# 📋 Changelog

All notable changes to the New Zealand Labour Market & Income Intelligence Dashboard are documented in this file.

---

## [Unreleased] - 2026-11-19

### 🗺️ Interactive 2D New Zealand Regional Choropleth Map & Detail Navigator
- **SVG Vector Mapping (`NZRegionalMap.jsx`)**: Designed a themeable vector SVG map grouped into the 10 MBIE administrative regions (`src/data/nzRegionsPaths.js`).
- **6 Toggleable Colour Metrics**: Vacancies per 100k (default), Median Weekly Wage, Purchasing Power / After-Rent Discretionary Cash, Vacancy Index, Stats NZ Regional Unemployment Rate (%), and Rent-to-Income Burden (%).
- **Interactive Detail Card**: Defaults to a National Summary profile with Top 3 & Lowest 3 ranked mini-bars; updates dynamically on region click with full local breakdowns and a Gross vs Net (PAYE & ACC) tax toggle.
- **Map-Driven Filtering**: Clicking a region dynamically filters the City × Industry Matrix below with an active filter badge and reset pill.

### 📊 2×2 Industry Opportunity Scatter Quadrant Chart
- **Scatter Matrix (`IndustryQuadrantChart.jsx`)**: Built a 2×2 Recharts scatter plot mapping all 10 ANZSIC sectors across YoY Vacancy Growth (%) vs. Weekly Wage ($/wk) with bubble radii scaled to Opportunity Scores.
- **Quadrant Zone Anchors**: Embedded corner labels (`★ STAR: HIGH PAY + GROWTH`, `HIGH SALARY • NICHE`, `HIGH DEMAND • ENTRY`, `STABLE / MODERATE`) and sector labels.
- **Cross-Tab Deep Linking**: Integrated 1-click *"Plan career in [Sector] →"* action button connecting directly into Career Pathfinder with the target industry pre-selected.

### 🎛️ Progressive Disclosure & De-cluttering
- **Regional Matrix Table Toggle**: Collapsed the 10-region summary table and chart behind an accordion toggle button (`"View full regional table (10)"`).
- **City × Industry Table Cap**: Capped default view to Top 10 rows with an expandable `"Show all rows"` toggle and counter.
- **ANZSCO Occupations Table Cap**: Defaulted to Top 10 roles with an expandable `"Show all rows"` toggle.
- **Overview Income Tabs**: Replaced stacked vertical tables with 4 pill tabs (*By Income Source*, *Ethnicity Demographics*, *Gender & Pay Tiers*, and *Percentile Calculator*).

### 🏛️ Regional Unemployment Rates & Housing Cost Ratios
- **Stats NZ HLFS Q3 2026 Regional Unemployment**: Integrated official regional unemployment rates into `regional_summary.json` (Northland 8.3%, Auckland 6.3%, Waikato 6.3%, Gisborne/HB 5.4%, Wellington 4.9%, Canterbury 4.7%, Bay of Plenty 4.4%, Tasman/Nelson/Marlborough/West Coast 4.1%, Otago 3.3% / Southland 5.6%, Manawatū-Whanganui 6.3% / Taranaki 4.8%).
- **Rent-to-Income Ratio (%)**: Ingested and computed regional housing burden percentages dynamically in `NZRegionalMap.jsx` and `CityComparisonWidget.jsx`.

### 🎨 Visual & Quality Improvements
- **Default Dark Mode**: Set Dark Mode as the default theme in `ThemeContext.jsx` for optimal contrast and data legibility.
- **Automated Unit Tests**: Authored `src/utils/__tests__/mapHelpers.test.js` validating metric range calculations, theme colour interpolations, and top/bottom rankings.

### 📜 Data Provenance, Licensing & Transparency Hardening
- **Reproducible Map Generation (`scripts/generate_nz_map_paths.py`)**: Authored and committed a standalone, thoroughly-commented Python script documenting the geoBoundaries (LINZ / Stats NZ) GIS boundary download, 16-to-10 region fusion, equirectangular projection math, and SVG coordinate generation.
- **Methodological Scope & Disclaimers**: Added dedicated sections to `Methodology.jsx` and `README.md` covering open government licensing (NZGOAL / CC BY 4.0), online vacancy measurement boundaries, lodged bond rents vs. sitting tenants, and statutory non-advice notices.
- **Provenance Matrix**: Added data vintage, release cadence, and official source links table across all tracked datasets.

---

## [2026-11-06]

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
