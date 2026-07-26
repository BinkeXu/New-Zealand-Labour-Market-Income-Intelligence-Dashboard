import React, { useState, useMemo } from 'react';
import KPICards from './KPICards';
import { selectOverviewChartData } from '../utils/selectors';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  AreaChart, Area 
} from 'recharts';
import { Sparkles, TrendingUp, Compass, ArrowRight, Layers, Database, AlertCircle } from 'lucide-react';

export default function Overview({ monthlyData, regionalData, onNavigate }) {
  const [timeRange, setTimeRange] = useState('5Y'); // 1Y, 3Y, 5Y, All

  // Memoized Chart Data Selector
  const chartData = useMemo(() => {
    return selectOverviewChartData(monthlyData, timeRange);
  }, [monthlyData, timeRange]);

  if (!monthlyData || !monthlyData.dates || monthlyData.dates.length === 0) {
    return (
      <div className="glass-card section-card" role="status" aria-live="polite">
        <div className="no-data-banner">
          <AlertCircle size={20} aria-hidden="true" />
          <span>No vacancy trend data available. Ensure the ETL pipeline has executed successfully.</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="glass-card hero-banner" aria-labelledby="hero-title">
        <h1 id="hero-title" className="hero-title">
          New Zealand <span className="text-gradient">Labour Market & Income</span> Intelligence
        </h1>
        <p className="hero-desc">
          An interactive analytics platform connecting <strong>MBIE Jobs Online monthly vacancy indices (2007–2026)</strong> with 
          <strong> Stats NZ Census income benchmarks</strong>. Built to provide NZ job seekers and employers with data-backed regional recommendations, industry growth insights, and compensation strategy.
        </p>
        <div className="hero-badge-group">
          <span className="badge badge-indigo">
            <Sparkles size={14} aria-hidden="true" /> MBIE Jobs Online Verified Data
          </span>
          <span className="badge badge-emerald">
            <TrendingUp size={14} aria-hidden="true" /> Stats NZ Census Income Integration
          </span>
          <span className="badge badge-amber">
            <Compass size={14} aria-hidden="true" /> Interactive Career Decision Guide
          </span>
        </div>
      </section>

      {/* KPI Cards */}
      <KPICards monthlyData={monthlyData} regionalData={regionalData} />

      {/* Section Grid: Charts */}
      <div className="section-grid">
        {/* Main Vacancy Trend Chart */}
        <section className="glass-card section-card col-8" aria-labelledby="trend-title">
          <div className="card-header-flex">
            <div>
              <h2 id="trend-title" className="card-title">
                <TrendingUp size={20} className="text-gradient" aria-hidden="true" />
                NZ Job Vacancy Index Trajectory (2007 – 2026)
              </h2>
              <p className="card-subtitle">Monthly unadjusted index tracking online job vacancy volume across New Zealand</p>
            </div>

            <div className="filter-group">
              <label htmlFor="time-horizon-select" className="navbar-subtitle">Time Horizon:</label>
              <select 
                id="time-horizon-select"
                className="select-control"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                aria-label="Filter chart time horizon"
              >
                <option value="1Y">Past 12 Months</option>
                <option value="3Y">Past 3 Years</option>
                <option value="5Y">Past 5 Years</option>
                <option value="All">Full History (2007-2026)</option>
              </select>
            </div>
          </div>

          <div style={{ width: '100%', height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} domain={['auto', 'auto']} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-accent)',
                    borderRadius: '12px',
                    color: 'var(--text-main)' 
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="Overall Vacancies" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Auckland" stroke="#0284c7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Wellington" stroke="#d97706" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Canterbury" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="data-source-caption">
            <Database size={14} aria-hidden="true" />
            <span>Data Source: Ministry of Business, Innovation and Employment (MBIE) Jobs Online Monthly Unadjusted Vacancy Series (May 2007 – June 2026)</span>
          </div>
        </section>

        {/* Skill Demand Breakdown */}
        <section className="glass-card section-card col-4" aria-labelledby="skill-title">
          <div className="card-header-flex">
            <div>
              <h2 id="skill-title" className="card-title">
                <Layers size={20} style={{ color: '#0284c7' }} aria-hidden="true" />
                Skill Tier Composition
              </h2>
              <p className="card-subtitle">Vacancy share by skill requirement</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-accent)',
                    borderRadius: '8px',
                    color: 'var(--text-main)'
                  }} 
                />
                <Area type="monotone" dataKey="Highly Skilled" stackId="1" stroke="#4f46e5" fill="rgba(79, 70, 229, 0.4)" />
                <Area type="monotone" dataKey="Skilled" stackId="1" stroke="#0284c7" fill="rgba(2, 132, 199, 0.4)" />
                <Area type="monotone" dataKey="Low Skilled" stackId="1" stroke="#e11d48" fill="rgba(225, 29, 72, 0.25)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="data-source-caption" style={{ marginBottom: '12px' }}>
            <Database size={14} aria-hidden="true" />
            <span>Data Source: MBIE Jobs Online Skill Level Classification</span>
          </div>

          <div>
            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }} 
              onClick={() => onNavigate('pathfinder')}
              aria-label="Take NZ Career Pathfinder Quiz"
            >
              Take NZ Career Pathfinder Quiz <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
