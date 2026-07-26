/**
 * New Zealand Labour Market & Income Intelligence Dashboard
 * Pure Data Selectors (selectors.js)
 * 
 * @module selectors
 * @description Concentrates all data transformations, filtering, sorting, slicing, 
 * and chart formatting into pure, side-effect-free, easily unit-testable selector functions.
 */

/**
 * Selects time-series chart data for the Overview line chart based on the selected time horizon.
 * 
 * @param {Object} monthlyData - Parsed JSON object from /data/monthly_series.json containing dates and series arrays.
 * @param {string} timeRange - Selected time horizon ('1Y', '3Y', '5Y', or 'All').
 * @returns {Array<Object>} Formatted data points for Recharts LineChart rendering.
 */
export function selectOverviewChartData(monthlyData, timeRange) {
  if (!monthlyData || !monthlyData.dates || monthlyData.dates.length === 0) {
    return [];
  }

  const totalLength = monthlyData.dates.length;
  let sliceCount = 60; // Default to 5 Years (60 months)
  if (timeRange === '1Y') sliceCount = 12;
  if (timeRange === '3Y') sliceCount = 36;
  if (timeRange === 'All') sliceCount = totalLength;

  return monthlyData.dates.slice(-sliceCount).map((date, idx) => {
    const realIndex = totalLength - sliceCount + idx;
    return {
      date,
      "Overall Vacancies": monthlyData.totals[realIndex],
      "Auckland": monthlyData.regions.Auckland?.[realIndex] ?? null,
      "Wellington": monthlyData.regions.Wellington?.[realIndex] ?? null,
      "Canterbury": monthlyData.regions.Canterbury?.[realIndex] ?? null,
      "Highly Skilled": monthlyData.skills["Highly-Skilled"]?.[realIndex] ?? null,
      "Skilled": monthlyData.skills["Skilled"]?.[realIndex] ?? null,
      "Low Skilled": monthlyData.skills["Low-Skilled"]?.[realIndex] ?? null,
    };
  });
}

/**
 * Selects filtered and sorted regions based on Island, City/Region search query, sort field, and direction.
 * 
 * @param {Object} regionalData - Parsed JSON object from /data/regional_summary.json.
 * @param {string} selectedIsland - Island filter ('All', 'North Island', or 'South Island').
 * @param {string} selectedCityFilter - Search text to filter region names or included cities.
 * @param {string} [sortField='opportunity_score'] - Object property key to sort by.
 * @param {string} [sortDirection='desc'] - Sort direction ('asc' or 'desc').
 * @returns {Array<Object>} Filtered and sorted region summary objects.
 */
export function selectFilteredRegions(regionalData, selectedIsland, selectedCityFilter, sortField = 'opportunity_score', sortDirection = 'desc') {
  if (!regionalData || !regionalData.regions) {
    return [];
  }

  const query = selectedCityFilter ? selectedCityFilter.trim().toLowerCase() : '';

  let result = regionalData.regions.filter(r => {
    const matchesIsland = selectedIsland === 'All' || r.island === selectedIsland;
    const matchesCity = !query || 
      r.region_name.toLowerCase().includes(query) ||
      (r.cities_included && r.cities_included.some(c => c.toLowerCase().includes(query)));
    return matchesIsland && matchesCity;
  });

  if (sortField) {
    result = [...result].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }

  return result;
}

/**
 * Formats regional summary data for Recharts BarChart visualization using Working-Age Population density.
 * 
 * @param {Array<Object>} filteredRegions - Array of region summary objects from selectFilteredRegions.
 * @returns {Array<Object>} Formatted objects compatible with Recharts BarChart data prop.
 */
export function selectRegionalChartData(filteredRegions) {
  if (!filteredRegions || filteredRegions.length === 0) {
    return [];
  }

  return filteredRegions.map(r => ({
    name: r.region_name,
    "Vacancy Index": r.vacancy_index,
    "Vacancies per 100k (Ages 15-64)": r.vacancies_per_100k,
    "Hourly Wage ($/hr)": r.hourly_income,
    "Weekly Income ($)": r.median_weekly_income,
    "Opportunity Score (Working-Age)": r.opportunity_score
  }));
}

/**
 * Filters and sorts industry vacancy index data for specific NZ cities and regions.
 * 
 * @param {Object} cityIndustryData - Parsed JSON object from /data/city_industry_vacancies.json.
 * @param {string} [selectedRegion='All'] - Specific region filter name.
 * @param {string} [selectedIndustry='All'] - Specific industry filter name.
 * @param {string} [searchCity=''] - Search term for city or industry.
 * @param {string} [sortField='current_vacancy_index'] - Field to sort by.
 * @param {string} [sortDirection='desc'] - Sort direction ('asc' or 'desc').
 * @returns {Array<Object>} Matrix rows detailing vacancy index, YoY growth, and hourly wages.
 */
export function selectFilteredCityIndustryVacancies(cityIndustryData, selectedRegion = 'All', selectedIndustry = 'All', searchCity = '', sortField = 'current_vacancy_index', sortDirection = 'desc') {
  if (!cityIndustryData || !cityIndustryData.city_industry_matrix) {
    return [];
  }

  let matrix = cityIndustryData.city_industry_matrix;
  const query = searchCity ? searchCity.trim().toLowerCase() : '';

  matrix = matrix.filter(row => {
    const matchesRegion = selectedRegion === 'All' || row.region_name === selectedRegion;
    const matchesIndustry = selectedIndustry === 'All' || row.industry === selectedIndustry;
    const matchesQuery = !query || 
      row.region_name.toLowerCase().includes(query) ||
      row.industry.toLowerCase().includes(query) ||
      (row.cities_included && row.cities_included.some(c => c.toLowerCase().includes(query)));
    return matchesRegion && matchesIndustry && matchesQuery;
  });

  if (sortField) {
    matrix = [...matrix].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }

  return matrix;
}

/**
 * Filters and sorts the Industry Opportunity 2x2 Matrix items based on quadrant selection.
 * 
 * @param {Object} industryData - Parsed JSON object from /data/industry_matrix.json.
 * @param {string} selectedQuadrant - Quadrant filter ('All', 'Star', 'High Demand', 'High Salary', 'Stable').
 * @param {string} [sortField='median_weekly_income'] - Property name to sort by.
 * @param {string} [sortDirection='desc'] - Sort direction ('asc' or 'desc').
 * @returns {Array<Object>} Sorted list of industry sector metrics.
 */
export function selectFilteredIndustryMatrix(industryData, selectedQuadrant, sortField = 'median_weekly_income', sortDirection = 'desc') {
  if (!industryData || !industryData.industry_matrix) {
    return [];
  }

  let matrix = industryData.industry_matrix;
  if (selectedQuadrant !== 'All') {
    matrix = matrix.filter(item => item.quadrant.includes(selectedQuadrant));
  }

  if (sortField) {
    matrix = [...matrix].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }

  return matrix;
}

/**
 * Filters and sorts detailed 4-digit ANZSCO occupational roles.
 * 
 * @param {Object} occupationData - Parsed JSON object from /data/detailed_occupations.json.
 * @param {string} searchTerm - Search query for ANZSCO title or code.
 * @param {string} [sortField='annual_change_percent'] - Property name to sort by.
 * @param {string} [sortDirection='desc'] - Sort direction ('asc' or 'desc').
 * @param {number} [maxResults=15] - Maximum number of occupation rows to return.
 * @returns {Array<Object>} Filtered list of detailed ANZSCO occupations.
 */
export function selectFilteredOccupations(occupationData, searchTerm, sortField = 'annual_change_percent', sortDirection = 'desc', maxResults = 15) {
  if (!occupationData || !occupationData.all_occupations) {
    return [];
  }

  const query = searchTerm ? searchTerm.trim().toLowerCase() : '';
  let occupations = occupationData.all_occupations;

  if (query) {
    occupations = occupations.filter(occ => 
      occ.title.toLowerCase().includes(query) ||
      occ.code.includes(query)
    );
  }

  if (sortField) {
    occupations = [...occupations].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }

  return occupations.slice(0, maxResults);
}
