import React, { useState, useMemo } from 'react';
import { X, Database, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import DownloadCSVButton from './DownloadCSVButton';

export default function HistoricalChartModal({ isOpen, onClose, modalMetric, extraData, monthlyData, regionalData }) {
  const [modalTimeRange, setModalTimeRange] = useState('All');

  // Compute chart configuration based on modalMetric
  const chartConfig = useMemo(() => {
    if (!modalMetric) return null;

    const hlfs = monthlyData?.metadata?.hlfs_labor_metrics || {};

    // --- OPPORTUNITY SCORE ---
    if (modalMetric === 'opportunity_score') {
      const regions = regionalData?.regions || [];
      const data = [...regions].map(r => ({
        region: r.region_name,
        "Opportunity Score (pts)": r.opportunity_score,
        "Vacancies per 100k": r.vacancies_per_100k,
        "Median Weekly Wage ($)": r.median_weekly_income,
        "Mean Rent ($/wk)": r.mean_weekly_rent
      })).sort((a, b) => (b["Opportunity Score (pts)"] || 0) - (a["Opportunity Score (pts)"] || 0));

      return {
        title: "NZ Regional Working-Age Opportunity Score Comparison (2026)",
        subtitle: "Comprehensive evaluation of job vacancy density per 100k Working-Age residents (Ages 15-64) against Stats NZ median weekly earnings.",
        source: "MBIE Jobs Online & Stats NZ Census Working-Age Population (2026)",
        filename: "nz_regional_opportunity_scores.csv",
        rangeOptions: ['All'],
        xKey: "region",
        isBarChart: true,
        dualAxis: false,
        lines: [
          { key: "Opportunity Score (pts)", color: "#8b5cf6", width: 3 }
        ],
        fullData: data,
        sliceMap: {}
      };
    }

    // --- VACANCY ---
    if (modalMetric === 'vacancy') {
      let data = [];
      if (monthlyData?.dates && monthlyData?.totals) {
        data = monthlyData.dates.map((d, i) => ({
          date: d,
          "NZ Total Vacancies": monthlyData.totals[i],
          "Auckland": monthlyData.regions?.['Auckland']?.[i] ?? null,
          "Wellington": monthlyData.regions?.['Wellington']?.[i] ?? null,
          "Canterbury": monthlyData.regions?.['Canterbury']?.[i] ?? null,
        }));
      }
      return {
        title: "NZ Job Vacancy Index Historical Trajectory (2007 – 2026)",
        subtitle: "Monthly time series tracking total MBIE online job advertisement postings across New Zealand (Index baseline = May 2007 = 100).",
        source: "MBIE Jobs Online Monthly Series (May 2007 – June 2026)",
        filename: "nz_job_vacancy_monthly_history.csv",
        rangeOptions: ['1Y', '3Y', '5Y', 'All'],
        xKey: "date",
        dualAxis: false,
        lines: [
          { key: "NZ Total Vacancies", color: "#4f46e5", width: 3 },
          { key: "Auckland", color: "#0284c7", width: 2 },
          { key: "Wellington", color: "#059669", width: 2 },
          { key: "Canterbury", color: "#d97706", width: 2 },
        ],
        fullData: data,
        sliceMap: { '1Y': 12, '3Y': 36, '5Y': 60 },
      };
    }

    // --- INCOME ---
    if (modalMetric === 'income') {
      const incHist = regionalData?.national_income_distribution?.historical_income_series || [];
      const data = incHist.map(item => ({
        year: String(item.year),
        "Median Weekly Wage ($/wk)": item.median_weekly,
        "Hourly Equivalent ($/hr)": item.median_hourly,
      }));
      return {
        title: "NZ National Median Income Historical Growth (1998 – 2025)",
        subtitle: "28-year annual series tracking Stats NZ Household Income Census median weekly earnings ($/wk) and hourly equivalents ($/hr).",
        source: "Stats NZ Household Labour Force Survey & Annual Income Census (1998 – 2025)",
        filename: "nz_national_income_28yr_history.csv",
        rangeOptions: ['5Y', '10Y', 'All'],
        xKey: "year",
        dualAxis: true,
        leftAxisLabel: "Weekly Wage ($)",
        rightAxisLabel: "Hourly Wage ($)",
        lines: [
          { key: "Median Weekly Wage ($/wk)", color: "#059669", width: 3, axis: "left" },
          { key: "Hourly Equivalent ($/hr)", color: "#0284c7", width: 2, axis: "right" },
        ],
        fullData: data,
        sliceMap: { '5Y': 5, '10Y': 10 },
      };
    }

    // --- UNEMPLOYMENT ---
    if (modalMetric === 'unemployment') {
      const hist = hlfs.historical_unemployment || [
        { quarter: "Mar-26", total: 5.3, men: 5.4, women: 5.3 }
      ];
      const data = hist.map(item => ({
        quarter: item.quarter,
        "Total Unemployment Rate (%)": item.total,
        "Men (%)": item.men,
        "Women (%)": item.women,
      }));
      return {
        title: "NZ Official Unemployment Rate Historical Series (2012 – 2026)",
        subtitle: "57 quarterly series tracking official Stats NZ HLFS seasonally adjusted unemployment rates (%) overall and by gender.",
        source: "Stats NZ Household Labour Force Survey (March 2012 – March 2026)",
        filename: "nz_unemployment_rate_14yr_history.csv",
        rangeOptions: ['1Y', '3Y', '5Y', 'All'],
        xKey: "quarter",
        dualAxis: false,
        lines: [
          { key: "Total Unemployment Rate (%)", color: "#e11d48", width: 3 },
          { key: "Men (%)", color: "#0284c7", width: 2 },
          { key: "Women (%)", color: "#9333ea", width: 2 },
        ],
        fullData: data,
        sliceMap: { '1Y': 4, '3Y': 12, '5Y': 20 },
      };
    }

    // --- UNDERUTILISATION ---
    if (modalMetric === 'underutilisation') {
      const hist = hlfs.historical_underutilisation || [
        { quarter: "Mar-26", total: 12.9, men: 11.6, women: 14.3 }
      ];
      const data = hist.map(item => ({
        quarter: item.quarter,
        "Total Underutilisation Rate (%)": item.total,
        "Men (%)": item.men,
        "Women (%)": item.women,
      }));
      return {
        title: "NZ Labor Underutilisation Rate Historical Series (2012 – 2026)",
        subtitle: "57 quarterly series tracking total labor slack (unemployed + underemployed part-time workers who desire more hours).",
        source: "Stats NZ HLFS Underutilisation Release (2012 – 2026)",
        filename: "nz_labor_underutilisation_14yr_history.csv",
        rangeOptions: ['1Y', '3Y', '5Y', 'All'],
        xKey: "quarter",
        dualAxis: false,
        lines: [
          { key: "Total Underutilisation Rate (%)", color: "#d97706", width: 3 },
          { key: "Men (%)", color: "#0284c7", width: 2 },
          { key: "Women (%)", color: "#9333ea", width: 2 },
        ],
        fullData: data,
        sliceMap: { '1Y': 4, '3Y': 12, '5Y': 20 },
      };
    }

    // --- INCOME SOURCE SPECIFIC (Wages, Self-Employment, Transfers, All Sources) ---
    if (modalMetric === 'income_source' && extraData) {
      const srcHist = extraData.historical_series || [];
      const data = srcHist.map(item => ({
        year: String(item.year),
        "Median Weekly Wage ($/wk)": item.median_weekly,
        "Hourly Equivalent ($/hr)": item.median_hourly,
      }));
      return {
        title: `NZ ${extraData.source_name}: 28-Year Historical Trajectory (1998 – 2025)`,
        subtitle: `${extraData.description}. ${extraData.policy_note || ''}`,
        source: "Stats NZ Household Labour Force Survey & Annual Household Income Census (2025 Release)",
        filename: `nz_${extraData.source_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_history.csv`,
        rangeOptions: ['5Y', '10Y', 'All'],
        xKey: "year",
        dualAxis: true,
        leftAxisLabel: "Weekly Wage ($)",
        rightAxisLabel: "Hourly Wage ($)",
        extraBreakdown: extraData,
        lines: [
          { key: "Median Weekly Wage ($/wk)", color: extraData.color || "#4f46e5", width: 3, axis: "left" },
          { key: "Hourly Equivalent ($/hr)", color: "#0284c7", width: 2, axis: "right" },
        ],
        fullData: data,
        sliceMap: { '5Y': 5, '10Y': 10 },
      };
    }

    // --- ANZSCO OCCUPATION ---
    if (modalMetric === 'anzsco' && extraData) {
      const roleHist = extraData.historical_quarters || [];
      const data = roleHist.map(item => ({
        quarter: item.date,
        "Annual Growth (%)": item.annual_change,
      }));
      return {
        title: `${extraData.title} (ANZSCO ${extraData.code}): 58-Quarter Demand Trajectory`,
        subtitle: `Occupational demand index trajectory across 58 historical quarters (2011–2026). Hourly Range: ${extraData.estimated_hourly_range}. Green List: ${extraData.inz_green_list_tier || 'Standard Pathway'}.`,
        source: "MBIE Jobs Online Detailed ANZSCO Quarterly Series (2011 – 2026)",
        filename: `nz_anzsco_${extraData.code}_history.csv`,
        rangeOptions: ['1Y', '3Y', '5Y', 'All'],
        xKey: "quarter",
        dualAxis: false,
        lines: [
          { key: "Annual Growth (%)", color: "#4f46e5", width: 3 }
        ],
        fullData: data,
        sliceMap: { '1Y': 4, '3Y': 12, '5Y': 20 },
      };
    }

    return null;
  }, [modalMetric, extraData, monthlyData, regionalData]);

  // Filter fullData according to modalTimeRange
  const displayData = useMemo(() => {
    if (!chartConfig || !chartConfig.fullData) return [];
    if (modalTimeRange === 'All' || !chartConfig.sliceMap || !chartConfig.sliceMap[modalTimeRange]) {
      return chartConfig.fullData;
    }
    const count = chartConfig.sliceMap[modalTimeRange];
    return chartConfig.fullData.slice(-count);
  }, [chartConfig, modalTimeRange]);

  if (!isOpen || !chartConfig) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="glass-card modal-content" style={{ maxWidth: '850px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
              {chartConfig.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {chartConfig.subtitle}
            </p>
          </div>
          <button onClick={onClose} className="filter-btn" style={{ padding: '6px', cursor: 'pointer' }} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Range Controls & Export */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div className="nav-tabs">
            {chartConfig.rangeOptions.map((range) => (
              <button
                key={range}
                className={`nav-tab-btn ${modalTimeRange === range ? 'active' : ''}`}
                onClick={() => setModalTimeRange(range)}
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                {range}
              </button>
            ))}
          </div>

          <DownloadCSVButton 
            data={displayData}
            filename={chartConfig.filename}
            label="Export Modal Data"
          />
        </div>

        {/* Dynamic Chart */}
        <div style={{ width: '100%', height: 320, marginBottom: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartConfig.isBarChart ? (
              <BarChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={chartConfig.xKey} stroke="var(--text-muted)" fontSize={11} interval={0} angle={-25} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-accent)',
                    borderRadius: '10px',
                    color: 'var(--text-main)' 
                  }} 
                />
                <Bar dataKey="Opportunity Score (pts)" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Opportunity Score (pts)" />
              </BarChart>
            ) : chartConfig.dualAxis ? (
              <LineChart data={displayData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={chartConfig.xKey} stroke="var(--text-muted)" fontSize={11} />
                <YAxis yAxisId="left" stroke="#059669" fontSize={11} label={{ value: chartConfig.leftAxisLabel, angle: -90, position: 'insideLeft', fill: '#059669' }} />
                <YAxis yAxisId="right" stroke="#0284c7" fontSize={11} orientation="right" label={{ value: chartConfig.rightAxisLabel, angle: 90, position: 'insideRight', fill: '#0284c7' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-accent)',
                    borderRadius: '10px',
                    color: 'var(--text-main)' 
                  }} 
                />
                <Legend verticalAlign="top" height={36} />
                {chartConfig.lines.map((l) => (
                  <Line
                    key={l.key}
                    yAxisId={l.axis}
                    type="monotone"
                    dataKey={l.key}
                    stroke={l.color}
                    strokeWidth={l.width}
                    dot={false}
                  />
                ))}
              </LineChart>
            ) : (
              <LineChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={chartConfig.xKey} stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-accent)',
                    borderRadius: '10px',
                    color: 'var(--text-main)' 
                  }} 
                />
                <Legend verticalAlign="top" height={36} />
                {chartConfig.lines.map((l) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    stroke={l.color}
                    strokeWidth={l.width}
                    dot={false}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Data Source Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={14} aria-hidden="true" />
            <span>{chartConfig.source}</span>
          </div>
          <button onClick={onClose} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
