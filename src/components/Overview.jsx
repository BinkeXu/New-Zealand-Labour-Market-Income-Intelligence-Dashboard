import React, { useState, useMemo } from 'react';
import KPICards from './KPICards';
import HistoricalChartModal from './HistoricalChartModal';
import PercentileCalculator from './PercentileCalculator';
import { useDashboardData, useNavigation } from '../context/DashboardContext';
import { selectOverviewChartData, selectNationalIncomeDistribution } from '../utils/selectors';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar 
} from 'recharts';
import { 
  Calendar, Database, ArrowUpRight, TrendingUp, Info, PieChart, Users, DollarSign, Layers, CheckCircle, Calculator, Award 
} from 'lucide-react';

export default function Overview() {
  const { monthlyData, regionalData, irdIncomeData } = useDashboardData();
  const { setActiveTab } = useNavigation();
  const [timeRange, setTimeRange] = useState('5Y');
  const [activeModalMetric, setActiveModalMetric] = useState(null);
  const [activeModalData, setActiveModalData] = useState(null);

  // Memoized Selector for Time Series Chart Data
  const chartData = useMemo(() => {
    return selectOverviewChartData(monthlyData, timeRange);
  }, [monthlyData, timeRange]);

  // National Income Distribution Data
  const nationalIncomeData = useMemo(() => {
    return selectNationalIncomeDistribution(regionalData);
  }, [regionalData]);

  // Extract Metadata for Last Updated Date
  const lastUpdatedDate = monthlyData?.metadata?.last_updated || 'June 2026';
  const totalRecords = monthlyData?.metadata?.total_records || 230;

  return (
    <div>
      {/* Executive KPI Summary Cards with Modal Graph Triggers */}
      <KPICards 
        monthlyData={monthlyData} 
        regionalData={regionalData} 
        onOpenModal={(metricId) => {
          setActiveModalData(null);
          setActiveModalMetric(metricId);
        }}
      />

      {/* Historical Trend Chart Modal */}
      <HistoricalChartModal 
        isOpen={!!activeModalMetric}
        onClose={() => {
          setActiveModalMetric(null);
          setActiveModalData(null);
        }}
        modalMetric={activeModalMetric}
        extraData={activeModalData}
        monthlyData={monthlyData}
        regionalData={regionalData}
      />

      {/* SECTION 1: NZ Job Vacancy Trajectory Line Chart */}
      <section className="glass-card section-card" style={{ marginBottom: '28px' }} aria-labelledby="vacancy-trajectory-title">
        <div className="card-header-flex" style={{ alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h2 id="vacancy-trajectory-title" className="card-title">
                <TrendingUp size={24} className="text-gradient" aria-hidden="true" />
                New Zealand Job Vacancy Index Trajectory
              </h2>
              <span className="badge badge-indigo" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                <Calendar size={13} style={{ marginRight: '4px' }} aria-hidden="true" />
                Latest Release: {lastUpdatedDate}
              </span>
            </div>
            <p className="card-subtitle">
              Time-series tracking of MBIE online job postings across major NZ regions and skill tiers ({totalRecords} monthly records tracked from May 2007). Select time horizon below.
            </p>
          </div>

          {/* Time Horizon Button Selector */}
          <div className="nav-tabs" role="group" aria-label="Chart Time Range Selector">
            {['3M', '6M', '1Y', '3Y', '5Y', 'All'].map((range) => (
              <button
                key={range}
                className={`nav-tab-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
                aria-pressed={timeRange === range}
                style={{ padding: '6px 14px', minHeight: '34px', fontSize: '0.8rem' }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ width: '100%', height: 380, marginBottom: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} interval="preserveStartEnd" />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-accent)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-card)',
                  color: 'var(--text-main)' 
                }} 
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="Overall Vacancies" stroke="#4f46e5" strokeWidth={3.5} dot={timeRange === '3M' || timeRange === '6M'} name="NZ Overall Total" />
              <Line type="monotone" dataKey="Auckland" stroke="#0284c7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Wellington" stroke="#059669" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Canterbury" stroke="#d97706" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Highly Skilled" stroke="#9333ea" strokeDasharray="4 4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Data Source Attribution */}
        <div className="data-source-caption">
          <Database size={14} aria-hidden="true" />
          <span>Data Source: MBIE Jobs Online Monthly Series (Unadjusted, Index = May 2007 baseline) • Last Updated: {lastUpdatedDate}</span>
        </div>
      </section>

      {/* SECTION 2: National Income Distribution Analysis */}
      {nationalIncomeData && (
        <section className="glass-card section-card" style={{ marginBottom: '28px' }} aria-labelledby="income-distribution-title">
          <div className="card-header-flex" style={{ marginBottom: '20px' }}>
            <div>
              <h2 id="income-distribution-title" className="card-title">
                <PieChart size={22} className="text-gradient-cyan" aria-hidden="true" />
                New Zealand National Income Distribution & Pay Benchmarks
              </h2>
              <p className="card-subtitle">
                Official Stats NZ Household Income Census breakdown across income sources, ethnicity demographics, gender pay metrics, and national pay tiers.
              </p>
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.85rem' }}>
              Stats NZ Official Census Data (2025)
            </span>
          </div>

          <div className="section-grid" style={{ marginBottom: '24px' }}>
            {/* Income Source Breakdown Table */}
            <div className="col-12 glass-card section-card" style={{ background: 'var(--table-header-bg)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="#059669" aria-hidden="true" />
                1. National Income Distribution by Source (Wages, Self-Employment & Transfers)
              </h3>

              <div className="custom-table-container">
                <table className="custom-table" aria-label="National Income Source Breakdown Table">
                  <thead>
                    <tr>
                      <th scope="col">Income Source Category</th>
                      <th scope="col">Description</th>
                      <th scope="col">Median Weekly Wage</th>
                      <th scope="col">Hourly Rate (40 hr/wk)</th>
                      <th scope="col">Average Weekly Wage</th>
                      <th scope="col">Workforce / Population Count</th>
                      <th scope="col">Interactive Graph</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nationalIncomeData.income_sources.map((item, idx) => (
                      <tr 
                        key={idx} 
                        style={{ cursor: 'pointer', backgroundColor: item.source_name.includes('Wage') ? 'rgba(79,70,229,0.05)' : 'transparent' }}
                        onClick={() => {
                          setActiveModalData(item);
                          setActiveModalMetric('income_source');
                        }}
                        title={`Click to view 28-year historical trend & detailed breakdown for ${item.source_name}`}
                      >
                        <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span 
                              style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%', 
                                backgroundColor: item.color || '#4f46e5', 
                                display: 'inline-block',
                                flexShrink: 0
                              }} 
                              aria-hidden="true" 
                            />
                            <span>{item.source_name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          {item.description}
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: '700', color: item.color || '#4f46e5' }}>
                          ${item.median_weekly != null ? item.median_weekly.toLocaleString() : 'N/A'} / wk
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: '700', color: '#059669' }}>
                          ${item.median_hourly != null ? item.median_hourly.toFixed(2) : 'N/A'} / hr
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: '600' }}>
                          ${item.average_weekly != null ? item.average_weekly.toLocaleString() : 'N/A'} / wk
                        </td>
                        <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {item.people_count_thousands != null ? `${(item.people_count_thousands / 1000).toFixed(2)}M people (${item.people_count_thousands.toLocaleString()}k)` : 'N/A'}
                        </td>
                        <td>
                          <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <TrendingUp size={12} /> View 28Yr Graph
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Demographic & Ethnicity Distribution Chart */}
            <div className="col-6 glass-card section-card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#4f46e5" aria-hidden="true" />
                2. Median Earnings by Ethnicity Demographic ($/hr)
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Median hourly and weekly wage distribution across ethnic groups (Stats NZ Census).
              </p>

              <div style={{ width: '100%', height: 220, marginBottom: '12px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nationalIncomeData.ethnicity_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="ethnic_group" stroke="var(--text-muted)" fontSize={10} interval={0} angle={-20} textAnchor="end" />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        borderColor: 'var(--border-accent)',
                        borderRadius: '10px',
                        color: 'var(--text-main)' 
                      }} 
                    />
                    <Bar dataKey="median_hourly" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Hourly Wage ($/hr)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                {nationalIncomeData.ethnicity_distribution.map((eth, idx) => (
                  <div key={idx} style={{ background: 'var(--table-header-bg)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{eth.ethnic_group}:</span>
                    <strong style={{ color: 'var(--primary)' }}>${eth.median_hourly?.toFixed(2)}/hr</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender Income Distribution & Quintiles */}
            <div className="col-6 glass-card section-card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#d97706" aria-hidden="true" />
                3. Gender Income Distribution & Pay Tiers
              </h3>

              {/* Gender Pay Gap Metric */}
              <div style={{ background: 'var(--table-header-bg)', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Gender Median Earnings Differential:
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>Male: </span>
                    <strong style={{ color: '#059669', fontSize: '1.05rem' }}>$37.50 / hr</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> ($1,500/wk)</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>Female: </span>
                    <strong style={{ color: '#4f46e5', fontSize: '1.05rem' }}>$31.18 / hr</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> ($1,247/wk)</span>
                  </div>
                </div>
              </div>

              {/* Income Quintiles / Tiers */}
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                National Income Tiers & Pay Brackets:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {nationalIncomeData.income_quintiles.map((q) => (
                  <div key={q.tier} style={{ background: 'var(--table-header-bg)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.825rem', color: 'var(--text-main)' }}>{q.tier}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.description}</div>
                    </div>
                    <span className="badge badge-indigo tabular-nums" style={{ fontSize: '0.8rem', fontWeight: '800' }}>
                      {q.hourly_range}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Global CTA */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '30px' }}>
          <button className="btn btn-outline" onClick={() => setActiveTab('regional')} style={{ flex: 1, padding: '14px', borderRadius: '12px' }}>
            View Regional Map <ArrowUpRight size={18} style={{ marginLeft: '6px' }} />
          </button>
          <button className="btn btn-outline" onClick={() => setActiveTab('industry')} style={{ flex: 1, padding: '14px', borderRadius: '12px' }}>
            Explore Industry Quadrants <ArrowUpRight size={18} style={{ marginLeft: '6px' }} />
          </button>
        </div>

          <div className="data-source-caption">
            <Database size={14} aria-hidden="true" />
            <span>Data Source: Stats NZ Household Labour Force Survey & Annual Household Income Census (2025 Release)</span>
          </div>
        </section>
      )}

      {/* SECTION 4: IRD Tax Census Individual Wage & Salary Percentile Calculator & Distribution */}
      {irdIncomeData && (
        <section className="glass-card section-card" style={{ marginBottom: '28px' }} aria-labelledby="ird-percentile-title">
          <div className="card-header-flex">
            <div>
              <h2 id="ird-percentile-title" className="card-title">
                <Calculator size={22} className="text-gradient" aria-hidden="true" />
                NZ Wage & Salary Percentile Calculator & Distribution (Official IRD Tax Census Data)
              </h2>
              <p className="card-subtitle">
                Based on 2.46M official PAYE individual tax returns filed with Inland Revenue Department (IRD). Calculate your exact NZ income percentile rank.
              </p>
            </div>

            <div className="data-source-caption" style={{ marginTop: '4px' }}>
              <Database size={14} aria-hidden="true" />
              <span>Source: IRD PAYE Individual Returns ({irdIncomeData.metadata.last_updated})</span>
            </div>
          </div>

          <PercentileCalculator irdIncomeData={irdIncomeData} />
        </section>
      )}

      {/* Navigation Quick Action Cards */}
      <div className="section-grid">
        <div 
          className="glass-card section-card col-6" 
          style={{ cursor: 'pointer' }} 
          onClick={() => setActiveTab('regional')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('regional'); }}
          role="button"
          tabIndex={0}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Regional & City Breakdown</h3>
            <ArrowUpRight size={20} className="text-gradient" aria-hidden="true" />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Explore working-age population density, vacancies per 100k active residents, and industry breakdown across 10 NZ regions.
          </p>
        </div>

        <div 
          className="glass-card section-card col-6" 
          style={{ cursor: 'pointer' }} 
          onClick={() => setActiveTab('industry')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('industry'); }}
          role="button"
          tabIndex={0}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Industry 2x2 Matrix & ANZSCO Roles</h3>
            <ArrowUpRight size={20} className="text-gradient-cyan" aria-hidden="true" />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Discover Star sectors, fast-growing 4-digit ANZSCO roles, and salary benchmarks for high-career progression.
          </p>
        </div>
      </div>
    </div>
  );
}
