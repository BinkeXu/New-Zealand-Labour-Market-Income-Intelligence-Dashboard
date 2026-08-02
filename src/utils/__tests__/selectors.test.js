import { describe, it, expect } from 'vitest';
import { 
  sortByField,
  selectOverviewChartData,
  selectFilteredRegions, 
  selectRegionalChartData, 
  selectFilteredIndustryMatrix,
  selectFilteredOccupations,
  selectNationalIncomeDistribution
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

  it('sortByField sorts numeric and string fields in asc and desc order', () => {
    const sortedDesc = sortByField(sampleRegionalData.regions, 'opportunity_score', 'desc');
    expect(sortedDesc[0].region_name).toBe('Canterbury');

    const sortedAsc = sortByField(sampleRegionalData.regions, 'opportunity_score', 'asc');
    expect(sortedAsc[0].region_name).toBe('Auckland');

    const sortedNameAsc = sortByField(sampleRegionalData.regions, 'region_name', 'asc');
    expect(sortedNameAsc[0].region_name).toBe('Auckland');
  });

  it('selectOverviewChartData handles empty or null data safely', () => {
    expect(selectOverviewChartData(null, '5Y')).toEqual([]);
    expect(selectOverviewChartData({}, '5Y')).toEqual([]);
  });

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
    expect(chartData[0].name).toBe('Canterbury');
    expect(chartData[0]['Hourly Wage ($/hr)']).toBe(33.58);
  });

  it('selectFilteredIndustryMatrix filters by quadrant', () => {
    const sampleIndustryData = {
      industry_matrix: [
        { industry: 'IT', quadrant: 'Star (High Growth)', median_weekly_income: 1850 },
        { industry: 'Retail', quadrant: 'Stable', median_weekly_income: 950 }
      ]
    };
    const result = selectFilteredIndustryMatrix(sampleIndustryData, 'Star');
    expect(result).toHaveLength(1);
    expect(result[0].industry).toBe('IT');
  });

  it('selectFilteredOccupations filters and limits results', () => {
    const sampleOccData = {
      all_occupations: [
        { code: '2613', title: 'Software Engineer', annual_change_percent: 15.2 },
        { code: '2544', title: 'Registered Nurse', annual_change_percent: 8.4 }
      ]
    };
    const result = selectFilteredOccupations(sampleOccData, 'Nurse', 'annual_change_percent', 'desc', 10);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('2544');
  });
});
