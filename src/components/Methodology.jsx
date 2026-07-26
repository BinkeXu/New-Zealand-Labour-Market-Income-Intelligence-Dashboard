import React from 'react';
import { Database, ShieldCheck, Calculator, CheckCircle, HelpCircle, FileText, Layers, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Methodology() {
  return (
    <div className="section-grid">
      <section className="glass-card section-card col-12" aria-labelledby="methodology-title">
        <div style={{ marginBottom: '28px' }}>
          <h2 id="methodology-title" className="hero-title" style={{ fontSize: '2rem' }}>
            Data Architecture, Provenance & <span className="text-gradient">Methodology Transparency</span>
          </h2>
          <p className="hero-desc" style={{ fontSize: '1.05rem' }}>
            Full technical specification detailing data provenance, mathematical calculation formulas, working-age population filtering, and data sanitization standards for the New Zealand Labour Market & Income Intelligence Dashboard.
          </p>
        </div>

        {/* SECTION 1: Calculation Formulas & Definitions */}
        <div style={{ marginBottom: '40px' }}>
          <h3 className="card-title" style={{ fontSize: '1.35rem', marginBottom: '20px', color: 'var(--text-main)' }}>
            <Calculator size={24} className="text-gradient" aria-hidden="true" />
            1. Step-by-Step Mathematical Calculation Formulas
          </h3>

          <div className="section-grid" style={{ marginBottom: '24px' }}>
            {/* Opportunity Score Formula */}
            <div className="col-12 glass-card section-card" style={{ background: 'var(--table-header-bg)', border: '1px solid var(--border-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-indigo" style={{ fontSize: '0.85rem' }}>Core Metric</span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Working-Age Population-Adjusted Opportunity Score
                </h4>
              </div>
              <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '12px', overflowX: 'auto' }}>
                Opportunity Score = (Vacancies Per 100k Working-Age / 50.0) × (Median Weekly Income / $1,200.00) × 100
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Demographic Filtering:</strong> Uses Stats NZ Census <strong>Working-Age Population (Ages 15–64)</strong>, excluding children under 15/18 and retirees 65+ who do not participate in the active job market. Calculating <em>Vacancies Per 100k Working-Age Residents</em> measures job density against actual job seekers. Multiplying by median weekly earnings ($1,200 baseline) balances job density with regional living standards.
              </p>
            </div>

            {/* Per-Capita Vacancy Density */}
            <div className="col-6 glass-card section-card">
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#4f46e5" aria-hidden="true" />
                Vacancies Per 100k Working-Age (Ages 15–64)
              </h4>
              <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', background: 'var(--table-header-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px' }}>
                Vacancies / 100k = (MBIE Vacancy Index / Working-Age Population [15-64]) × 100,000
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Normalizes MBIE job opening volume against active working-age residents to measure true job availability per job seeker.
              </p>
            </div>

            {/* Hourly Wage Metric */}
            <div className="col-6 glass-card section-card">
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={18} color="#059669" aria-hidden="true" />
                Hourly Wage Conversion (40 hr/wk Baseline)
              </h4>
              <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: '700', color: '#059669', background: 'var(--table-header-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px' }}>
                Hourly Wage ($/hr) = Stats NZ Median Weekly Income / 40.0 hours
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Converts Stats NZ weekly earnings into standard hourly rates based on the New Zealand full-time standard 40-hour work week.
              </p>
            </div>

            {/* Annualized Salary */}
            <div className="col-6 glass-card section-card">
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#d97706" aria-hidden="true" />
                Annualized Salary Benchmark
              </h4>
              <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: '700', color: '#d97706', background: 'var(--table-header-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px' }}>
                Annualized Salary ($/yr) = Stats NZ Median Weekly Income × 52.0 weeks
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Projects weekly earnings into annual salaries to allow job seekers to compare full-time compensation packages.
              </p>
            </div>

            {/* YoY Vacancy Growth */}
            <div className="col-6 glass-card section-card">
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#0284c7" aria-hidden="true" />
                Year-over-Year (YoY) Vacancy Growth (%)
              </h4>
              <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: '700', color: '#0284c7', background: 'var(--table-header-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px' }}>
                YoY Growth % = ((Index_Current - Index_PrevYear) / Index_PrevYear) × 100
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Calculates the 12-month percentage change in online job postings for specific industries and regions (comparing March 2026 quarter vs March 2025 quarter).
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Dataset Provenance & Data Sources */}
        <div style={{ marginBottom: '40px' }}>
          <h3 className="card-title" style={{ fontSize: '1.35rem', marginBottom: '20px', color: 'var(--text-main)' }}>
            <Database size={24} className="text-gradient-cyan" aria-hidden="true" />
            2. Official New Zealand Public Datasets & Provenance
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
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Jobs Online Monthly Unadjusted Series</td>
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
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Detailed ANZSCO Occupational Release</td>
                  <td>MBIE (Ministry of Business, Innovation and Employment)</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/jobs-online-detailed-occupational...csv</td>
                  <td>March 2026 Quarter</td>
                  <td>100+ 4-digit ANZSCO Role Titles, ANZSCO Codes, Annual Percentage Changes</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Income by Region, Sex & Ethnicity</td>
                  <td>Stats NZ (Tatauranga Aotearoa)</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/Income by sex, region, ethnic...csv</td>
                  <td>1998 – 2025 Annual Household Income Census</td>
                  <td>Median & Average Weekly Wage and Salary Income across 12 Regional Councils</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Census Working-Age Population (Ages 15-64)</td>
                  <td>Stats NZ (Tatauranga Aotearoa)</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Dataset/active/Census_Population_by_age...csv</td>
                  <td>2001, 2006, 2013 Census Population Release</td>
                  <td>Working-Age Population Counts per Regional Council (excluding under 15 & 65+)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: Data Sanitization & Zero Artificial Data Standard */}
        <div className="glass-card section-card" style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
          <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={20} aria-hidden="true" />
            3. Strict Data Hygiene & Zero Artificial Data Standard
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
