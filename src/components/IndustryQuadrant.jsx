import React, { useState, useMemo } from 'react';
import { 
  selectFilteredIndustryMatrix, 
  selectFilteredOccupations 
} from '../utils/selectors';
import DownloadCSVButton from './DownloadCSVButton';
import HistoricalChartModal from './HistoricalChartModal';
import { 
  Briefcase, TrendingUp, Award, DollarSign, Search, Filter, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Database, CheckCircle, ShieldCheck, Bookmark, BarChart2 
} from 'lucide-react';

export default function IndustryQuadrant({ industryData, occupationData, cityIndustryData, monthlyData, regionalData }) {
  const [selectedQuadrant, setSelectedQuadrant] = useState('All');
  const [occupationSearch, setOccupationSearch] = useState('');
  
  // ANZSCO Modal Graph State
  const [selectedRoleForModal, setSelectedRoleForModal] = useState(null);

  // Industry Matrix Sorting State
  const [matrixSortField, setMatrixSortField] = useState('median_weekly_income');
  const [matrixSortDirection, setMatrixSortDirection] = useState('desc');

  // ANZSCO Occupation Sorting State
  const [occSortField, setOccSortField] = useState('annual_change_percent');
  const [occSortDirection, setOccSortDirection] = useState('desc');

  const handleMatrixSort = (field) => {
    if (matrixSortField === field) {
      setMatrixSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setMatrixSortField(field);
      setMatrixSortDirection('desc');
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

  const renderSortIcon = (field, activeField, activeDirection) => {
    if (activeField !== field) {
      return <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: 0.5 }} aria-hidden="true" />;
    }
    return activeDirection === 'asc' 
      ? <ArrowUp size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />
      : <ArrowDown size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />;
  };

  const filteredMatrix = useMemo(() => {
    return selectFilteredIndustryMatrix(industryData, selectedQuadrant, matrixSortField, matrixSortDirection);
  }, [industryData, selectedQuadrant, matrixSortField, matrixSortDirection]);

  const filteredOccupations = useMemo(() => {
    return selectFilteredOccupations(occupationData, occupationSearch, occSortField, occSortDirection, 25);
  }, [occupationData, occupationSearch, occSortField, occSortDirection]);

  if (!industryData || !industryData.industry_matrix) {
    return (
      <div className="glass-card section-card" role="status" aria-live="polite">
        <div className="no-data-banner">
          <AlertCircle size={20} aria-hidden="true" />
          <span>No industry matrix data available.</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ANZSCO Role Interactive Historical Trend Modal */}
      <HistoricalChartModal 
        isOpen={!!selectedRoleForModal}
        onClose={() => setSelectedRoleForModal(null)}
        modalMetric="anzsco"
        extraData={selectedRoleForModal}
        monthlyData={monthlyData}
        regionalData={regionalData}
      />

      {/* SECTION 1: Industry Opportunity 2x2 Matrix */}
      <section className="glass-card section-card" style={{ marginBottom: '24px' }} aria-labelledby="industry-quadrant-title">
        <div className="card-header-flex">
          <div>
            <h2 id="industry-quadrant-title" className="card-title">
              <Briefcase size={22} className="text-gradient" aria-hidden="true" />
              New Zealand Industry Opportunity 2x2 Quadrant Matrix
            </h2>
            <p className="card-subtitle">
              Cross-evaluating MBIE job vacancy growth against Stats NZ ANZSIC median weekly and hourly earnings. Filter by strategic tier or click headers to sort.
            </p>
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label htmlFor="quadrant-filter-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Filter Quadrant Tier:</label>
                <select 
                  id="quadrant-filter-select"
                  className="select-control"
                  value={selectedQuadrant}
                  onChange={(e) => setSelectedQuadrant(e.target.value)}
                  aria-label="Filter by Quadrant Tier"
                >
                  <option value="All">All Industry Quadrants (10 Sectors)</option>
                  <option value="Star">Star (High Growth & High Income)</option>
                  <option value="High Demand">High Demand (Accessible Entry)</option>
                  <option value="High Salary">High Salary / Specialized Niche</option>
                  <option value="Stable">Stable / Moderate Growth</option>
                </select>
              </div>

              <DownloadCSVButton 
                data={filteredMatrix} 
                filename="nz_industry_opportunity_matrix.csv" 
                label="Export Matrix CSV" 
              />
            </div>
          </div>
        </div>

        <div className="custom-table-container">
          <table className="custom-table" aria-label="Industry Opportunity Matrix Table">
            <thead>
              <tr>
                <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('industry')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Industry Sector {renderSortIcon('industry', matrixSortField, matrixSortDirection)}
                  </div>
                </th>
                <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('current_vacancy_index')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    MBIE Vacancy Index {renderSortIcon('current_vacancy_index', matrixSortField, matrixSortDirection)}
                  </div>
                </th>
                <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('yoy_growth_percent')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    YoY Growth (%) {renderSortIcon('yoy_growth_percent', matrixSortField, matrixSortDirection)}
                  </div>
                </th>
                <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('hourly_income')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Hourly Wage (40 hr/wk) {renderSortIcon('hourly_income', matrixSortField, matrixSortDirection)}
                  </div>
                </th>
                <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('median_weekly_income')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Median Weekly Wage {renderSortIcon('median_weekly_income', matrixSortField, matrixSortDirection)}
                  </div>
                </th>
                <th scope="col">Strategic Quadrant Tier</th>
                <th scope="col">Career Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatrix.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={16} color="#4f46e5" aria-hidden="true" />
                      {item.industry}
                    </div>
                  </td>
                  <td className="tabular-nums" style={{ fontWeight: '700', color: '#4f46e5' }}>
                    {item.current_vacancy_index}
                  </td>
                  <td>
                    <span className={`tabular-nums ${item.yoy_growth_percent >= 0 ? "trend-up" : "trend-down"}`}>
                      {item.yoy_growth_percent > 0 ? '+' : ''}{item.yoy_growth_percent}%
                    </span>
                  </td>
                  <td className="tabular-nums" style={{ fontWeight: '700', color: '#059669' }}>
                    ${item.hourly_income.toFixed(2)} / hr
                  </td>
                  <td className="tabular-nums" style={{ fontWeight: '600' }}>
                    ${item.median_weekly_income.toLocaleString()} / wk
                  </td>
                  <td>
                    <span className={`badge ${
                      item.quadrant.includes('Star') ? 'badge-amber' : 
                      item.quadrant.includes('High Demand') ? 'badge-emerald' : 
                      item.quadrant.includes('High Salary') ? 'badge-indigo' : 'badge-cyan'
                    }`}>
                      {item.quadrant}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                    {item.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="data-source-caption" style={{ marginTop: '12px' }}>
          <Database size={14} aria-hidden="true" />
          <span>Data Sources: MBIE Jobs Online Monthly Industry Series & Stats NZ ANZSIC Earnings Census</span>
        </div>
      </section>

      {/* SECTION 2: Detailed ANZSCO Occupation Explorer & INZ Green List Tags */}
      <section className="glass-card section-card" aria-labelledby="anzsco-explorer-title">
        <div className="card-header-flex">
          <div>
            <h2 id="anzsco-explorer-title" className="card-title">
              <Award size={22} className="text-gradient-cyan" aria-hidden="true" />
              Detailed ANZSCO Occupational Demand & Immigration NZ (INZ) Green List
            </h2>
            <p className="card-subtitle">
              Detailed tracking of 4-digit ANZSCO occupations with annual growth %, estimated hourly salary ranges, and <strong>Immigration NZ (INZ) Green List Visa Status</strong>. Click any row to view 58-quarter historical trend graph!
            </p>
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label htmlFor="occ-search-input" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Search ANZSCO Title or Code:</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    id="occ-search-input"
                    type="text"
                    placeholder="Search e.g. Programmer, Nurse, Engineer, Manager…"
                    className="select-control"
                    style={{ width: '300px', paddingLeft: '32px' }}
                    value={occupationSearch}
                    onChange={(e) => setOccupationSearch(e.target.value)}
                    aria-label="Search ANZSCO Title or Code"
                  />
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} aria-hidden="true" />
                </div>
              </div>

              <DownloadCSVButton 
                data={filteredOccupations} 
                filename="nz_anzsco_occupations_green_list.csv" 
                label="Export ANZSCO CSV" 
              />
            </div>
          </div>
        </div>

        {filteredOccupations.length === 0 ? (
          <div className="no-data-banner">
            <AlertCircle size={20} aria-hidden="true" />
            <span>No occupation results found matching "{occupationSearch}".</span>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table" aria-label="Detailed ANZSCO Occupations and INZ Green List Table">
              <thead>
                <tr>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleOccSort('code')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      ANZSCO Code {renderSortIcon('code', occSortField, occSortDirection)}
                    </div>
                  </th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleOccSort('title')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Occupation Title {renderSortIcon('title', occSortField, occSortDirection)}
                    </div>
                  </th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleOccSort('annual_change_percent')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      YoY Demand Growth (%) {renderSortIcon('annual_change_percent', occSortField, occSortDirection)}
                    </div>
                  </th>
                  <th scope="col">Estimated Hourly Salary Range</th>
                  <th scope="col">INZ Green List Visa Status</th>
                  <th scope="col">Interactive Graph</th>
                </tr>
              </thead>
              <tbody>
                {filteredOccupations.map((occ, idx) => (
                  <tr 
                    key={idx} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => setSelectedRoleForModal(occ)}
                    title={`Click to view 58-quarter historical trend graph for ${occ.title}`}
                  >
                    <td style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-muted)' }}>
                      {occ.code}
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      {occ.title}
                    </td>
                    <td>
                      <span className={`tabular-nums ${occ.annual_change_percent >= 0 ? "trend-up" : "trend-down"}`}>
                        {occ.annual_change_percent > 0 ? '+' : ''}{occ.annual_change_percent}%
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: '600', color: '#059669' }}>
                      {occ.estimated_hourly_range}
                    </td>
                    <td>
                      {occ.inz_green_list_tier ? (
                        <span className={`badge ${occ.inz_green_list_tier.includes('Tier 1') ? 'badge-emerald' : 'badge-amber'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={14} aria-hidden="true" />
                          <span>{occ.inz_green_list_tier}</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Standard Skilled Pathway</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <BarChart2 size={12} /> View Graph
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="data-source-caption" style={{ marginTop: '12px' }}>
          <Database size={14} aria-hidden="true" />
          <span>Data Source: MBIE Jobs Online Detailed ANZSCO Quarterly Release & Immigration New Zealand Green List (March 2026)</span>
        </div>
      </section>
    </div>
  );
}
