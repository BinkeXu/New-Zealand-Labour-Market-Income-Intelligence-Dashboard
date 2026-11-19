import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMetricConfig,
  getRegionMetricRange,
  getChoroplethColor,
  computeNationalSummary,
  getTopAndBottomRegions,
} from '../mapHelpers.js';

describe('mapHelpers.js unit tests', () => {
  const sampleRegions = [
    {
      region_name: 'Auckland',
      has_data: true,
      working_age_population: 950000,
      vacancies_per_100k: 12.0,
      median_weekly_income: 1440,
      net_discretionary_income: 820,
      opportunity_score: 29.0,
    },
    {
      region_name: 'Canterbury',
      has_data: true,
      working_age_population: 380000,
      vacancies_per_100k: 18.5,
      median_weekly_income: 1340,
      net_discretionary_income: 850,
      opportunity_score: 34.0,
    },
  ];

  it('returns default metric config when id is unknown', () => {
    const cfg = getMetricConfig('nonexistent');
    assert.equal(cfg.id, 'vacancies_per_100k');
  });

  it('computes min and max range safely across regions', () => {
    const range = getRegionMetricRange(sampleRegions, 'vacancies_per_100k');
    assert.equal(range.min, 12.0);
    assert.equal(range.max, 18.5);
  });

  it('interpolates distinct sequential colours for dark and light themes', () => {
    const darkLow = getChoroplethColor(10, 10, 20, 'dark');
    const darkHigh = getChoroplethColor(20, 10, 20, 'dark');
    const lightLow = getChoroplethColor(10, 10, 20, 'light');
    assert.notEqual(darkLow, darkHigh);
    assert.notEqual(darkLow, lightLow);
    assert.ok(darkHigh.startsWith('rgb('));
  });

  it('computes national summary and identifies top region', () => {
    const summary = computeNationalSummary(sampleRegions, 'vacancies_per_100k');
    assert.equal(summary.regionCount, 2);
    assert.equal(summary.totalWorkingAgePop, 1330000);
    assert.equal(summary.topOpportunityRegion.region_name, 'Canterbury');
    assert.equal(summary.topMetricRegion.region_name, 'Canterbury');
  });

  it('returns ranked top and bottom regions for mini-bars', () => {
    const ranked = getTopAndBottomRegions(sampleRegions, 'vacancies_per_100k', 1);
    assert.equal(ranked.top[0].region_name, 'Canterbury');
    assert.equal(ranked.bottom[0].region_name, 'Auckland');
    assert.equal(ranked.maxVal, 18.5);
  });
});
