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
  MapPin, Award, ArrowUpRight, Database, Users, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Calculator, CheckCircle, Briefcase, Filter, UserCheck, Home, DollarSign 
} from 'lucide-react';
import { useTableSort } from '../hooks/useTableSort';

export default function RegionalMatrix({ regionalData, cityIndustryData }) {
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCityFilter, setSelectedCityFilter] = useState('');
  
  // Regional Summary Sorting State
  const { 
    sortField, 
    sortDirection, 
    handleSort, 
    onKeyDown, 
    renderSortIcon 
  } = useTableSort('opportunity_score', 'desc');

  // City x Industry Matrix Filter & Sorting State
  const [matrixRegion, setMatrixRegion] = useState('All');
  const [matrixIndustry, setMatrixIndustry] = useState('All');
  
  const { 
    sortField: matrixSortField, 
    sortDirection: matrixSortDirection, 
    handleSort: handleMatrixSort, 
    onKeyDown: onMatrixKeyDown, 
    renderSortIcon: renderMatrixSortIcon 
  } = useTableSort('current_vacancy_index', 'desc');


  const filteredRegions = useMemo(() => {
    return selectFilteredRegions(regionalData, selectedIsland, selectedCityFilter, sortField, sortDirection);
  }, [regionalData, selectedIsland, selectedCityFilter, sortField, sortDirection]);

  const chartData = useMemo(() => {
    return selectRegionalChartData(filteredRegions);
  }, [filteredRegions]);

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
      {/* SECTION 1: Regional Summary & Purchasing Power Analysis */}
      <section className="glass-card section-card" style={{ marginBottom: '24px' }} aria-labelledby="regional-matrix-title">
        <div className="card-header-flex">
          <div>
            <h2 id="regional-matrix-title" className="card-title">
              <MapPin size={22} className="text-gradient-cyan" aria-hidden="true" />
              All New Zealand Regional Vacancies, Income, Rent & Purchasing Power
            </h2>
            <p className="card-subtitle">
              Comprehensive analysis of online job vacancies (MBIE), median earnings (Stats NZ), mean rent (Stats NZ/MBIE Tenancy), and <strong>Rent-Adjusted Real Purchasing Power Index</strong> across all 10 regions.
            </p>
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label htmlFor="city-search-input" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Filter City / Region:</label>
                <input 
                  id="city-search-input"
                  type="text" 
                  placeholder="Type city (e.g. Hamilton, Dunedin, Tauranga)…"
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
            <span>No data available for "{selectedCityFilter}". Try searching a major NZ city name or clear the filter.</span>
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
              <span>Data Sources: MBIE Jobs Online, Stats NZ Income Census, Stats NZ Mean Rent (2026) & Working-Age Population</span>
            </div>

            {/* Sortable Regional Data Table */}
            <div className="custom-table-container">
              <table className="custom-table" aria-label="Regional Purchasing Power Data Table">
                <thead>
                  <tr>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('region_name')} onKeyDown={(e) => onKeyDown(e, 'region_name')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Region Name {renderSortIcon('region_name')}
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('working_age_population')} onKeyDown={(e) => onKeyDown(e, 'working_age_population')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Working-Age Pop (15–64) {renderSortIcon('working_age_population')}
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('vacancies_per_100k')} onKeyDown={(e) => onKeyDown(e, 'vacancies_per_100k')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Vacancies / 100k {renderSortIcon('vacancies_per_100k')}
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('median_weekly_income')} onKeyDown={(e) => onKeyDown(e, 'median_weekly_income')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Median Weekly Wage {renderSortIcon('median_weekly_income')}
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('mean_weekly_rent')} onKeyDown={(e) => onKeyDown(e, 'mean_weekly_rent')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Mean Rent ($/wk) {renderSortIcon('mean_weekly_rent')}
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('net_discretionary_income')} onKeyDown={(e) => onKeyDown(e, 'net_discretionary_income')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Net Income (After Rent) {renderSortIcon('net_discretionary_income')}
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('purchasing_power_index')} onKeyDown={(e) => onKeyDown(e, 'purchasing_power_index')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Real Purchasing Power {renderSortIcon('purchasing_power_index')}
                      </div>
                    </th>
                    <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleSort('opportunity_score')} onKeyDown={(e) => onKeyDown(e, 'opportunity_score')}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        Opportunity Score {renderSortIcon('opportunity_score')}
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
                      <td>
                        {region.opportunity_score ? (
                          <span className="badge badge-indigo tabular-nums" style={{ fontWeight: '800' }}>
                            {region.opportunity_score} pts
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

      {/* SECTION 2: Industry Vacancy Breakdown per City/Region */}
      <section className="glass-card section-card" style={{ marginBottom: '24px' }} aria-labelledby="city-industry-matrix-title">
        <div className="card-header-flex">
          <div>
            <h2 id="city-industry-matrix-title" className="card-title">
              <Briefcase size={22} className="text-gradient" aria-hidden="true" />
              Industry Vacancy Breakdown in Each New Zealand City & Region
            </h2>
            <p className="card-subtitle">
              Detailed breakdown of online job vacancy index and YoY growth rate for <strong>every industry in every New Zealand city</strong> (March 2026 Release).
            </p>
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
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

              <DownloadCSVButton 
                data={cityIndustryMatrix} 
                filename="nz_city_industry_vacancy_matrix.csv" 
                label="Export Matrix CSV" 
              />
            </div>
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
                      Region / City {renderMatrixSortIcon('region_name')}
                    </div>
                  </th>
                  <th scope="col">Cities Included</th>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('industry')} onKeyDown={(e) => onMatrixKeyDown(e, 'industry')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Industry Sector {renderMatrixSortIcon('industry')}
                    </div>
                  </th>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('current_vacancy_index')} onKeyDown={(e) => onMatrixKeyDown(e, 'current_vacancy_index')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      MBIE Vacancy Index {renderMatrixSortIcon('current_vacancy_index')}
                    </div>
                  </th>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('yoy_growth_percent')} onKeyDown={(e) => onMatrixKeyDown(e, 'yoy_growth_percent')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      YoY Vacancy Growth (%) {renderMatrixSortIcon('yoy_growth_percent')}
                    </div>
                  </th>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('hourly_income')} onKeyDown={(e) => onMatrixKeyDown(e, 'hourly_income')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Hourly Wage (40 hr/wk) {renderMatrixSortIcon('hourly_income')}
                    </div>
                  </th>
                  <th scope="col" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => handleMatrixSort('median_weekly_income')} onKeyDown={(e) => onMatrixKeyDown(e, 'median_weekly_income')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Median Weekly Wage {renderMatrixSortIcon('median_weekly_income')}
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
      </section>

      {/* Opportunity Score & Rent Methodology Card */}
      <section className="glass-card section-card col-12" aria-labelledby="opportunity-formula-title">
        <h3 id="opportunity-formula-title" className="card-title" style={{ marginBottom: '16px', color: 'var(--text-main)' }}>
          <Calculator size={22} className="text-gradient" aria-hidden="true" />
          Real Rent-Adjusted Purchasing Power & Working-Age Opportunity Score
        </h3>

        <div className="section-grid" style={{ marginBottom: 0 }}>
          <div className="col-6">
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={16} color="#059669" aria-hidden="true" />
              1. Rent-Adjusted Real Purchasing Power:
            </h4>
            <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--table-header-bg)', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
              Net Discretionary = Median Weekly Wage - Mean Rent ($/wk)
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              High wages in Wellington ($1,496/wk) or Auckland ($1,438/wk) are offset by high rents ($553 – $618/wk). Canterbury ($1,343/wk wage, $519 rent) offers higher net disposable income relative to cost of living.
            </p>
          </div>

          <div className="col-6">
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={16} color="#4f46e5" aria-hidden="true" />
              2. Working-Age Opportunity Score:
            </h4>
            <div className="tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--table-header-bg)', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
              Opp Score = (Vacancies / 100k Working-Age / 50) × (Wage / $1,200) × 100
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Filters out children (&lt;15) and retirees (65+) to measure per-capita job vacancy density relative to active job seekers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
