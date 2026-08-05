import RegionalLeaderboard from './RegionalLeaderboard';
import CityIndustryTable from './CityIndustryTable';
import React, { useState, useMemo } from 'react';
import { 
  selectFilteredRegions, 
  selectRegionalChartData, 
  selectFilteredCityIndustryVacancies,
  selectLevelIndustryBenchmarks,
  selectJobVolumeEstimates
} from '../utils/selectors';
import { useDashboardData } from '../context/DashboardContext';
import DownloadCSVButton from './DownloadCSVButton';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { 
  MapPin, Award, ArrowUpRight, Database, Users, AlertCircle, Calculator, Briefcase, Home, UserCheck, Zap, Star, Info
} from 'lucide-react';
import { useTableSort, SortIcon } from '../hooks/useTableSort';
import { useDebounce } from '../hooks/useDebounce';

export default function RegionalMatrix() {
  const { regionalData, cityIndustryData, levelData, jobVolumeData } = useDashboardData();
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

  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  
  const levelBenchmarks = useMemo(() => {
    return selectLevelIndustryBenchmarks(levelData, selectedLevel);
  }, [levelData, selectedLevel]);

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
      <RegionalLeaderboard data={topOpportunityLeaderboard} />

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
      <CityIndustryTable cityIndustryMatrix={cityIndustryMatrix} allIndustries={allIndustries} openHistoricalChart={openHistoricalChart} />

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
