import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  sortByField,
  selectOverviewChartData,
  selectFilteredRegions, 
  selectRegionalChartData, 
  selectFilteredIndustryMatrix,
  selectFilteredOccupations,
  selectNationalIncomeDistribution,
  calculateNZTakeHomePay,
  getOpportunityBadge
} from '../selectors.js';

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
    assert.equal(sortedDesc[0].region_name, 'Canterbury');

    const sortedAsc = sortByField(sampleRegionalData.regions, 'opportunity_score', 'asc');
    assert.equal(sortedAsc[0].region_name, 'Auckland');

    const sortedNameAsc = sortByField(sampleRegionalData.regions, 'region_name', 'asc');
    assert.equal(sortedNameAsc[0].region_name, 'Auckland');
  });

  it('selectOverviewChartData handles empty or null data safely', () => {
    assert.deepEqual(selectOverviewChartData(null, '5Y'), []);
    assert.deepEqual(selectOverviewChartData({}, '5Y'), []);
  });

  it('selectFilteredRegions filters by Island correctly', () => {
    const northResult = selectFilteredRegions(sampleRegionalData, 'North Island', '');
    assert.equal(northResult.length, 1);
    assert.equal(northResult[0].region_name, 'Auckland');

    const southResult = selectFilteredRegions(sampleRegionalData, 'South Island', '');
    assert.equal(southResult.length, 1);
    assert.equal(southResult[0].region_name, 'Canterbury');
  });

  it('selectFilteredRegions filters by city search query correctly', () => {
    const searchResult = selectFilteredRegions(sampleRegionalData, 'All', 'Christchurch');
    assert.equal(searchResult.length, 1);
    assert.equal(searchResult[0].region_name, 'Canterbury');
  });

  it('selectRegionalChartData formats Recharts input array correctly', () => {
    const filtered = selectFilteredRegions(sampleRegionalData, 'All', '');
    const chartData = selectRegionalChartData(filtered);
    assert.equal(chartData.length, 2);
    assert.equal(chartData[0].name, 'Canterbury');
    assert.equal(chartData[0]['Hourly Wage ($/hr)'], 33.58);
  });

  it('selectFilteredIndustryMatrix filters by quadrant', () => {
    const sampleIndustryData = {
      industry_matrix: [
        { industry: 'IT', quadrant: 'Star (High Growth)', median_weekly_income: 1850 },
        { industry: 'Retail', quadrant: 'Stable', median_weekly_income: 950 }
      ]
    };
    const result = selectFilteredIndustryMatrix(sampleIndustryData, 'Star');
    assert.equal(result.length, 1);
    assert.equal(result[0].industry, 'IT');
  });

  it('selectFilteredOccupations filters by search keyword and limits results', () => {
    const sampleOccData = {
      all_occupations: [
        { code: '2613', title: 'Software Engineer', annual_change_percent: 15.2, inz_green_list_tier: 'Tier 1 (Straight to Residence)' },
        { code: '2544', title: 'Registered Nurse', annual_change_percent: 8.4, inz_green_list_tier: 'Tier 1 (Straight to Residence)' },
        { code: '3411', title: 'Electricians', annual_change_percent: 5.1, inz_green_list_tier: 'Tier 2 (Work to Residence)' },
        { code: '4231', title: 'Aged and Disabled Carers', annual_change_percent: 4.2, inz_green_list_tier: 'Sector Agreement (Work to Residence)' },
        { code: '5311', title: 'General Clerks', annual_change_percent: -2.1, inz_green_list_tier: null }
      ]
    };
    const result = selectFilteredOccupations(sampleOccData, 'Nurse', 'annual_change_percent', 'desc', 10);
    assert.equal(result.length, 1);
    assert.equal(result[0].code, '2544');
  });

  it('selectFilteredOccupations filters by Visa Tier correctly', () => {
    const sampleOccData = {
      all_occupations: [
        { code: '2613', title: 'Software Engineer', annual_change_percent: 15.2, inz_green_list_tier: 'Tier 1 (Straight to Residence)' },
        { code: '2544', title: 'Registered Nurse', annual_change_percent: 8.4, inz_green_list_tier: 'Tier 1 (Straight to Residence)' },
        { code: '3411', title: 'Electricians', annual_change_percent: 5.1, inz_green_list_tier: 'Tier 2 (Work to Residence)' },
        { code: '4231', title: 'Aged and Disabled Carers', annual_change_percent: 4.2, inz_green_list_tier: 'Sector Agreement (Work to Residence)' },
        { code: '5311', title: 'General Clerks', annual_change_percent: -2.1, inz_green_list_tier: null }
      ]
    };

    // Tier 1
    const t1 = selectFilteredOccupations(sampleOccData, '', 'annual_change_percent', 'desc', 10, 'Tier 1');
    assert.equal(t1.length, 2);

    // Tier 2
    const t2 = selectFilteredOccupations(sampleOccData, '', 'annual_change_percent', 'desc', 10, 'Tier 2');
    assert.equal(t2.length, 1);
    assert.equal(t2[0].code, '3411');

    // Sector Agreement
    const sec = selectFilteredOccupations(sampleOccData, '', 'annual_change_percent', 'desc', 10, 'Sector Agreement');
    assert.equal(sec.length, 1);
    assert.equal(sec[0].code, '4231');

    // All Green List / Fast Track
    const allGL = selectFilteredOccupations(sampleOccData, '', 'annual_change_percent', 'desc', 10, 'All Green List');
    assert.equal(allGL.length, 4);
  });

  it('getOpportunityBadge returns correct qualitative rating bands', () => {
    assert.equal(getOpportunityBadge(135).tier, 'high');
    assert.equal(getOpportunityBadge(135).label, 'High Opportunity');

    assert.equal(getOpportunityBadge(105).tier, 'moderate');
    assert.equal(getOpportunityBadge(105).label, 'Balanced Market');

    assert.equal(getOpportunityBadge(75).tier, 'competitive');
    assert.equal(getOpportunityBadge(75).label, 'Competitive');

    assert.equal(getOpportunityBadge(null).tier, 'none');
  });

  it('calculateNZTakeHomePay calculates accurate NZ PAYE tax and ACC levy', () => {
    // $100,000 annual gross salary
    const pay100k = calculateNZTakeHomePay(100000);
    assert.equal(pay100k.annualGross, 100000);
    assert.equal(pay100k.totalTax, 22878); // $22,877.50 rounded to $22,878
    assert.equal(pay100k.accLevy, 1600); // 1.6% of $100k
    assert.equal(pay100k.annualNet, 75523); // $75,522.50 rounded to $75,523
    assert.equal(pay100k.weeklyNet, 1452); // $1,452.36 rounded
    assert.equal(pay100k.effectiveRate, 24.5);

    // Zero or invalid input
    const zeroPay = calculateNZTakeHomePay(0);
    assert.equal(zeroPay.annualNet, 0);
    assert.equal(zeroPay.weeklyNet, 0);
  });
});
