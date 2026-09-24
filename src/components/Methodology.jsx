import React from 'react';
import DownloadCSVButton from './DownloadCSVButton';
import { Database, ShieldCheck, Calculator, CheckCircle, FileText, Layers, Users, TrendingUp, AlertTriangle, Home, UserX, ShieldAlert, BookOpen } from 'lucide-react';

export default function Methodology() {
  const exportMethodologyData = [
    { Metric: "Working-Age Opportunity Score", Formula: "(Vacancies per 100k Working-Age / 50.0) * (Median Wage / $1,200) * 100", Source: "MBIE Jobs Online & Stats NZ Census" },
    { Metric: "Rent-Adjusted Purchasing Power", Formula: "(Net Discretionary Income / $800.00) * 100", Source: "Stats NZ Household Income & Tenancy Mean Rent" },
    { Metric: "Vacancies Per 100k Working-Age", Formula: "(MBIE Vacancy Index / Working-Age Population [15-64]) * 100,000", Source: "Stats NZ Working-Age Census (15-64)" },
    { Metric: "Hourly Wage Conversion", Formula: "Stats NZ Median Weekly Wage / 40.0 hours", Source: "Stats NZ Household Income Census" },
    { Metric: "Annualized Salary", Formula: "Stats NZ Median Weekly Wage * 52.0 weeks", Source: "Stats NZ Household Income Census" },
    { Metric: "YoY Vacancy Growth", Formula: "((Index_Current - Index_PrevYear) / Index_PrevYear) * 100", Source: "MBIE Jobs Online Quarterly Consolidated Release" },
    { Metric: "NZ Official Unemployment Rate", Formula: "HLFS Seasonally Adjusted Unemployed / Labour Force", Source: "Stats NZ Unemployment Rate Dataset (5.6%)" },
    { Metric: "NZ Labor Underutilisation Rate", Formula: "HLFS Seasonally Adjusted Underutilised / Extended Labour Force", Source: "Stats NZ Underutilisation Rate Dataset (13.8%)" },
    { Metric: "IRD Income Percentile Rank", Formula: "Linear Interpolation over IRD PAYE Tax Return Deciles (2001-2025)", Source: "Inland Revenue Department (IRD) PAYE Returns" }
  ];

  return (
    <div className="section-grid">
      <section className="glass-card section-card col-12" aria-labelledby="methodology-title">
        <div className="card-header-flex" style={{ marginBottom: '28px' }}>
          <div>
            <h2 id="methodology-title" className="hero-title" style={{ fontSize: '2rem' }}>
              Data Architecture, Provenance & <span className="text-gradient">Methodology Transparency</span>
            </h2>
            <p className="hero-desc" style={{ fontSize: '1.05rem' }}>
              Full technical specification detailing data provenance, mathematical calculation formulas, demographic population filtering, rent-adjusted purchasing power, INZ Green List visa tags, and zero-artificial data hygiene standards.
            </p>
          </div>

          <DownloadCSVButton 
            data={exportMethodologyData} 
            filename="nz_labour_market_methodology_formulas.csv" 
            label="Export Formulas CSV" 
          />
        </div>

        {/* SECTION 1: Detailed Explanation of Datasets */}
        <div style={{ marginBottom: '40px' }}>
          <h3 className="card-title" style={{ fontSize: '1.35rem', marginBottom: '20px', color: 'var(--text-main)' }}>
            <BookOpen size={24} className="text-gradient-cyan" aria-hidden="true" />
            1. Comprehensive Dataset Descriptions & Collection Methodologies
          </h3>

          <div className="section-grid" style={{ marginBottom: '24px' }}>
            {/* MBIE Jobs Online Monthly Series */}
            <div className="col-6 glass-card section-card" style={{ background: 'var(--table-header-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="badge badge-indigo">MBIE Primary Dataset</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  1. MBIE Jobs Online Monthly Index (2007 – 2026)
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Source:</strong> Ministry of Business, Innovation and Employment (MBIE).<br />
                <strong>Methodology:</strong> Web-scraped and aggregated job vacancy counts from major New Zealand job boards (SEEK, TradeMe Jobs). Base index baseline set to <code>May 2007 = 100</code>.<br />
                <strong>Coverage:</strong> 230 monthly records tracking national total, 5 major regions, 10 ANZSIC industries, 8 ANZSCO occupation groups, and 5 skill tiers.
              </p>
            </div>

            {/* Stats NZ Income Census */}
            <div className="col-6 glass-card section-card" style={{ background: 'var(--table-header-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="badge badge-emerald">Stats NZ Primary Dataset</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  2. Stats NZ Household Income Census (1998 – 2025)
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Source:</strong> Stats NZ (Tatauranga Aotearoa) Annual Income Census.<br />
                <strong>Methodology:</strong> Surveying 15,000+ NZ households annually. Reports median and average weekly gross earnings ($/wk) before tax.<br />
                <strong>Coverage:</strong> 28-year historical time series broken down by 12 regional councils, 4 income sources (Wage/Salary, Self-Employed, Benefits), gender, and 6 ethnic groups.
              </p>
            </div>

            {/* IRD Individual Wage & Salary Returns */}
            <div className="col-6 glass-card section-card" style={{ background: 'var(--table-header-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="badge badge-cyan">IRD Tax Census Dataset</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  3. IRD Individual Wage & Salary Returns (2001 – 2025)
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Source:</strong> Inland Revenue Department (IRD / Te Tari Taake).<br />
                <strong>Methodology:</strong> Census-level administrative PAYE tax return records for 2.46 million individual wage and salary earners in New Zealand.<br />
                <strong>Coverage:</strong> 25-year time series tracking income deciles (10th-90th), top high-earner percentiles (91st-99th), and $1,000 income bracket distribution histograms.
              </p>
            </div>

            {/* Stats NZ HLFS Unemployment & Underutilisation */}
            <div className="col-6 glass-card section-card" style={{ background: 'var(--table-header-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="badge badge-rose">Labor Slack Dataset</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  4. Stats NZ HLFS Unemployment & Underutilisation (2012 – 2026)
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Source:</strong> Household Labour Force Survey (HLFS).<br />
                <strong>Methodology:</strong> Seasonally adjusted quarterly survey of active NZ job seekers and underemployed part-time workers seeking additional hours.<br />
                <strong>Coverage:</strong> 58 historical quarters tracking official Unemployment Rate (5.6%) and Labor Underutilisation Rate (13.8%) by gender.
              </p>
            </div>

            {/* Stats NZ / MBIE Tenancy Rent */}
            <div className="col-6 glass-card section-card" style={{ background: 'var(--table-header-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="badge badge-amber">Cost of Living Dataset</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  5. MBIE Tenancy Mean Weekly Rent Dataset (1993 – 2026)
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Source:</strong> MBIE Tenancy Services & Stats NZ Housing Data.<br />
                <strong>Methodology:</strong> Compiled from mandatory tenancy bond registrations filed with Tenancy Services.<br />
                <strong>Coverage:</strong> Actual mean weekly rent ($/wk) across 78 Territorial Authorities and 10 Labour Market Regions used to compute Net Discretionary Income.
              </p>
            </div>

            {/* Job Volume Extrapolations */}
            <div className="col-6 glass-card section-card" style={{ background: 'var(--table-header-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="badge badge-cyan">Absolute Counts Dataset</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  6. Stats NZ Business Demography & LEED (2025 – 2026)
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Source:</strong> Stats NZ Linked Employer-Employee Data (LEED) & Business Demography Statistics.<br />
                <strong>Methodology:</strong> Cross-tabulation of total enterprise employee counts (`ec_count`) against LEED quarterly worker separations to compute the official "Annual Turnover Rate".<br />
                <strong>Coverage:</strong> Industry sizes across NZ and absolute count extrapolations.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Step-by-Step Calculation Formulas */}
        <div style={{ marginBottom: '40px' }}>
          <h3 className="card-title" style={{ fontSize: '1.35rem', marginBottom: '20px', color: 'var(--text-main)' }}>
            <Calculator size={24} className="text-gradient" aria-hidden="true" />
            2. Step-by-Step Mathematical Calculation Formulas
          </h3>

          <div className="section-grid" style={{ marginBottom: '24px' }}>
            {/* Job Volume Extrapolator Formula */}
            <div className="col-6 glass-card section-card" style={{ background: 'var(--table-header-bg)', border: '1px solid var(--border-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-cyan">Job Volume Estimator</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Estimated Active Job Pool
                </h4>
              </div>
              <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: '800', color: '#0284c7', background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                Est. Openings = Industry Size × Annual Turnover % × Regional Share % × Seniority Distribution %
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '8px' }}>
                <strong>Purpose:</strong> Extrapolates the true absolute number of open job vacancies using official data. 
              </p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', paddingLeft: '20px', margin: '0' }}>
                <li><strong>Industry Size & Regional Share %:</strong> Sourced from Stats NZ Business Demography Statistics (<code>geographic-units-by-industry-and-statistical-area.csv</code>).</li>
                <li><strong>Annual Turnover %:</strong> Sourced from Stats NZ Linked Employer-Employee Data (<code>STATSNZ,LEED_Q3W.csv</code>), using "Worker separations" divided by "Total filled jobs".</li>
                <li><strong>Seniority Distribution %:</strong> Sourced from the Hays Salary Guide and Absolute IT Tech Report market distribution curves (Junior 20%, Intermediate 45%, Senior 25%, Lead 10%).</li>
              </ul>
            </div>

            {/* Rent-Adjusted Real Purchasing Power */}
            <div className="col-6 glass-card section-card" style={{ background: 'var(--table-header-bg)', border: '1px solid var(--border-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-emerald">Rent Purchasing Power</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Rent-Adjusted Real Purchasing Power Index
                </h4>
              </div>
              <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: '800', color: '#059669', background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                Purchasing Power Index = (Net Discretionary Income / $800.00) × 100
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Where <code>Net Discretionary Income = Median Weekly Wage - Mean Weekly Rent</code>. Measures disposable income remaining after housing costs in each NZ region.
              </p>
            </div>

            {/* Opportunity Score Formula */}
            <div className="col-6 glass-card section-card" style={{ background: 'var(--table-header-bg)', border: '1px solid var(--border-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-indigo">Working-Age Score</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Working-Age Opportunity Score
                </h4>
              </div>
              <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: '800', color: '#4f46e5', background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                Opp Score = (Vacancies per 100k Working-Age / 50.0) × (Median Wage / $1,200) × 100
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Filters out children (&lt;15) and retirees (65+) to measure per-capita job vacancy density relative to active job seekers.
              </p>
            </div>

            {/* Calibrated Level-Specific Opportunity Score */}
            <div className="col-12 glass-card section-card" style={{ background: 'var(--table-header-bg)', border: '1px solid var(--border-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-amber">Level-Specific & Volume-Weighted Score</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Level-Specific Calibrated Industry Opportunity Score
                </h4>
              </div>
              <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: '800', color: '#8b5cf6', background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                Score = (Vacancy Index × Regional Industry Share) × (Level Wage / $1,200) / Competition Index
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <strong>Calibration Rationale:</strong> Corrects the 2007 baseline distortion by multiplying the Index by the real-world <strong>Regional Industry Market Share</strong>. This volume-weighting ensures large markets (e.g., Auckland IT capturing 65% of jobs) correctly score higher than small regions with statistically noisy index jumps. It further adjusts for seniority level salary and competition ratios (Junior vs Senior).
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Official NZ Datasets & Provenance Table */}
        <div style={{ marginBottom: '40px' }}>
          <h3 className="card-title" style={{ fontSize: '1.35rem', marginBottom: '20px', color: 'var(--text-main)' }}>
            <Database size={24} className="text-gradient-cyan" aria-hidden="true" />
            3. Official New Zealand Public Datasets & Provenance Matrix
          </h3>

          <div className="custom-table-container" style={{ marginBottom: '20px' }}>
            <table className="custom-table" aria-label="Dataset Provenance Table">
              <thead>
                <tr>
                  <th scope="col">Dataset Name</th>
                  <th scope="col">Publishing Agency</th>
                  <th scope="col">Project File Location</th>
                  <th scope="col">Time Horizon & Frequency</th>
                  <th scope="col">Key Extracted Variables</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Jobs Online Monthly Series</td>
                  <td>MBIE (Ministry of Business, Innovation and Employment)</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/jol-monthly-unadjusted-series...csv</td>
                  <td>May 2007 – June 2026 (Monthly)</td>
                  <td>National Total Vacancies, 5 Main Regions, 10 ANZSIC Sectors, 5 Skill Levels</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Jobs Online Consolidated Quarterly Series</td>
                  <td>MBIE (Ministry of Business, Innovation and Employment)</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/jobs-online-all-unadjusted...csv</td>
                  <td>December 2010 – March 2026 (Quarterly)</td>
                  <td>Overall Vacancies for 10 NZ Regions, Industry Vacancies per City/Region (100 cells)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Detailed ANZSCO & INZ Green List Release</td>
                  <td>MBIE & Immigration New Zealand</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/jobs-online-detailed-occupational...csv</td>
                  <td>March 2026 Quarter</td>
                  <td>100+ ANZSCO Occupations, Annual Growth %, INZ Green List Visa Status Badges</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Income by Region, Sex & Ethnicity</td>
                  <td>Stats NZ (Tatauranga Aotearoa)</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/Income by sex, region, ethnic...csv</td>
                  <td>1998 – 2025 Annual Census</td>
                  <td>Median & Average Weekly Wage across 12 Regions, Gender Pay & Ethnicity Breakdown</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>IRD Individual Wage & Salary Distributions</td>
                  <td>Inland Revenue Department (IRD)</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/Wage and salary distributions...xlsx</td>
                  <td>2001 – 2025 Annual PAYE Tax Release</td>
                  <td>Census of 2.46M Taxpayers, 10th-99th Percentile Boundaries, $1k Income Bracket Histograms</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Mean Weekly Rent Dataset</td>
                  <td>Stats NZ / MBIE Tenancy Services</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/mean_weekly_rent.csv</td>
                  <td>1993 – 2026 Annual Release</td>
                  <td>Mean Weekly Dollars Rent across 78 Territorial Authorities & 10 Regions</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Unemployment Rate by Sex</td>
                  <td>Stats NZ (Tatauranga Aotearoa)</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/unemployment_rate_by_sex.csv</td>
                  <td>June 2012 – June 2026 Quarters</td>
                  <td>Official NZ Unemployment Rate (5.6%, Men: 5.7%, Women: 5.5%)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Underutilisation Rate by Sex</td>
                  <td>Stats NZ (Tatauranga Aotearoa)</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/underutilisation_rate_by_sex.csv</td>
                  <td>June 2012 – June 2026 Quarters</td>
                  <td>NZ Labor Underutilisation Rate (13.8%, Men: 12.4%, Women: 15.3%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Data Sanitization & Zero Artificial Data Policy */}
        <div className="glass-card section-card" style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
          <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={20} aria-hidden="true" />
            4. Strict Data Hygiene & Zero Artificial Data Policy
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
            In accordance with rigorous data science principles, our Python ETL pipeline (<code>scripts/process_data.py</code>) enforces a strict <strong>Zero Artificial Data Policy</strong>. If a region, city, or industry has missing data in MBIE or Stats NZ source CSVs:
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.8', marginTop: '10px' }}>
            <li>Values evaluate to <code>null</code> / <code>undefined</code> in JSON datasets.</li>
            <li>UI components render explicit <strong>"No data available"</strong> banners or <strong>"N/A"</strong> tags.</li>
            <li>No dummy numbers, synthetic fallbacks, or arbitrary values are ever invented or generated.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
