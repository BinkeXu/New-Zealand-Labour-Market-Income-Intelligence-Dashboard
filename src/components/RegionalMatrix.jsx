import React, { useState, useMemo } from 'react';
import { 
  selectFilteredRegions, 
  selectRegionalChartData, 
  selectFilteredCityIndustryVacancies 
} from '../utils/selectors';
import DownloadCSVButton from './DownloadCSVButton';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { 
  MapPin, Award, ArrowUpRight, Database, Users, AlertCircle, Calculator, Briefcase, Home, UserCheck, Zap, Star 
} from 'lucide-react';
import { useTableSort, SortIcon } from '../hooks/useTableSort';
import { useDebounce } from '../hooks/useDebounce';

export default function RegionalMatrix({ regionalData, cityIndustryData }) {
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCityFilter, setSelectedCityFilter] = useState('');
  
  // Debounce search query to prevent high-frequency re-filtering on keystrokes
  const debouncedCityFilter = useDebounce(selectedCityFilter, 250);

  // Regional Summary Sorting State
  const { 
    sortField, 
    sortDirection, 
    handleSort, 
    onKeyDown
  } = useTableSort('opportunity_score', 'desc');

  // City x Industry Matrix Filter & Sorting State
  const [matrixRegion, setMatrixRegion] = useState('All');
  const [matrixIndustry, setMatrixIndustry] = useState('All');
  
  const { 
    sortField: matrixSortField, 
    sortDirection: matrixSortDirection, 
    handleSort: handleMatrixSort, 
    onKeyDown: onMatrixKeyDown
  } = useTableSort('opportunity_score', 'desc');

  const filteredRegions = useMemo(() => {
    return selectFilteredRegions(regionalData, selectedIsland, debouncedCityFilter, sortField, sortDirection);
  }, [regionalData, selectedIsland, debouncedCityFilter, sortField, sortDirection]);

  // Opportunity Score Leaderboard Ranking (Top 4 Regions)
  const topOpportunityLeaderboard = useMemo(() => {
    const all = regionalData?.regions || [];
    return [...all].sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0)).slice(0, 4);
  }, [regionalData]);

  const chartData = useMemo(() => {
    return selectRegionalChartData(filteredRegions);
  }, [filteredRegions]);

  const cityIndustryMatrix = useMemo(() => {
    return selectFilteredCityIndustryVacancies(
      cityIndustryData, 
      matrixRegion, 
      matrixIndustry, 
      debouncedCityFilter, 
      matrixSortField, 
      matrixSortDirection
    );
  }, [cityIndustryData, matrixRegion, matrixIndustry, debouncedCityFilter, matrixSortField, matrixSortDirection]);

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
      {/* HIGHLIGHT BANNER: Working-Age Opportunity Score Leaderboard */}
      <section className="glass-card section-card" style={{ marginBottom: '28px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(79, 70, 229, 0.04) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }} aria-labelledby="opp-leaderboard-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 id="opp-leaderboard-title" className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
              <Award size={24} color="#8b5cf6" aria-hidden="true" />
              NZ Working-Age Opportunity Score Regional Leaderboard
            </h2>
            <p className="card-subtitle">
              Evaluates job vacancy availability per 100k active Working-Age residents (Ages 15–64) relative to Stats NZ median weekly earnings.
            </p>
          </div>
          <span className="badge badge-amber" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            ⭐ Working-Age Density Benchmark
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          {topOpportunityLeaderboard.map((reg, idx) => (
            <div 
              key={reg.region_name} 
              style={{ 
                background: 'var(--bg-card)', 
                padding: '14px 16px', 
                borderRadius: '12px', 
                border: idx === 0 ? '2px solid #8b5cf6' : '1px solid var(--border-subtle)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: idx === 0 ? '#8b5cf6' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Rank #{idx + 1} Region
                </span>
                <span className={`badge ${idx === 0 ? 'badge-amber' : idx === 1 ? 'badge-indigo' : 'badge-emerald'}`} style={{ fontSize: '0.75rem' }}>
                  {reg.opportunity_score} pts
                </span>
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                {reg.region_name}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Vacancies: <strong>{reg.vacancies_per_100k}/100k</strong></span>
                <span>Wage: <strong>${reg.median_weekly_income}/wk</strong></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 1: Regional Summary & Purchasing Power Analysis */}
      <section className="glass-card section-card" style={{ marginBottom: '28px' }} aria-labelledby="regional-matrix-title">
        <div className="card-header-flex">
          <div>
            <h2 id="regional-matrix-title" className="card-title">
              <MapPin size={22} className="text-gradient-cyan" aria-hidden="true" />
              All New Zealand Regional Vacancies, Opportunity Scores & Income
            </h2>
            <p className="card-subtitle">
              Comprehensive analysis of online job vacancies (MBIE), median earnings (Stats NZ), mean rent (Stats NZ/MBIE Tenancy), and <strong>Working-Age Opportunity Scores</strong> across all 10 regions.
            </p>
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label htmlFor="city-search-input" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Filter City / Region:</label>
                <input 
                  id="city-search-input"
                  type="text" 
                  placeholder="Type city (e.g. Hamilton, Dunedin)…"
                  className="select-control"
                  style={{ width: '220px' }}
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

              {/* Download CSV Button */}
              <DownloadCSVButton 
                data={filteredRegions} 
                filename="nz_regional_purchasing_power_report.csv" 
                label="Export CSV" 
              />
            </div>
          </div>
        </div>

        {filteredRegions.length === 0 ? (
          <div className="no-data-banner" style={{ margin: '24px 0' }}>
            <AlertCircle size={20} aria-hidden="true" />
            <span>No data available for "{debouncedCityFilter}". Try searching a major NZ city name or clear the filter.</span>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div style={{ width: '100%', height: 340, marginBottom: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} interval={0} angle={-25} textAnchor="end" />
                  <YAxis yAxisId="left" stroke="#4f46e5" fontSize={11} orientation="left" label={{ value: 'Vacancies / 100k', angle: -90, position: 'insideLeft', fill: '#4f46e5' }} />
                  <YAxis yAxisId="right" stroke="#8b5cf6" fontSize={11} orientation="right" label={{ value: 'Opportunity Score (pts)', angle: 90, position: 'insideRight', fill: '#8b5cf6' }} />
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
                  <Bar yAxisId="right" dataKey="Opportunity Score (Working-Age)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="data-source-caption" style={{ marginBottom: '24px' }}>
              <Database size={14} aria-hidden="true" />
              <span>Data Sources: MBIE Jobs Online, Stats NZ Income Census, Stats NZ Mean Rent (2026) & Working-Age Population</span>
            </div>

            {/* Sortable Regional Data Table */}
            <div className="custom-table-container">
              <table className="custom-table" aria-label="Regional Purchasing Power Data Table">
                <thead>
                  <tr>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('region_name')} onKeyDown={(e) => onKeyDown(e, 'region_name')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Region Name <SortIcon field="region_name" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('opportunity_score')} onKeyDown={(e) => onKeyDown(e, 'opportunity_score')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Opportunity Score <SortIcon field="opportunity_score" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('working_age_population')} onKeyDown={(e) => onKeyDown(e, 'working_age_population')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Working-Age Pop (15–64) <SortIcon field="working_age_population" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('vacancies_per_100k')} onKeyDown={(e) => onKeyDown(e, 'vacancies_per_100k')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Vacancies / 100k <SortIcon field="vacancies_per_100k" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('median_weekly_income')} onKeyDown={(e) => onKeyDown(e, 'median_weekly_income')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Median Weekly Wage <SortIcon field="median_weekly_income" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('mean_weekly_rent')} onKeyDown={(e) => onKeyDown(e, 'mean_weekly_rent')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Mean Rent ($/wk) <SortIcon field="mean_weekly_rent" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('net_discretionary_income')} onKeyDown={(e) => onKeyDown(e, 'net_discretionary_income')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Net Income (After Rent) <SortIcon field="net_discretionary_income" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('purchasing_power_index')} onKeyDown={(e) => onKeyDown(e, 'purchasing_power_index')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Real Purchasing Power <SortIcon field="purchasing_power_index" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegions.map((region) => (
                    <tr key={region.region_name}>
                      <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} color="#4f46e5" aria-hidden="true" />
                          {region.region_name}
                        </div>
                      </td>
                      <td>
                        {region.opportunity_score ? (
                          <span className="badge badge-amber tabular-nums" style={{ fontWeight: '900', fontSize: '0.85rem' }}>
                            {region.opportunity_score} pts
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="tabular-nums">
                        {region.working_age_population ? (
                          <span>{region.working_age_population.toLocaleString()}</span>
                        ) : 'N/A'}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: '700', color: '#4f46e5' }}>
                        {region.vacancies_per_100k ? `${region.vacancies_per_100k} / 100k` : 'N/A'}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: '600' }}>
                        {region.median_weekly_income ? `$${region.median_weekly_income.toLocaleString()} / wk` : 'N/A'}
                      </td>
                      <td className="tabular-nums" style={{ color: 'var(--accent-rose)', fontWeight: '600' }}>
                        {region.mean_weekly_rent ? `$${region.mean_weekly_rent.toFixed(2)} / wk` : 'N/A'}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: '700', color: '#059669' }}>
                        {region.net_discretionary_income ? `$${region.net_discretionary_income.toFixed(2)} / wk` : 'N/A'}
                      </td>
                      <td>
                        {region.purchasing_power_index ? (
                          <span className="badge badge-emerald tabular-nums" style={{ fontWeight: '800' }}>
                            {region.purchasing_power_index} pts
                          </span>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* SECTION 2: City x Industry Vacancy Breakdown Matrix */}
      <section className="glass-card section-card" aria-labelledby="city-industry-matrix-title">
        <div className="card-header-flex">
          <div>
            <h2 id="city-industry-matrix-title" className="card-title">
              <Briefcase size={22} className="text-gradient" aria-hidden="true" />
              City x Industry Vacancy & Calibrated Opportunity Score Matrix
            </h2>
            <p className="card-subtitle">
              Granular vacancy indices and <strong>Market Concentration-Weighted Opportunity Scores</strong> across specific NZ cities and industry sectors. Filter by region or industry below.
            </p>
          </div>

          <div className="filter-group">
            <div>
              <label htmlFor="matrix-region-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Region:</label>
              <select 
                id="matrix-region-select"
                className="select-control"
                value={matrixRegion}
                onChange={(e) => setMatrixRegion(e.target.value)}
                aria-label="Filter matrix by Region"
              >
                <option value="All">All Regions</option>
                {regionalData.regions.map((r, i) => (
                  <option key={i} value={r.region_name}>{r.region_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="matrix-industry-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Industry:</label>
              <select 
                id="matrix-industry-select"
                className="select-control"
                value={matrixIndustry}
                onChange={(e) => setMatrixIndustry(e.target.value)}
                aria-label="Filter matrix by Industry"
              >
                <option value="All">All Industry Sectors</option>
                {allIndustries.map((ind, i) => (
                  <option key={i} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <DownloadCSVButton 
              data={cityIndustryMatrix} 
              filename="nz_city_industry_vacancy_matrix.csv" 
              label="Export Matrix CSV" 
            />
          </div>
        </div>

        {cityIndustryMatrix.length === 0 ? (
          <div className="no-data-banner">
            <AlertCircle size={20} aria-hidden="true" />
            <span>No industry vacancy data available for this selection.</span>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table" aria-label="City Industry Vacancies Table">
              <thead>
                <tr>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('region_name')} onKeyDown={(e) => onMatrixKeyDown(e, 'region_name')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Region / City <SortIcon field="region_name" sortField={matrixSortField} sortDirection={matrixSortDirection} />
                    </div>
                  </th>
                  <th scope="col">Cities Included</th>
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
                      YoY Vacancy Growth (%) <SortIcon field="yoy_growth_percent" sortField={matrixSortField} sortDirection={matrixSortDirection} />
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
                </tr>
              </thead>
              <tbody>
                {cityIndustryMatrix.map((row) => (
                  <tr key={`${row.region_name}-${row.industry}`}>
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
                    <td>
                      {row.opportunity_score ? (
                        <span className="badge badge-amber tabular-nums" style={{ fontWeight: '900', fontSize: '0.85rem' }}>
                          {row.opportunity_score} pts
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>N/A</span>
                      )}
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
                      ${row.median_weekly_income ? row.median_weekly_income.toLocaleString() : 'N/A'} / wk
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Opportunity Score & Rent Methodology Card with Volume Weighting Explanation */}
      <section className="glass-card section-card col-12" style={{ marginTop: '28px' }} aria-labelledby="opportunity-formula-title">
        <h3 id="opportunity-formula-title" className="card-title" style={{ marginBottom: '16px', color: 'var(--text-main)' }}>
          <Calculator size={22} className="text-gradient" aria-hidden="true" />
          Opportunity Score Calibration & Real Purchasing Power Methodology
        </h3>

        <div className="section-grid" style={{ marginBottom: 0 }}>
          <div className="col-6">
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={16} color="#059669" aria-hidden="true" />
              1. Rent-Adjusted Real Purchasing Power:
            </h4>
            <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary)', background: 'var(--table-header-bg)', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
              Net Discretionary = Median Weekly Wage - Mean Rent ($/wk)
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              High wages in Wellington ($1,496/wk) or Auckland ($1,438/wk) are offset by high rents ($553 – $618/wk). Canterbury ($1,343/wk wage, $519 rent) offers higher net disposable income relative to cost of living.
            </p>
          </div>

          <div className="col-6">
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={16} color="#4f46e5" aria-hidden="true" />
              2. Market-Volume Weighted Opportunity Score:
            </h4>
            <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary)', background: 'var(--table-header-bg)', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
              Opp Score = (Vacancy Index × Regional Industry Share Weight) × (Wage / $1,200)
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              <strong>Why Market Weighting Matters:</strong> MBIE Job Vacancy indices track growth relative to 2007 baselines. Without regional market concentration weights, small regional growth spikes could falsely overstate opportunities. By weighting each region's actual share of national industry hiring (e.g. Auckland 60% of IT, Wellington 25% of IT, Waikato 22% of Primary Agriculture), Opportunity Scores accurately reflect true hiring volume and career depth.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
