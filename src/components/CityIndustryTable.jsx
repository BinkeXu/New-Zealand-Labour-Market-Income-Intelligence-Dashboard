import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

export default function CityIndustryTable({ cityIndustryMatrix, allIndustries, openHistoricalChart }) {
  const [cityPage, setCityPage] = useState(1);
  const rowsPerPage = 15;
  const totalCityPages = Math.ceil((cityIndustryMatrix?.length || 0) / rowsPerPage);
  const paginatedCityMatrix = (cityIndustryMatrix || []).slice((cityPage - 1) * rowsPerPage, cityPage * rowsPerPage);

  return (
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

            <div>
              <label htmlFor="matrix-level-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '4px' }}>Seniority Level:</label>
              <select 
                id="matrix-level-select"
                className="select-control"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                aria-label="Filter matrix by Seniority Level"
              >
                <option value="Junior">Junior (0-2 Yrs)</option>
                <option value="Intermediate">Intermediate (3-5 Yrs)</option>
                <option value="Senior">Senior (6+ Yrs)</option>
                <option value="Lead / Executive">Lead / Exec (10+ Yrs)</option>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Opportunity Score 
                      <Info size={14} color="var(--text-muted)" aria-label="Calculated as: (Vacancy Index × Regional Industry Share) × (Wage / $1,200) / Competition Index" title="Calculated as: (Vacancy Index × Regional Industry Share) × (Wage / $1,200) / Competition Index" />
                      <SortIcon field="opportunity_score" sortField={matrixSortField} sortDirection={matrixSortDirection} />
                    </div>
                  </th>
                  <th scope="col">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Estimated Annual Openings
                      <Info size={14} color="var(--text-muted)" aria-label="Extrapolated from Stats NZ Industry Size × LEED Turnover Rate × Regional Share × Seniority Curve" title="Extrapolated from Stats NZ Industry Size × LEED Turnover Rate × Regional Share × Seniority Curve" />
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
                {cityIndustryMatrix.map((row) => {
                  const levelDist = levelBenchmarks?.industries?.[row.industry]?.regional_distribution?.[row.region_name];
                  const oppScore = levelDist ? levelDist.opportunity_score : row.opportunity_score;
                  
                  return (
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
                      {oppScore ? (
                        <span className="badge badge-amber tabular-nums" style={{ fontWeight: '900', fontSize: '0.85rem' }}>
                          {oppScore} pts
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const est = selectJobVolumeEstimates(jobVolumeData, row.industry, row.region_name, selectedLevel);
                        return est !== null ? (
                          <span className="badge badge-cyan tabular-nums" style={{ fontWeight: '800', fontSize: '0.85rem' }}>
                            ~{est.toLocaleString()} roles
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>N/A</span>
                        );
                      })()}
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
                      {levelBenchmarks && levelBenchmarks.industries[row.industry] ? (
                        levelBenchmarks.industries[row.industry].salary_range_hourly
                      ) : (
                        `$${row.hourly_income ? row.hourly_income.toFixed(2) : (row.median_weekly_income / 40.0).toFixed(2)} / hr`
                      )}
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: '600' }}>
                      {levelBenchmarks && levelBenchmarks.industries[row.industry] ? (
                        `$${levelBenchmarks.industries[row.industry].median_weekly.toLocaleString()} / wk`
                      ) : (
                        `$${row.median_weekly_income ? row.median_weekly_income.toLocaleString() : 'N/A'} / wk`
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
  );
}

CityIndustryTable.propTypes = {
  cityIndustryMatrix: PropTypes.array,
  allIndustries: PropTypes.array,
  openHistoricalChart: PropTypes.func.isRequired
};
