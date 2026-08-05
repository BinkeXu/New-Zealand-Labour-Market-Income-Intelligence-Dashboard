/**
 * New Zealand Labour Market & Income Intelligence Dashboard
 * Pure Data Selectors (selectors.js)
 * 
 * @module selectors
 * @description Concentrates all data transformations, filtering, sorting, slicing, 
 * and chart formatting into pure, side-effect-free, easily unit-testable selector functions.
 */

/**
 * Pure generic sort utility to sort an array of objects by field and direction.
 * 
 * @param {Array<Object>} array - Input array of objects.
 * @param {string} field - Property name to sort by.
 * @param {string} [direction='desc'] - Sort direction ('asc' or 'desc').
 * @returns {Array<Object>} Sorted copy of input array.
 */
export function sortByField(array, field, direction = 'desc') {
  if (!array || !Array.isArray(array)) return [];
  if (!field) return array;

  return [...array].sort((a, b) => {
    const valA = a[field];
    const valB = b[field];

    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return direction === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }

    return direction === 'asc' ? valA - valB : valB - valA;
  });
}

/**
 * Selects time-series chart data for the Overview line chart based on the selected time horizon.
 */
export function selectOverviewChartData(monthlyData, timeRange) {
  try {
    if (!monthlyData || !monthlyData.dates || monthlyData.dates.length === 0) {
      return [];
    }

    const totalLength = monthlyData.dates.length;
    let sliceCount = 60; // Default to 5 Years (60 months)
    if (timeRange === '3M') sliceCount = 3;
    if (timeRange === '6M') sliceCount = 6;
    if (timeRange === '1Y') sliceCount = 12;
    if (timeRange === '3Y') sliceCount = 36;
    if (timeRange === '5Y') sliceCount = 60;
    if (timeRange === 'All') sliceCount = totalLength;

    return monthlyData.dates.slice(-sliceCount).map((date, idx) => {
      const realIndex = totalLength - sliceCount + idx;
      return {
        date,
        "Overall Vacancies": monthlyData.totals?.[realIndex] ?? null,
        "Auckland": monthlyData.regions?.Auckland?.[realIndex] ?? null,
        "Wellington": monthlyData.regions?.Wellington?.[realIndex] ?? null,
        "Canterbury": monthlyData.regions?.Canterbury?.[realIndex] ?? null,
        "Highly Skilled": monthlyData.skills?.["Highly-Skilled"]?.[realIndex] ?? null,
        "Skilled": monthlyData.skills?.["Skilled"]?.[realIndex] ?? null,
        "Low Skilled": monthlyData.skills?.["Low-Skilled"]?.[realIndex] ?? null,
      };
    });
  } catch (err) {
    console.error('Error in selectOverviewChartData:', err);
    return [];
  }
}

/**
 * Selects filtered and sorted regions based on Island, City/Region search query, sort field, and direction.
 */
export function selectFilteredRegions(regionalData, selectedIsland, selectedCityFilter, sortField = 'opportunity_score', sortDirection = 'desc') {
  try {
    if (!regionalData || !regionalData.regions) {
      return [];
    }

    const query = selectedCityFilter ? selectedCityFilter.trim().toLowerCase() : '';

    const result = regionalData.regions.filter(r => {
      const matchesIsland = selectedIsland === 'All' || r.island === selectedIsland;
      const matchesCity = !query || 
        r.region_name.toLowerCase().includes(query) ||
        (r.cities_included && r.cities_included.some(c => c.toLowerCase().includes(query)));
      return matchesIsland && matchesCity;
    });

    return sortByField(result, sortField, sortDirection);
  } catch (err) {
    console.error('Error in selectFilteredRegions:', err);
    return [];
  }
}

/**
 * Formats regional summary data for Recharts BarChart visualization using Working-Age Population density.
 */
export function selectRegionalChartData(filteredRegions) {
  try {
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
  } catch (err) {
    console.error('Error in selectRegionalChartData:', err);
    return [];
  }
}

/**
 * Filters and sorts industry vacancy index data for specific NZ cities and regions.
 */
export function selectFilteredCityIndustryVacancies(cityIndustryData, selectedRegion = 'All', selectedIndustry = 'All', searchCity = '', sortField = 'current_vacancy_index', sortDirection = 'desc') {
  try {
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

    return sortByField(matrix, sortField, sortDirection);
  } catch (err) {
    console.error('Error in selectFilteredCityIndustryVacancies:', err);
    return [];
  }
}

/**
 * Filters and sorts the Industry Opportunity 2x2 Matrix items based on quadrant selection.
 */
export function selectFilteredIndustryMatrix(industryData, selectedQuadrant, sortField = 'median_weekly_income', sortDirection = 'desc') {
  try {
    if (!industryData || !industryData.industry_matrix) {
      return [];
    }

    let matrix = industryData.industry_matrix;
    if (selectedQuadrant !== 'All') {
      matrix = matrix.filter(item => item.quadrant && item.quadrant.includes(selectedQuadrant));
    }

    return sortByField(matrix, sortField, sortDirection);
  } catch (err) {
    console.error('Error in selectFilteredIndustryMatrix:', err);
    return [];
  }
}

/**
 * Filters and sorts detailed 4-digit ANZSCO occupational roles.
 */
export function selectFilteredOccupations(occupationData, searchTerm, sortField = 'annual_change_percent', sortDirection = 'desc', maxResults = 15) {
  try {
    if (!occupationData || !occupationData.all_occupations) {
      return [];
    }

    const query = searchTerm ? searchTerm.trim().toLowerCase() : '';
    let occupations = occupationData.all_occupations;

    if (query) {
      occupations = occupations.filter(occ => 
        (occ.title && occ.title.toLowerCase().includes(query)) ||
        (occ.code && occ.code.includes(query))
      );
    }

    const sorted = sortByField(occupations, sortField, sortDirection);
    return sorted.slice(0, maxResults);
  } catch (err) {
    console.error('Error in selectFilteredOccupations:', err);
    return [];
  }
}

/**
 * Selects National Income Distribution metrics safely from regionalData.
 */
export function selectNationalIncomeDistribution(regionalData) {
  try {
    if (!regionalData || !regionalData.national_income_distribution) {
      return null;
    }
    return regionalData.national_income_distribution;
  } catch (err) {
    console.error('Error in selectNationalIncomeDistribution:', err);
    return null;
  }
}

/**
 * Selects level-specific industry benchmark data for a given seniority level.
 */
export function selectLevelIndustryBenchmarks(levelData, level = 'Intermediate') {
  try {
    if (!levelData || !levelData.levels || !levelData.levels[level]) {
      return null;
    }
    return levelData.levels[level];
  } catch (err) {
    console.error('Error in selectLevelIndustryBenchmarks:', err);
    return null;
  }
}

/**
 * Selects job volume estimate for a specific industry, region, and seniority level.
 */
export function selectJobVolumeEstimates(jobVolumeData, industry, region, level) {
  try {
    if (!jobVolumeData || !jobVolumeData.industries) return null;
    const indData = jobVolumeData.industries[industry];
    if (!indData || !indData.regions) return null;
    
    // Find matching region (exact match or mapping)
    // The regional keys in jobVolumeData match the benchmark keys (e.g. "Auckland", "Wellington")
    const regData = indData.regions[region];
    if (!regData || !regData.levels) return null;
    
    return regData.levels[level] || null;
  } catch (err) {
    console.error('Error in selectJobVolumeEstimates:', err);
    return null;
  }
}
