import React, { useState, useMemo } from 'react';
import { selectFilteredIndustryMatrix, selectFilteredOccupations } from '../utils/selectors';
import { Award, TrendingUp, Search, Layers, Database, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function IndustryQuadrant({ industryData, occupationData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState('All');

  // Industry Matrix Sorting State
  const [indSortField, setIndSortField] = useState('median_weekly_income');
  const [indSortDirection, setIndSortDirection] = useState('desc');

  // Occupations Sorting State
  const [occSortField, setOccSortField] = useState('annual_change_percent');
  const [occSortDirection, setOccSortDirection] = useState('desc');

  const handleIndSort = (field) => {
    if (indSortField === field) {
      setIndSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setIndSortField(field);
      setIndSortDirection('desc');
    }
  };

  const handleOccSort = (field) => {
    if (occSortField === field) {
      setOccSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOccSortField(field);
      setOccSortDirection('desc');
    }
  };

  const renderSortIcon = (currentField, activeField, activeDirection) => {
    if (activeField !== currentField) {
      return <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: 0.5 }} aria-hidden="true" />;
    }
    return activeDirection === 'asc' 
      ? <ArrowUp size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />
      : <ArrowDown size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />;
  };

  // Memoized Selector for Industry Matrix
  const filteredMatrix = useMemo(() => {
    return selectFilteredIndustryMatrix(industryData, selectedQuadrant, indSortField, indSortDirection);
  }, [industryData, selectedQuadrant, indSortField, indSortDirection]);

  // Memoized Selector for Detailed Occupations
  const filteredOccupations = useMemo(() => {
    return selectFilteredOccupations(occupationData, searchTerm, occSortField, occSortDirection, 15);
  }, [occupationData, searchTerm, occSortField, occSortDirection]);

  if (!industryData || !industryData.industry_matrix) {
    return (
      <div className="glass-card section-card" role="status" aria-live="polite">
        <div className="no-data-banner">
          <AlertCircle size={20} aria-hidden="true" />
          <span>No industry data available. Ensure the ETL pipeline has executed successfully.</span>
        </div>
      </div>
    );
  }

  const getQuadrantColor = (quadrant) => {
    if (quadrant.includes('Star')) return '#4f46e5';
    if (quadrant.includes('High Demand')) return '#059669';
    if (quadrant.includes('High Salary')) return '#d97706';
    return '#64748b';
  };

  return (
    <div>
      {/* 2x2 Quadrant Header Card */}
      <section className="glass-card section-card" style={{ marginBottom: '24px' }} aria-labelledby="quadrant-title">
        <div className="card-header-flex">
          <div>
            <h2 id="quadrant-title" className="card-title">
              <Award size={22} className="text-gradient" aria-hidden="true" />
              NZ Industry Opportunity 2x2 Quadrant
            </h2>
            <p className="card-subtitle">
              Mapping New Zealand industries by <strong>Annual Vacancy Growth (%)</strong> vs. <strong>Stats NZ Median Weekly & Hourly Earnings ($)</strong>. Click any column header to sort.
            </p>
          </div>

          <div className="filter-group">
            <label htmlFor="quadrant-filter-select" className="navbar-subtitle">Filter Quadrant:</label>
            <select 
              id="quadrant-filter-select"
              className="select-control"
              value={selectedQuadrant}
              onChange={(e) => setSelectedQuadrant(e.target.value)}
              aria-label="Filter by Quadrant"
            >
              <option value="All">All Quadrants</option>
              <option value="Star">Star (High Salary & Growth)</option>
              <option value="High Demand">High Demand</option>
              <option value="High Salary">High Salary / Niche</option>
              <option value="Stable">Stable / Moderate</option>
            </select>
          </div>
        </div>

        {/* Sortable Industry Table */}
        {filteredMatrix.length === 0 ? (
          <div className="no-data-banner">
            <AlertCircle size={20} aria-hidden="true" />
            <span>No industry data available for this quadrant selection.</span>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table" aria-label="Industry Opportunity Matrix Table">
              <thead>
                <tr>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleIndSort('industry')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Industry Sector {renderSortIcon('industry', indSortField, indSortDirection)}
                    </div>
                  </th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleIndSort('yoy_growth_percent')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      YoY Growth (%) {renderSortIcon('yoy_growth_percent', indSortField, indSortDirection)}
                    </div>
                  </th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleIndSort('hourly_income')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Hourly Wage (40 hr/wk) {renderSortIcon('hourly_income', indSortField, indSortDirection)}
                    </div>
                  </th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleIndSort('median_weekly_income')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Median Weekly Wage {renderSortIcon('median_weekly_income', indSortField, indSortDirection)}
                    </div>
                  </th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleIndSort('annualized_income')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Annualized Salary {renderSortIcon('annualized_income', indSortField, indSortDirection)}
                    </div>
                  </th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleIndSort('quadrant')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Quadrant Classification {renderSortIcon('quadrant', indSortField, indSortDirection)}
                    </div>
                  </th>
                  <th scope="col">Strategic Job Seeker Advice</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatrix.map((ind, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={16} color={getQuadrantColor(ind.quadrant)} aria-hidden="true" />
                        {ind.industry}
                      </div>
                    </td>
                    <td>
                      {ind.yoy_growth_percent !== null ? (
                        <span className={`tabular-nums ${ind.yoy_growth_percent >= 0 ? "trend-up" : "trend-down"}`}>
                          {ind.yoy_growth_percent > 0 ? '+' : ''}{ind.yoy_growth_percent}%
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No data available</span>
                      )}
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: '700', color: '#059669' }}>
                      ${ind.hourly_income ? ind.hourly_income.toFixed(2) : (ind.median_weekly_income / 40.0).toFixed(2)} / hr
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: '600' }}>
                      ${ind.median_weekly_income.toLocaleString()} / wk
                    </td>
                    <td className="tabular-nums">${ind.annualized_income.toLocaleString()}</td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          borderColor: getQuadrantColor(ind.quadrant),
                          color: getQuadrantColor(ind.quadrant),
                          background: `${getQuadrantColor(ind.quadrant)}15`
                        }}
                      >
                        {ind.quadrant}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                      {ind.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Data Source Caption */}
        <div className="data-source-caption" style={{ marginTop: '16px' }}>
          <Database size={14} aria-hidden="true" />
          <span>Data Source: MBIE Jobs Online Sector Vacancy Series & Stats NZ ANZSIC06 Industry Earnings Census</span>
        </div>
      </section>

      {/* Detailed Sortable ANZSCO Roles List */}
      <section className="glass-card section-card" aria-labelledby="anzsco-title">
        <div className="card-header-flex">
          <div>
            <h2 id="anzsco-title" className="card-title" style={{ fontSize: '1.25rem' }}>
              <TrendingUp size={20} color="#0284c7" aria-hidden="true" />
              Detailed ANZSCO Occupational Demand Explorer
            </h2>
            <p className="card-subtitle">Annual vacancy growth rate and estimated hourly wage ranges for specific 4-digit ANZSCO roles. Click headers to sort.</p>
          </div>

          <div className="filter-group">
            <label htmlFor="role-search-input" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
              Search role title
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                id="role-search-input"
                type="text" 
                placeholder="Search role title (e.g. Engineer, Manager)…" 
                className="select-control"
                style={{ paddingLeft: '36px', width: '280px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search role title or ANZSCO code"
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} aria-hidden="true" />
            </div>
          </div>
        </div>

        {filteredOccupations.length === 0 ? (
          <div className="no-data-banner">
            <AlertCircle size={20} aria-hidden="true" />
            <span>No data available for "{searchTerm}". Search for another role or clear search input.</span>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table" aria-label="Detailed Occupations Data Table">
              <thead>
                <tr>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleOccSort('code')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      ANZSCO Code {renderSortIcon('code', occSortField, occSortDirection)}
                    </div>
                  </th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleOccSort('title')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Role Title {renderSortIcon('title', occSortField, occSortDirection)}
                    </div>
                  </th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleOccSort('annual_change_percent')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Annual Vacancy Change (%) {renderSortIcon('annual_change_percent', occSortField, occSortDirection)}
                    </div>
                  </th>
                  <th scope="col">Estimated Hourly Rate</th>
                  <th scope="col">Estimated Annual Salary</th>
                  <th scope="col">Demand Indicator</th>
                </tr>
              </thead>
              <tbody>
                {filteredOccupations.map((occ, idx) => (
                  <tr key={idx}>
                    <td className="tabular-nums" style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{occ.code}</td>
                    <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>{occ.title}</td>
                    <td>
                      {occ.annual_change_percent !== null ? (
                        <span className={`tabular-nums ${occ.annual_change_percent >= 0 ? "trend-up" : "trend-down"}`}>
                          {occ.annual_change_percent > 0 ? '+' : ''}{occ.annual_change_percent}%
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No data available</span>
                      )}
                    </td>
                    <td className="tabular-nums" style={{ color: '#059669', fontWeight: '700' }}>
                      {occ.estimated_hourly_range || '$36.00 - $57.70 / hr'}
                    </td>
                    <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {occ.estimated_salary_range}
                    </td>
                    <td>
                      <span className={`badge ${occ.annual_change_percent > 10 ? 'badge-emerald' : 'badge-indigo'}`}>
                        {occ.annual_change_percent > 10 ? 'Surging Demand' : 'Steady Hiring'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Data Source Caption */}
        <div className="data-source-caption" style={{ marginTop: '16px' }}>
          <Database size={14} aria-hidden="true" />
          <span>Data Source: MBIE Jobs Online Detailed 4-Digit ANZSCO Quarterly Data Release (March 2026)</span>
        </div>
      </section>
    </div>
  );
}
