import { describe, it, expect } from 'vitest';
import { 
  selectFilteredRegions, 
  selectRegionalChartData, 
  selectFilteredIndustryMatrix,
  selectFilteredOccupations
} from '../selectors';

describe('selectors.js unit tests', () => {
  const sampleRegionalData = {
    regions: [
      {
        region_name: 'Auckland',
        island: 'North Island',
        cities_included: ['Auckland City', 'Manukau'],
        vacancy_index: 115.67,
        median_weekly_income: 1438.0,
        hourly_income: 35.95,
        opportunity_score: 138.61
      },
      {
        region_name: 'Canterbury',
        island: 'South Island',
        cities_included: ['Christchurch', 'Timaru'],
        vacancy_index: 206.99,
        median_weekly_income: 1343.0,
        hourly_income: 33.58,
        opportunity_score: 231.66
      }
    ]
  };

  it('selectFilteredRegions filters by Island correctly', () => {
    const northResult = selectFilteredRegions(sampleRegionalData, 'North Island', '');
    expect(northResult).toHaveLength(1);
    expect(northResult[0].region_name).toBe('Auckland');

    const southResult = selectFilteredRegions(sampleRegionalData, 'South Island', '');
    expect(southResult).toHaveLength(1);
    expect(southResult[0].region_name).toBe('Canterbury');
  });

  it('selectFilteredRegions filters by city search query correctly', () => {
    const searchResult = selectFilteredRegions(sampleRegionalData, 'All', 'Christchurch');
    expect(searchResult).toHaveLength(1);
    expect(searchResult[0].region_name).toBe('Canterbury');
  });

  it('selectRegionalChartData formats Recharts input array correctly', () => {
    const filtered = selectFilteredRegions(sampleRegionalData, 'All', '');
    const chartData = selectRegionalChartData(filtered);
    expect(chartData).toHaveLength(2);
    expect(chartData[0].name).toBe('Auckland');
    expect(chartData[0]['Hourly Wage ($/hr)']).toBe(35.95);
  });
});
