import React, { useState, useMemo } from 'react';
import { 
  selectFilteredRegions, 
  selectRegionalChartData, 
  selectFilteredCityIndustryVacancies 
} from '../utils/selectors';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { 
  MapPin, Award, ArrowUpRight, Database, Users, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Calculator, CheckCircle, Briefcase, Filter, UserCheck 
} from 'lucide-react';

export default function RegionalMatrix({ regionalData, cityIndustryData }) {
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCityFilter, setSelectedCityFilter] = useState('');
  
  // Regional Summary Sorting State
  const [sortField, setSortField] = useState('opportunity_score');
  const [sortDirection, setSortDirection] = useState('desc');

  // City x Industry Matrix Filter & Sorting State
  const [matrixRegion, setMatrixRegion] = useState('All');
  const [matrixIndustry, setMatrixIndustry] = useState('All');
  const [matrixSortField, setMatrixSortField] = useState('current_vacancy_index');
  const [matrixSortDirection, setMatrixSortDirection] = useState('desc');

  // Handle Regional Summary Column Header Sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle City Industry Matrix Column Header Sort
  const handleMatrixSort = (field) => {
    if (matrixSortField === field) {
      setMatrixSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setMatrixSortField(field);
      setMatrixSortDirection('desc');
    }
  };

  // Render Sort Indicator Icon
  const renderSortIcon = (field, activeField, activeDirection) => {
    if (activeField !== field) {
      return <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: 0.5 }} aria-hidden="true" />;
    }
    return activeDirection === 'asc' 
      ? <ArrowUp size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />
      : <ArrowDown size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />;
  };

  // Memoized Selector for Filtered & Sorted Regions
  const filteredRegions = useMemo(() => {
    return selectFilteredRegions(regionalData, selectedIsland, selectedCityFilter, sortField, sortDirection);
  }, [regionalData, selectedIsland, selectedCityFilter, sortField, sortDirection]);

  // Memoized Selector for Bar Chart Data
  const chartData = useMemo(() => {
    return selectRegionalChartData(filteredRegions);
  }, [filteredRegions]);

  // Memoized Selector for City x Industry Vacancy Matrix
  const cityIndustryMatrix = useMemo(() => {
    return selectFilteredCityIndustryVacancies(
      cityIndustryData, 
      matrixRegion, 
      matrixIndustry, 
      selectedCityFilter, 
      matrixSortField, 
      matrixSortDirection
    );
  }, [cityIndustryData, matrixRegion, matrixIndustry, selectedCityFilter, matrixSortField, matrixSortDirection]);

  if (!regionalData || !regionalData.regions || regionalData.regions.length === 0) {
    return (
      <div className="glass-card section-card" role="status" aria-live="polite">
        <div className="no-data-banner">
          <AlertCircle size={20} aria-hidden="true" />
          <span>No regional data available. Ensure the ETL pipeline has executed successfully.</span>
        </div>
      </div>
    );
  }

  const allIndustries = cityIndustryData?.industries || [
    'Business services', 'Construction', 'Education', 'Health care', 
    'Hospitality', 'IT', 'Manufacturing', 'Primary', 'Sales', 'Other'
  ];

  return (
    <div>
      {/* SECTION 1: Regional Summary & Working-Age Population Analysis */}
      <section className="glass-card section-card" style={{ marginBottom: '24px' }} aria-labelledby="regional-matrix-title">
        <div className="card-header-flex">
          <div>
            <h2 id="regional-matrix-title" className="card-title">
              <MapPin size={22} className="text-gradient-cyan" aria-hidden="true" />
              All New Zealand Regional & City Vacancy, Income & Working-Age Population Analysis
            </h2>
            <p className="card-subtitle">
              Comprehensive analysis of online job vacancy volume (MBIE), median earnings (Stats NZ Census), and <strong>Working-Age Resident Population (Ages 15–64)</strong> excluding children and retirees. Click headers to sort.
            </p>
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <label htmlFor="city-search-input" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Filter City / Region:</label>
                <input 
                  id="city-search-input"
                  type="text" 
                  placeholder="Type city (e.g. Hamilton, Dunedin, Tauranga)…"
                  className="select-control"
                  style={{ width: '240px' }}
                  value={selectedCityFilter}
                  onChange={(e) => setSelectedCityFilter(e.target.value)}
                  aria-label="Filter by specific NZ city or region"
                />
              </div>

              <div>
                <label htmlFor="island-filter-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Filter Island:</label>
                <select 
                  id="island-filter-select"
                  className="select-control"
                  value={selectedIsland}
                  onChange={(e) => setSelectedIsland(e.target.value)}
                  aria-label="Filter by Island"
                >
                  <option value="All">All New Zealand (10 Regions)</option>
                  <option value="North Island">North Island Regions</option>
                  <option value="South Island">South Island Regions</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* No Data Available Banner if search returns 0 results */}
        {filteredRegions.length === 0 ? (
          <div className="no-data-banner" style={{ margin: '24px 0' }}>
            <AlertCircle size={20} aria-hidden="true" />
            <span>No data available for "{selectedCityFilter}". Try searching a major NZ city name (e.g., Hamilton, Tauranga, Christchurch, Dunedin) or clear the filter.</span>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div style={{ width: '100%', height: 340, marginBottom: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} interval={0} angle={-25} textAnchor="end" />
                  <YAxis yAxisId="left" stroke="#4f46e5" fontSize={11} orientation="left" label={{ value: 'Vacancies / 100k (Ages 15-64)', angle: -90, position: 'insideLeft', fill: '#4f46e5' }} />
                  <YAxis yAxisId="right" stroke="#059669" fontSize={11} orientation="right" label={{ value: 'Hourly Wage ($)', angle: 90, position: 'insideRight', fill: '#059669' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-accent)',
                      borderRadius: '12px',
                      color: 'var(--text-main)' 
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar yAxisId="left" dataKey="Vacancies per 100k (Ages 15-64)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="right" dataKey="Hourly Wage ($/hr)" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="data-source-caption" style={{ marginBottom: '24px' }}>
              <Database size={14} aria-hidden="true" />
              <span>Data Sources: MBIE Jobs Online Consolidated Series, Stats NZ Household Income Census & Stats NZ Working-Age Population (Ages 15–64)</span>
            </div>

            {/* Sortable Regional Data Table */}
            <div className="custom-table-container">
              <table className="custom-table" aria-label="Regional Vacancy, Income and Working-Age Population Data Table">
                <thead>
                  <tr>
                    <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('region_name')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Region Name {renderSortIcon('region_name', sortField, sortDirection)}
                      </div>
                    </th>
                    <th scope="col">Cities Included</th>
                    <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('working_age_population')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Working-Age Population (15–64) {renderSortIcon('working_age_population', sortField, sortDirection)}
                      </div>
                    </th>
                    <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('vacancies_per_100k')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Vacancies / 100k Working-Age {renderSortIcon('vacancies_per_100k', sortField, sortDirection)}
                      </div>
                    </th>
                    <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('hourly_income')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Hourly Wage (40 hr/wk) {renderSortIcon('hourly_income', sortField, sortDirection)}
                      </div>
                    </th>
                    <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('median_weekly_income')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Median Weekly Wage {renderSortIcon('median_weekly_income', sortField, sortDirection)}
                      </div>
                    </th>
                    <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('opportunity_score')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Opportunity Score (Working-Age) {renderSortIcon('opportunity_score', sortField, sortDirection)}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegions.map((region, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} color="#4f46e5" aria-hidden="true" />
                          {region.region_name}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                        {region.cities_included ? region.cities_included.join(', ') : 'Regional center'}
                      </td>
                      <td className="tabular-nums">
                        {region.working_age_population ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserCheck size={14} color="var(--primary)" aria-hidden="true" />
                            <span>{region.working_age_population.toLocaleString()}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({((region.working_age_population / region.total_population) * 100).toFixed(0)}%)</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No data available</span>
                        )}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: '700', color: '#4f46e5' }}>
                        {region.vacancies_per_100k !== undefined && region.vacancies_per_100k !== null ? (
                          <span>{region.vacancies_per_100k} / 100k</span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(244,63,94,0.1)', color: '#e11d48' }}>No data available</span>
                        )}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: '700', color: '#059669' }}>
                        {region.hourly_income ? `$${region.hourly_income.toFixed(2)} / hr` : 'No data available'}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: '600' }}>
                        {region.median_weekly_income ? `$${region.median_weekly_income.toLocaleString()} / wk` : 'No data available'}
                      </td>
                      <td>
                        {region.opportunity_score ? (
                          <span className="badge badge-indigo tabular-nums" style={{ fontWeight: '800' }}>
                            {region.opportunity_score} pts
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="data-source-caption" style={{ marginTop: '12px' }}>
              <Database size={14} aria-hidden="true" />
              <span>Data Sources: MBIE Jobs Online Consolidated Series, Stats NZ Household Labour Force Survey Census & Stats NZ Working-Age Population (Ages 15–64)</span>
            </div>
          </>
        )}
      </section>

      {/* SECTION 2: Industry Vacancy Breakdown per City/Region */}
      <section className="glass-card section-card" style={{ marginBottom: '24px' }} aria-labelledby="city-industry-matrix-title">
        <div className="card-header-flex">
          <div>
            <h2 id="city-industry-matrix-title" className="card-title">
              <Briefcase size={22} className="text-gradient" aria-hidden="true" />
              Industry Vacancy Breakdown in Each New Zealand City & Region
            </h2>
            <p className="card-subtitle">
              Detailed breakdown of online job vacancy index and YoY growth rate for <strong>every industry in every New Zealand city</strong> (March 2026 Release). Filter by Region or Industry and click headers to sort.
            </p>
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <label htmlFor="matrix-region-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Select NZ Region / City:</label>
                <select 
                  id="matrix-region-select"
                  className="select-control"
                  value={matrixRegion}
                  onChange={(e) => setMatrixRegion(e.target.value)}
                  aria-label="Select Region or City"
                >
                  <option value="All">All 10 NZ Regions</option>
                  <option value="Auckland">Auckland (Auckland City, Manukau, North Shore)</option>
                  <option value="Wellington">Wellington (Wellington City, Hutt Valley)</option>
                  <option value="Canterbury">Canterbury (Christchurch, Timaru)</option>
                  <option value="Waikato">Waikato (Hamilton, Taupo)</option>
                  <option value="Bay of Plenty">Bay of Plenty (Tauranga, Rotorua)</option>
                  <option value="Northland">Northland (Whangarei, Kerikeri)</option>
                  <option value="Gisborne/Hawkes Bay">Gisborne / Hawkes Bay (Napier, Hastings)</option>
                  <option value="Manawatu-Whanganui/Taranaki">Manawatu / Taranaki (Palmerston North, New Plymouth)</option>
                  <option value="Otago/Southland">Otago / Southland (Dunedin, Queenstown, Invercargill)</option>
                  <option value="Tasman/Nelson/Marlborough/West Coast">Tasman / Nelson / Marlborough / West Coast</option>
                </select>
              </div>

              <div>
                <label htmlFor="matrix-industry-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Select Industry:</label>
                <select 
                  id="matrix-industry-select"
                  className="select-control"
                  value={matrixIndustry}
                  onChange={(e) => setMatrixIndustry(e.target.value)}
                  aria-label="Select Industry"
                >
                  <option value="All">All 10 Industries</option>
                  {allIndustries.map((ind, idx) => (
                    <option key={idx} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {cityIndustryMatrix.length === 0 ? (
          <div className="no-data-banner">
            <AlertCircle size={20} aria-hidden="true" />
            <span>No industry vacancy data available for this region and industry selection.</span>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table" aria-label="City Industry Vacancies Table">
              <thead>
                <tr>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('region_name')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Region / City {renderSortIcon('region_name', matrixSortField, matrixSortDirection)}
                    </div>
                  </th>
                  <th scope="col">Cities Included</th>
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
                      YoY Vacancy Growth (%) {renderSortIcon('yoy_growth_percent', matrixSortField, matrixSortDirection)}
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
                </tr>
              </thead>
              <tbody>
                {cityIndustryMatrix.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#4f46e5" aria-hidden="true" />
                        {row.region_name}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                      {row.cities_included ? row.cities_included.join(', ') : 'Regional center'}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={16} color="#0284c7" aria-hidden="true" />
                        {row.industry}
                      </div>
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: '700', color: '#4f46e5' }}>
                      {row.current_vacancy_index !== null ? row.current_vacancy_index : 'No data available'}
                    </td>
                    <td>
                      {row.yoy_growth_percent !== null ? (
                        <span className={`tabular-nums ${row.yoy_growth_percent >= 0 ? "trend-up" : "trend-down"}`}>
                          {row.yoy_growth_percent > 0 ? '+' : ''}{row.yoy_growth_percent}%
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No data available</span>
                      )}
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: '700', color: '#059669' }}>
                      ${row.hourly_income ? row.hourly_income.toFixed(2) : (row.median_weekly_income / 40.0).toFixed(2)} / hr
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: '600' }}>
                      ${row.median_weekly_income.toLocaleString()} / wk
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="data-source-caption" style={{ marginTop: '16px' }}>
          <Database size={14} aria-hidden="true" />
          <span>Data Source: MBIE Jobs Online Consolidated Industry Series per Region (March 2026 Quarterly Release)</span>
        </div>
      </section>

      {/* Strategic Regional Insights */}
      <div className="section-grid" style={{ marginBottom: '24px' }}>
        <section className="glass-card section-card col-6" aria-labelledby="north-island-title">
          <h3 id="north-island-title" className="card-title" style={{ marginBottom: '12px' }}>
            <Award size={20} color="#d97706" aria-hidden="true" />
            North Island Working-Age Labor Supply Dynamics
          </h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.8' }}>
            <li><strong style={{ color: 'var(--text-main)' }}>Auckland</strong> has NZ's largest working-age labor force (<strong>956,040 active residents</strong>, 68% of total pop) with high wage density (<strong>$35.95/hr</strong>).</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Wellington</strong> (<strong>317,043 working-age residents</strong>) offers New Zealand's top median income of <strong>$37.40/hr</strong>.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Northland & Bay of Plenty</strong> show high job vacancy density per active working-age resident (<strong>179 – 187 vacancies / 100k active residents</strong>).</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Waikato (Hamilton)</strong> (<strong>256,584 working-age residents</strong>) balances industrial hiring with strong labor force growth.</li>
          </ul>
        </section>

        <section className="glass-card section-card col-6" aria-labelledby="south-island-title">
          <h3 id="south-island-title" className="card-title" style={{ marginBottom: '12px' }}>
            <ArrowUpRight size={20} color="#059669" aria-hidden="true" />
            South Island Working-Age Labor Supply Dynamics
          </h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.8' }}>
            <li><strong style={{ color: 'var(--text-main)' }}>Otago / Southland</strong> (<strong>195,387 working-age residents</strong>) leads South Island per-capita vacancy density with a high working-age Opportunity Score (<strong>438.98 pts</strong>).</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Canterbury (Christchurch)</strong> (<strong>354,900 working-age residents</strong>) offers high construction hiring relative to active job seekers (<strong>$33.58/hr</strong>).</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Tasman / Nelson / Marlborough / West Coast</strong> (<strong>106,422 working-age residents</strong>) features high primary industry vacancy per active resident.</li>
          </ul>
        </section>
      </div>

      {/* Opportunity Score Calculation Methodology Card */}
      <section className="glass-card section-card col-12" aria-labelledby="opportunity-formula-title">
        <h3 id="opportunity-formula-title" className="card-title" style={{ marginBottom: '16px', color: 'var(--text-main)' }}>
          <Calculator size={22} className="text-gradient" aria-hidden="true" />
          How the Working-Age Opportunity Score is Calculated & Why
        </h3>

        <div style={{ background: 'var(--table-header-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            🧮 Mathematical Formula:
          </div>
          <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
            Opportunity Score = (Vacancies Per 100k Working-Age / 50.0) × (Median Weekly Income / $1,200.00) × 100
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Where: <code>Vacancies Per 100k Working-Age = (MBIE Vacancy Index / Working-Age Population [Ages 15–64]) × 100,000</code>
          </div>
        </div>

        <div className="section-grid" style={{ marginBottom: 0 }}>
          <div className="col-6">
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="#4f46e5" aria-hidden="true" />
              1. Filtering Out Children (Ages under 15–18) and Retirees (65+):
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Using total population includes infants, school children, and retired seniors who do not participate in the active labor market. Filtering for the <strong>Working-Age Population (Ages 15–64)</strong> isolates the active labor supply, measuring real job availability relative to actual job seekers.
            </p>
          </div>

          <div className="col-6">
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="#059669" aria-hidden="true" />
              2. Weighting Median Earnings:
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              High job availability alone is incomplete if compensation is low. Multiplying working-age job density by Stats NZ median weekly and hourly earnings ($1,200 baseline) ensures the score balances <strong>high active job availability</strong> with <strong>strong living standards</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
