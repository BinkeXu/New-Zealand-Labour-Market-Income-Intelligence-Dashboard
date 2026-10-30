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
 * Evaluates a qualitative Opportunity Score tier and returns label and badge styling metadata.
 * Benchmarks:
 * - 120+: High Opportunity (Substantial job density and wage premium)
 * - 90 - 119: Balanced Market (Stable replacement hiring and steady pay)
 * - < 90: Competitive (Tight market with lower vacancies per capita)
 */
export function getOpportunityBadge(score) {
  if (score == null || isNaN(score)) {
    return { label: 'Unrated', variant: 'badge-neutral', tier: 'none' };
  }
  const num = Number(score);
  if (num >= 120) {
    return { label: 'High Opportunity', variant: 'badge-emerald', tier: 'high', iconColor: '#059669' };
  }
  if (num >= 90) {
    return { label: 'Balanced Market', variant: 'badge-amber', tier: 'moderate', iconColor: '#d97706' };
  }
  return { label: 'Competitive', variant: 'badge-rose', tier: 'competitive', iconColor: '#e11d48' };
}

/**
 * Calculates official New Zealand PAYE annual tax and ACC Earner's Levy (2025/2026 Inland Revenue rates).
 * Tax Brackets:
 * - $0 to $15,600: 10.5%
 * - $15,601 to $53,500: 17.5%
 * - $53,501 to $78,100: 30.0%
 * - $78,101 to $180,000: 33.0%
 * - Over $180,000: 39.0%
 * ACC Earner's Levy: 1.60% (capped at $142,283 income)
 *
 * @param {number} annualGross - Gross annual earnings in NZD.
 * @returns {object} Net annual and weekly take-home income, tax breakdown, and effective rate.
 */
export function calculateNZTakeHomePay(annualGross) {
  if (!annualGross || annualGross <= 0 || isNaN(annualGross)) {
    return {
      annualGross: 0,
      weeklyGross: 0,
      annualNet: 0,
      weeklyNet: 0,
      totalTax: 0,
      accLevy: 0,
      totalDeductions: 0,
      effectiveRate: 0
    };
  }

  const gross = Number(annualGross);
  let tax = 0;

  if (gross <= 15600) {
    tax = gross * 0.105;
  } else if (gross <= 53500) {
    tax = (15600 * 0.105) + ((gross - 15600) * 0.175);
  } else if (gross <= 78100) {
    tax = (15600 * 0.105) + ((53500 - 15600) * 0.175) + ((gross - 53500) * 0.30);
  } else if (gross <= 180000) {
    tax = (15600 * 0.105) + ((53500 - 15600) * 0.175) + ((78100 - 53500) * 0.30) + ((gross - 78100) * 0.33);
  } else {
    tax = (15600 * 0.105) + ((53500 - 15600) * 0.175) + ((78100 - 53500) * 0.30) + ((180000 - 78100) * 0.33) + ((gross - 180000) * 0.39);
  }

  // ACC earner levy capped at $142,283 (max $2,276.53)
  const accCapped = Math.min(gross, 142283);
  const accLevy = accCapped * 0.0160;

  const totalDeductions = tax + accLevy;
  const annualNet = Math.max(0, gross - totalDeductions);
  const weeklyNet = annualNet / 52.0;
  const effectiveRate = Number(((totalDeductions / gross) * 100).toFixed(1));

  return {
    annualGross: Math.round(gross),
    weeklyGross: Math.round(gross / 52.0),
    annualNet: Math.round(annualNet),
    weeklyNet: Math.round(weeklyNet),
    totalTax: Math.round(tax),
    accLevy: Math.round(accLevy),
    totalDeductions: Math.round(totalDeductions),
    effectiveRate
  };
}

/**
 * Filters and sorts detailed 4-digit ANZSCO occupational roles with optional visa tier filtering.
 */
export function selectFilteredOccupations(occupationData, searchTerm, sortField = 'annual_change_percent', sortDirection = 'desc', maxResults = 25, visaTierFilter = 'All') {
  try {
    if (!occupationData || !occupationData.all_occupations) {
      return [];
    }

    const query = searchTerm ? searchTerm.trim().toLowerCase() : '';
    let occupations = occupationData.all_occupations;

    // Visa Tier / Green List Filter
    if (visaTierFilter && visaTierFilter !== 'All') {
      if (visaTierFilter === 'Tier 1') {
        occupations = occupations.filter(occ => occ.inz_green_list_tier && occ.inz_green_list_tier.includes('Tier 1'));
      } else if (visaTierFilter === 'Tier 2') {
        occupations = occupations.filter(occ => occ.inz_green_list_tier && occ.inz_green_list_tier.includes('Tier 2'));
      } else if (visaTierFilter === 'Sector Agreement') {
        occupations = occupations.filter(occ => occ.inz_green_list_tier && occ.inz_green_list_tier.includes('Sector Agreement'));
      } else if (visaTierFilter === 'All Green List') {
        occupations = occupations.filter(occ => Boolean(occ.inz_green_list_tier));
      }
    }

    if (query) {
      occupations = occupations.filter(occ => 
        (occ.title && occ.title.toLowerCase().includes(query)) ||
        (occ.code && occ.code.includes(query))
      );
    }

    const sorted = sortByField(occupations, sortField, sortDirection);
    return maxResults ? sorted.slice(0, maxResults) : sorted;
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
