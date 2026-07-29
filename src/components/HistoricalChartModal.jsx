import React, { useState, useMemo } from 'react';
import { X, Database } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import DownloadCSVButton from './DownloadCSVButton';

/**
 * HistoricalChartModal — completely rewritten to fix rendering bugs.
 *
 * Root cause of previous failures:
 *   Recharts <Line yAxisId={undefined}> conflicts with a <YAxis> that has
 *   no explicit yAxisId. Recharts silently swallows the error and renders
 *   nothing. Fix: never pass yAxisId to <Line> when using a single Y axis.
 *
 * This version:
 *   1. Separates the chart JSX for single-axis vs dual-axis metrics
 *   2. Never passes yAxisId when there is only one Y axis
 *   3. Uses useMemo for data preparation
 *   4. Adds console.log breadcrumbs for debugging
 */
export default function HistoricalChartModal({ isOpen, onClose, modalMetric, extraData, monthlyData, regionalData }) {
  const [modalTimeRange, setModalTimeRange] = useState('All');

  // Compute chart configuration based on modalMetric
  const chartConfig = useMemo(() => {
    if (!modalMetric) return null;

    const hlfs = monthlyData?.metadata?.hlfs_labor_metrics || {};

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
        title: `ANZSCO ${extraData.code}: ${extraData.title} — Demand Trajectory`,
        subtitle: `58-quarter historical series tracking YoY demand growth percentage for ${extraData.title}.`,
        source: "MBIE Jobs Online Detailed ANZSCO Occupation Dataset (2011 – 2026)",
        filename: `anzsco_${extraData.code}_demand_history.csv`,
        rangeOptions: ['1Y', '3Y', '5Y', 'All'],
        xKey: "quarter",
        dualAxis: false,
        lines: [
          { key: "Annual Growth (%)", color: "#4f46e5", width: 3 },
        ],
        fullData: data,
        sliceMap: { '1Y': 4, '3Y': 12, '5Y': 20 },
      };
    }

    return null;
  }, [modalMetric, monthlyData, regionalData, extraData]);

  // Don't render if closed or no config
  if (!isOpen || !modalMetric || !chartConfig) return null;

  // Slice data by time range
  const { fullData, sliceMap } = chartConfig;
  let displayData = fullData;
  if (modalTimeRange !== 'All' && sliceMap[modalTimeRange]) {
    const count = sliceMap[modalTimeRange];
    displayData = fullData.slice(Math.max(0, fullData.length - count));
  }

  // Debug logging — check browser console if chart still doesn't render


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'var(--table-header-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-main)', cursor: 'pointer', zIndex: 10
          }}
          aria-label="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 20, paddingRight: 44 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            <span className="badge badge-indigo">Historical Time-Series Analytics</span>
            <div className="filter-group" role="group" aria-label="Time Range Selector">
              {chartConfig.rangeOptions.map(range => (
                <button
                  key={range}
                  className={`filter-btn ${modalTimeRange === range ? 'active' : ''}`}
                  onClick={() => setModalTimeRange(range)}
                  aria-pressed={modalTimeRange === range}
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
            {chartConfig.title}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {chartConfig.subtitle}
          </p>
        </div>

        {/* Chart Area */}
        <div style={{ width: '100%', height: 360, marginBottom: 20 }}>
          {displayData.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No historical trend data available for this metric.
            </div>
          ) : chartConfig.dualAxis ? (
            /* ===== DUAL Y-AXIS CHART (income only) ===== */
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={chartConfig.xKey} stroke="var(--text-muted)" fontSize={11} interval="preserveStartEnd" />
                <YAxis yAxisId="left" stroke="#059669" fontSize={11} orientation="left"
                  label={{ value: chartConfig.leftAxisLabel, angle: -90, position: 'insideLeft', fill: '#059669' }} />
                <YAxis yAxisId="right" stroke="#0284c7" fontSize={11} orientation="right"
                  label={{ value: chartConfig.rightAxisLabel, angle: 90, position: 'insideRight', fill: '#0284c7' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-accent)', borderRadius: 12, color: 'var(--text-main)' }} />
                <Legend verticalAlign="top" height={36} />
                {chartConfig.lines.map((l, i) => (
                  <Line key={i} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={l.width}
                    yAxisId={l.axis} dot={displayData.length <= 15} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            /* ===== SINGLE Y-AXIS CHART (vacancy, unemployment, underutilisation, anzsco) ===== */
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={chartConfig.xKey} stroke="var(--text-muted)" fontSize={11} interval="preserveStartEnd" />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-accent)', borderRadius: 12, color: 'var(--text-main)' }} />
                <Legend verticalAlign="top" height={36} />
                {chartConfig.lines.map((l, i) => (
                  <Line key={i} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={l.width}
                    dot={displayData.length <= 15} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Detailed Income Source Breakdown Metrics */}
        {chartConfig.extraBreakdown && (
          <div style={{ background: 'var(--table-header-bg)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid var(--border-accent)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: chartConfig.extraBreakdown.color || 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📊 Stats NZ Income Breakdown & Demographics ({chartConfig.extraBreakdown.source_name})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Median Weekly Wage</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  ${chartConfig.extraBreakdown.median_weekly != null ? chartConfig.extraBreakdown.median_weekly.toLocaleString() : 'N/A'} / wk
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                  ${chartConfig.extraBreakdown.median_hourly != null ? chartConfig.extraBreakdown.median_hourly.toFixed(2) : 'N/A'} / hr
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Weekly Wage</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  ${chartConfig.extraBreakdown.average_weekly != null ? chartConfig.extraBreakdown.average_weekly.toLocaleString() : 'N/A'} / wk
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>
                  ${chartConfig.extraBreakdown.average_hourly != null ? chartConfig.extraBreakdown.average_hourly.toFixed(2) : 'N/A'} / hr
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annualized Median</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>
                  ${chartConfig.extraBreakdown.annualized_median != null ? chartConfig.extraBreakdown.annualized_median.toLocaleString() : 'N/A'} / yr
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  52-week baseline
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recipients / Workforce</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#d97706' }}>
                  {chartConfig.extraBreakdown.people_count_thousands != null ? `${(chartConfig.extraBreakdown.people_count_thousands / 1000).toFixed(2)}M people` : 'N/A'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {chartConfig.extraBreakdown.people_count_thousands ? `${chartConfig.extraBreakdown.people_count_thousands.toLocaleString()}k count` : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <div className="data-source-caption">
            <Database size={14} aria-hidden="true" />
            <span>Data Source: {chartConfig.source}</span>
          </div>
          <DownloadCSVButton data={displayData} filename={chartConfig.filename} label="Export Historical CSV" />
        </div>

      </div>
    </div>
  );
}
