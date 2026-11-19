/**
 * Helpers for the interactive New Zealand regional choropleth map.
 */

export const MAP_METRICS = [
  {
    id: 'vacancies_per_100k',
    label: 'Vacancies / 100k',
    shortLabel: 'Vacancies/100k',
    description: 'Online job vacancies per 100k working-age residents (Ages 15–64)',
    format: (v) => (v != null && !Number.isNaN(v) ? `${Number(v).toFixed(1)} / 100k` : 'N/A'),
  },
  {
    id: 'median_weekly_income',
    label: 'Median Income',
    shortLabel: 'Weekly Income',
    description: 'Median weekly gross earnings (Stats NZ Income Census)',
    format: (v) => (v != null && !Number.isNaN(v) ? `$${Math.round(v).toLocaleString()} / wk` : 'N/A'),
  },
  {
    id: 'net_discretionary_income',
    label: 'Purchasing Power',
    shortLabel: 'After Rent',
    description: 'Gross median weekly wage minus mean weekly rent',
    format: (v) => (v != null && !Number.isNaN(v) ? `$${Math.round(v).toLocaleString()} / wk` : 'N/A'),
  },
  {
    id: 'vacancy_index',
    label: 'Vacancy Index',
    shortLabel: 'Index',
    description: 'MBIE Jobs Online index relative to historical baseline',
    format: (v) => (v != null && !Number.isNaN(v) ? Number(v).toFixed(1) : 'N/A'),
  },
  {
    id: 'unemployment_rate',
    label: 'Unemployment (%)',
    shortLabel: 'Unemp %',
    description: 'Regional unemployment rate (Stats NZ HLFS, Sept 2026 Q3)',
    format: (v) => (v != null && !Number.isNaN(v) ? `${Number(v).toFixed(1)}%` : 'N/A'),
  },
  {
    id: 'rent_to_income_pct',
    label: 'Rent / Income (%)',
    shortLabel: 'Rent Burden',
    description: 'Share of gross median weekly wage spent on mean weekly rent',
    format: (v) => (v != null && !Number.isNaN(v) ? `${Number(v).toFixed(1)}%` : 'N/A'),
  },
];

export const GROUPED_REGION_NOTES = {
  'Gisborne/Hawkes Bay': 'Combined MBIE region: Gisborne & Hawke’s Bay',
  'Manawatu-Whanganui/Taranaki': 'Combined MBIE region: Manawatū-Whanganui & Taranaki',
  'Tasman/Nelson/Marlborough/West Coast': 'Combined MBIE region: Tasman, Nelson, Marlborough & West Coast',
  'Otago/Southland': 'Combined MBIE region: Otago & Southland',
};

export function getMetricConfig(metricId) {
  return MAP_METRICS.find((m) => m.id === metricId) || MAP_METRICS[0];
}

export function getRegionMetricRange(regions, metricId) {
  const values = (regions || [])
    .map((r) => Number(r?.[metricId]))
    .filter((v) => Number.isFinite(v));

  if (values.length === 0) {
    return { min: 0, max: 1 };
  }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function lerpChannel(a, b, t) {
  return Math.round(a + (b - a) * t);
}

/**
 * Single-hue sequential colour scale (indigo -> cyan) tuned for Dark and Light themes.
 */
export function getChoroplethColor(value, min, max, theme = 'dark') {
  if (!Number.isFinite(value)) {
    return theme === 'dark' ? '#1e293b' : '#e2e8f0';
  }
  const span = max - min;
  const t = span > 0 ? Math.max(0, Math.min(1, (value - min) / span)) : 0.5;

  // Dark mode: deep slate-indigo (#1e2b58) -> vivid sky-cyan (#38bdf8)
  // Light mode: soft indigo mist (#dbeafe) -> deep royal indigo (#3730a3)
  const low = theme === 'dark' ? [30, 43, 88] : [219, 234, 254];
  const high = theme === 'dark' ? [56, 189, 248] : [55, 48, 163];

  const r = lerpChannel(low[0], high[0], t);
  const g = lerpChannel(low[1], high[1], t);
  const b = lerpChannel(low[2], high[2], t);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Computes national summary stats for the unselected (default) map detail card.
 */
export function computeNationalSummary(regions, activeMetricId = 'vacancies_per_100k') {
  const list = (regions || []).filter((r) => r && r.has_data !== false);
  if (list.length === 0) {
    return null;
  }

  const totalWorkingAgePop = list.reduce((sum, r) => sum + (Number(r.working_age_population) || 0), 0);
  const avgVacanciesPer100k =
    list.reduce((sum, r) => sum + (Number(r.vacancies_per_100k) || 0), 0) / list.length;
  const avgWeeklyIncome =
    list.reduce((sum, r) => sum + (Number(r.median_weekly_income) || 0), 0) / list.length;
  const avgNetDiscretionary =
    list.reduce((sum, r) => sum + (Number(r.net_discretionary_income) || 0), 0) / list.length;

  const sortedByOpp = [...list].sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
  const sortedByMetric = [...list].sort(
    (a, b) => (Number(b[activeMetricId]) || -Infinity) - (Number(a[activeMetricId]) || -Infinity)
  );

  return {
    regionCount: list.length,
    totalWorkingAgePop,
    avgVacanciesPer100k,
    avgWeeklyIncome,
    avgNetDiscretionary,
    topOpportunityRegion: sortedByOpp[0] || null,
    topMetricRegion: sortedByMetric[0] || null,
  };
}

/**
 * Returns top N and bottom N regions ranked by the active metric for mini-bar comparisons.
 */
export function getTopAndBottomRegions(regions, metricId = 'vacancies_per_100k', count = 3) {
  const valid = (regions || []).filter(
    (r) => r && r.has_data !== false && Number.isFinite(Number(r[metricId]))
  );
  if (valid.length === 0) return { top: [], bottom: [], maxVal: 1 };

  const sorted = [...valid].sort((a, b) => Number(b[metricId]) - Number(a[metricId]));
  const maxVal = Math.max(...sorted.map((r) => Number(r[metricId])), 1);

  return {
    top: sorted.slice(0, count),
    bottom: sorted.slice(-count).reverse(),
    maxVal,
  };
}
