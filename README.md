# 🇳🇿 New Zealand Labour Market & Income Intelligence Dashboard

An executive, production-grade analytics platform providing data-driven insights into New Zealand online job vacancies, median/average earnings, mean weekly rents, real purchasing power, labor market slack, and ANZSCO occupational trajectories. Built with **React 18**, **Vite**, **Recharts**, and an automated **Python ETL Data Processing Pipeline** parsing official datasets from **MBIE (Ministry of Business, Innovation and Employment)** and **Stats NZ (Tatauranga Aotearoa)**.

🔗 **Live Production Dashboard**: [https://nz-labour-dashboard.vercel.app/](https://nz-labour-dashboard.vercel.app/)  
📂 **GitHub Repository**: [https://github.com/BinkeXu/New-Zealand-Labour-Market-Income-Intelligence-Dashboard.git](https://github.com/BinkeXu/New-Zealand-Labour-Market-Income-Intelligence-Dashboard.git)

---

## 🌟 Key Features & Interactive Modals

### 📊 1. Interactive Historical Trend Modals & Time-Series Analytics
- **KPI Trend Modals**: Clicking any KPI card opens an interactive, centered modal dialog displaying historical trend charts with dynamic time-range filter controls (**`1Y`**, **`3Y`**, **`5Y`**, **`10Y`**, **`All`**) and CSV data export:
  - **NZ Overall Vacancy Index**: 230 monthly series records (May 2007 – June 2026).
  - **NZ National Median Income**: 28-year annual income census series (1998 – 2025).
  - **NZ Official Unemployment Rate**: 57 quarterly HLFS unemployment rates (2012 – 2026).
  - **NZ Labor Underutilisation Rate**: 57 quarterly HLFS underutilisation rates (2012 – 2026).

### 💰 2. National Income Distribution by Source & Breakdown Analytics
- **Category Color Indicators**:
  - 🟣 **Wage & Salary Income** (`#4f46e5`): $1,380/wk ($34.50/hr median) • 2.36M workforce.
  - 🟢 **Self-employment Income** (`#059669`): $921/wk ($23.03/hr median) • 574k business owners.
  - 🟠 **Government Transfer Income** (`#d97706`): $472/wk ($11.80/hr median) • 1.31M recipients (NZ Superannuation, benefits, student allowances).
  - 🔵 **All Sources Combined** (`#0284c7`): $959/wk ($23.98/hr median) • 4.31M population.
- **Interactive Breakdown Modal**: Clicking any row in the Income Distribution table opens a 28-year historical growth chart and a detailed breakdown box comparing median weekly/hourly wages, average weekly/hourly wages, 52-week annualized income, total NZ recipient counts, and policy/tax context notes.

### 💼 3. ANZSCO 58-Quarter Demand Trajectory & INZ Green List Visas
- **58-Quarter Historical Series**: Extracted 58 historical quarters (2011–2026) for 100+ 4-digit ANZSCO occupations.
- **Interactive Role Graphs**: Clicking any occupation row (e.g., Software Engineer, Developer Programmer, Registered Nurse, Civil Engineer) opens its historical demand trajectory.
- **Immigration NZ (INZ) Green List Status**:
  - `🟢 INZ Green List Tier 1 (Straight to Residence)` (Developers, Software Engineers, ICT Managers, Civil Engineers, Doctors, Nurses).
  - `🟡 INZ Green List Tier 2 (Work to Residence)` (ICT Support Engineers, Network Engineers, Qualified Trades).

### 🏠 4. Rent-Adjusted Real Purchasing Power & Regional Matrix
- **Cost of Living Modeling**: Combines Stats NZ median weekly income with Stats NZ / MBIE Tenancy Mean Weekly Rent across all 10 MBIE regions.
- **Mathematical Formula**:
  $$\text{Net Discretionary Income} = \text{Median Weekly Wage} - \text{Mean Weekly Rent}$$
  $$\text{Real Purchasing Power Index} = \left(\frac{\text{Net Discretionary Income}}{\$800.00}\right) \times 100$$
- **Working-Age Demographic Density**: Excludes children (<15) and retirees (65+) using Stats NZ Census Working-Age Population (Ages 15–64) to calculate true per-capita vacancies per 100k active residents.

### 📉 5. Stats NZ Official Unemployment & Underutilisation Rates
- **NZ Official Unemployment Rate**: **5.3%** (Men: 5.4%, Women: 5.3%) parsed directly from `unemployment_rate_by_sex.csv` (March 2026 Quarter).
- **NZ Labor Underutilisation Rate**: **12.9%** (Men: 11.6%, Women: 14.3%) parsed from `underutilisation_rate_by_sex.csv`.

### 📥 6. Client-Side Microsoft Excel CSV Data Export
- 1-click CSV data export available across Overview, Regional Matrix, Industry Quadrant, Pathfinder, Methodology, and all Modal Trend Dialogs.

---

## 📁 Dataset Architecture

Active datasets processed by the Python ETL script (`scripts/process_data.py`) reside under `Dataset/active/`:
- `jol-monthly-unadjusted-series-from-may-2007-june-2026.csv` (MBIE Monthly Vacancies)
- `jobs-online-all-unadjusted-quarterly-data-consolidated-march-2026.csv` (MBIE Regional & Industry Vacancies)
- `jobs-online-detailed-occupational-data-march-2026-quarter.csv` (MBIE 58-Quarter ANZSCO Series)
- `Income by sex, region, ethnic groups and income source.csv` (Stats NZ 28-Year Income Census)
- `Census_Population_by_age_by_Regional_Council_2001_2006_2013.csv` (Stats NZ Working-Age Population)
- `mean_weekly_rent.csv` (MBIE / Stats NZ Mean Weekly Rent)
- `unemployment_rate_by_sex.csv` (Stats NZ HLFS Unemployment Rate)
- `underutilisation_rate_by_sex.csv` (Stats NZ HLFS Underutilisation Rate)

---

## 🛠️ Installation, Local Execution & Verification

```bash
# 1. Clone repository
git clone https://github.com/BinkeXu/New-Zealand-Labour-Market-Income-Intelligence-Dashboard.git
cd "NZ Labour Market Intelligence Dashboard"

# 2. Install Node dependencies
npm install

# 3. Run Python ETL Pipeline
python scripts/process_data.py

# 4. Run automated unit tests
python -m unittest scripts/tests/test_calculators.py

# 5. Build for production verification
npm run build

# 6. Launch local development server
npm run dev
```

---

## 📜 License & Data Attribution
Published under the MIT License. Data sources strictly attributed to MBIE and Stats NZ under Creative Commons Attribution 4.0 International (CC BY 4.0).
