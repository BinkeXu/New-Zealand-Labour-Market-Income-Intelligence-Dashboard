import React, { useState, useMemo } from 'react';
import { 
  selectFilteredIndustryMatrix, 
  selectFilteredOccupations,
  selectLevelIndustryBenchmarks
} from '../utils/selectors';
import { useDashboardData } from '../context/DashboardContext';
import DownloadCSVButton from './DownloadCSVButton';
import HistoricalChartModal from './HistoricalChartModal';
import { 
  Briefcase, TrendingUp, Award, DollarSign, Search, Filter, AlertCircle, Database, CheckCircle, ShieldCheck, Bookmark, BarChart2 
} from 'lucide-react';
import { useTableSort, SortIcon } from '../hooks/useTableSort';
import { useDebounce } from '../hooks/useDebounce';

export default function IndustryQuadrant() {
  const { industryData, occupationData, cityIndustryData, monthlyData, regionalData, levelData } = useDashboardData();
  const [selectedQuadrant, setSelectedQuadrant] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [occupationSearch, setOccupationSearch] = useState('');
  
  // Debounce search query to prevent high-frequency re-filtering on keystrokes
  const debouncedOccupationSearch = useDebounce(occupationSearch, 250);

  // ANZSCO Modal Graph State
  const [selectedRoleForModal, setSelectedRoleForModal] = useState(null);

  // Industry Matrix Sorting State
  const { 
    sortField: matrixSortField, 
    sortDirection: matrixSortDirection, 
    handleSort: handleMatrixSort, 
    onKeyDown: onMatrixKeyDown
  } = useTableSort('opportunity_score', 'desc');

  // ANZSCO Occupation Sorting State
  const { 
    sortField: occSortField, 
    sortDirection: occSortDirection, 
    handleSort: handleOccSort, 
    onKeyDown: onOccKeyDown
  } = useTableSort('opportunity_score', 'desc');

  const filteredMatrix = useMemo(() => {
    return selectFilteredIndustryMatrix(industryData, selectedQuadrant, matrixSortField, matrixSortDirection);
  }, [industryData, selectedQuadrant, matrixSortField, matrixSortDirection]);

  const filteredOccupations = useMemo(() => {
    return selectFilteredOccupations(occupationData, debouncedOccupationSearch, occSortField, occSortDirection, 25);
  }, [occupationData, debouncedOccupationSearch, occSortField, occSortDirection]);

  const levelBenchmarks = useMemo(() => {
    return selectLevelIndustryBenchmarks(levelData, selectedLevel);
  }, [levelData, selectedLevel]);

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
      <section className="glass-card section-card" style={{ marginBottom: '28px' }} aria-labelledby="industry-quadrant-title">
        <div className="card-header-flex">
          <div>
            <h2 id="industry-quadrant-title" className="card-title">
              <Briefcase size={22} className="text-gradient" aria-hidden="true" />
              New Zealand Industry Opportunity 2x2 Quadrant Matrix
            </h2>
            <p className="card-subtitle">
              Cross-evaluating MBIE job vacancy growth against Stats NZ ANZSIC median weekly and hourly earnings with <strong>Sector Opportunity Scores</strong>.
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

              <div>
                <label htmlFor="level-filter-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Seniority Level:</label>
                <select 
                  id="level-filter-select"
                  className="select-control"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  aria-label="Filter by Seniority Level"
                >
                  <option value="Junior">Junior (0-2 Yrs)</option>
                  <option value="Intermediate">Intermediate (3-5 Yrs)</option>
                  <option value="Senior">Senior (6+ Yrs)</option>
                  <option value="Lead / Executive">Lead / Exec (10+ Yrs)</option>
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
                <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('industry')} onKeyDown={(e) => onMatrixKeyDown(e, 'industry')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Industry Sector <SortIcon field="industry" sortField={matrixSortField} sortDirection={matrixSortDirection} />
                  </div>
                </th>
                <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('opportunity_score')} onKeyDown={(e) => onMatrixKeyDown(e, 'opportunity_score')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Opportunity Score <SortIcon field="opportunity_score" sortField={matrixSortField} sortDirection={matrixSortDirection} />
                  </div>
                </th>
                <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('current_vacancy_index')} onKeyDown={(e) => onMatrixKeyDown(e, 'current_vacancy_index')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    MBIE Vacancy Index <SortIcon field="current_vacancy_index" sortField={matrixSortField} sortDirection={matrixSortDirection} />
                  </div>
                </th>
                <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('yoy_growth_percent')} onKeyDown={(e) => onMatrixKeyDown(e, 'yoy_growth_percent')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    YoY Growth (%) <SortIcon field="yoy_growth_percent" sortField={matrixSortField} sortDirection={matrixSortDirection} />
                  </div>
                </th>
                <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('hourly_income')} onKeyDown={(e) => onMatrixKeyDown(e, 'hourly_income')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Hourly Wage (40 hr/wk) <SortIcon field="hourly_income" sortField={matrixSortField} sortDirection={matrixSortDirection} />
                  </div>
                </th>
                <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('median_weekly_income')} onKeyDown={(e) => onMatrixKeyDown(e, 'median_weekly_income')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Median Weekly Wage <SortIcon field="median_weekly_income" sortField={matrixSortField} sortDirection={matrixSortDirection} />
                  </div>
                </th>
                <th scope="col">Strategic Quadrant Tier</th>
                <th scope="col">Career Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatrix.map((item) => (
                <tr key={item.industry}>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={16} color="#4f46e5" aria-hidden="true" />
                      {item.industry}
                    </div>
                  </td>
                  <td>
                    {item.opportunity_score ? (
                      <span className="badge badge-amber tabular-nums" style={{ fontWeight: '900', fontSize: '0.85rem' }}>
                        {item.opportunity_score} pts
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>N/A</span>
                    )}
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
                    {levelBenchmarks && levelBenchmarks.industries[item.industry] ? (
                      levelBenchmarks.industries[item.industry].salary_range_hourly
                    ) : (
                      `$${item.hourly_income ? item.hourly_income.toFixed(2) : (item.median_weekly_income / 40.0).toFixed(2)} / hr`
                    )}
                  </td>
                  <td className="tabular-nums" style={{ fontWeight: '600' }}>
                    {levelBenchmarks && levelBenchmarks.industries[item.industry] ? (
                      `$${levelBenchmarks.industries[item.industry].median_weekly.toLocaleString()} / wk`
                    ) : (
                      `$${item.median_weekly_income ? item.median_weekly_income.toLocaleString() : 'N/A'} / wk`
                    )}
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
              Detailed tracking of 4-digit ANZSCO occupations with <strong>Opportunity Scores</strong>, annual growth %, estimated hourly salary ranges, and <strong>INZ Green List Visa Status</strong>. Click any row to view 58-quarter historical trend graph!
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
            <span>No occupation results found matching "{debouncedOccupationSearch}".</span>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table" aria-label="Detailed ANZSCO Occupations and INZ Green List Table">
              <thead>
                <tr>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleOccSort('code')} onKeyDown={(e) => onOccKeyDown(e, 'code')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      ANZSCO Code <SortIcon field="code" sortField={occSortField} sortDirection={occSortDirection} />
                    </div>
                  </th>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleOccSort('title')} onKeyDown={(e) => onOccKeyDown(e, 'title')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Occupation Title <SortIcon field="title" sortField={occSortField} sortDirection={occSortDirection} />
                    </div>
                  </th>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleOccSort('opportunity_score')} onKeyDown={(e) => onOccKeyDown(e, 'opportunity_score')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Opportunity Score <SortIcon field="opportunity_score" sortField={occSortField} sortDirection={occSortDirection} />
                    </div>
                  </th>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleOccSort('annual_change_percent')} onKeyDown={(e) => onOccKeyDown(e, 'annual_change_percent')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      YoY Demand Growth (%) <SortIcon field="annual_change_percent" sortField={occSortField} sortDirection={occSortDirection} />
                    </div>
                  </th>
                  <th scope="col">Estimated Hourly Salary Range</th>
                  <th scope="col">INZ Green List Visa Status</th>
                  <th scope="col">Interactive Graph</th>
                </tr>
              </thead>
              <tbody>
                {filteredOccupations.map((occ) => (
                  <tr 
                    key={occ.code} 
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer' }} 
                    onClick={() => setSelectedRoleForModal(occ)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRoleForModal(occ);
                      }
                    }}
                    title={`Click to view 58-quarter historical trend graph for ${occ.title}`}
                  >
                    <td style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-muted)' }}>
                      {occ.code}
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      {occ.title}
                    </td>
                    <td>
                      {occ.opportunity_score ? (
                        <span className="badge badge-amber tabular-nums" style={{ fontWeight: '900', fontSize: '0.85rem' }}>
                          {occ.opportunity_score} pts
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>N/A</span>
                      )}
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
