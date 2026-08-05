export const CHART_CONFIG_STRATEGIES = {
  opportunity_score: (monthlyData, regionalData, extraData, hlfs) => {

      const regions = regionalData?.regions || [];
      const data = [...regions].map(r => ({
        region: r.region_name,
        "Opportunity Score (pts)": r.opportunity_score,
        "Vacancies per 100k": r.vacancies_per_100k,
        "Median Weekly Wage ($)": r.median_weekly_income,
        "Mean Rent ($/wk)": r.mean_weekly_rent
      })).sort((a, b) => (b["Opportunity Score (pts)"] || 0) - (a["Opportunity Score (pts)"] || 0));

      return {
        title: "NZ Regional Working-Age Opportunity Score Comparison (2026)",
        subtitle: "Comprehensive evaluation of job vacancy density per 100k Working-Age residents (Ages 15-64) against Stats NZ median weekly earnings.",
        source: "MBIE Jobs Online & Stats NZ Census Working-Age Population (2026)",
        filename: "nz_regional_opportunity_scores.csv",
        rangeOptions: ['All'],
        xKey: "region",
        isBarChart: true,
        dualAxis: false,
        lines: [
          { key: "Opportunity Score (pts)", color: "#8b5cf6", width: 3 }
        ],
        fullData: data,
        sliceMap: {}
      };
      },

  vacancy: (monthlyData, regionalData, extraData, hlfs) => {

      let data = [];
      if (monthlyData?.dates && monthlyData?.totals) {
        data = monthlyData.dates.map((d, i) => ({
          date: d,
          "NZ Total Vacancies": monthlyData.totals[i],
          "Auckland": monthlyData.regions?.['Auckland']?.[i] ?? null,
          "Wellington": monthlyData.regions?.['Wellington']?.[i] ?? null,
          "Canterbury": monthlyData.regions?.['Canterbury']?.[i] ?? null,
        }));
      }
      return {
        title: "NZ Job Vacancy Index Historical Trajectory (2007 – 2026)",
        subtitle: "Monthly time series tracking total MBIE online job advertisement postings across New Zealand (Index baseline = May 2007 = 100).",
        source: "MBIE Jobs Online Monthly Series (May 2007 – June 2026)",
        filename: "nz_job_vacancy_monthly_history.csv",
        rangeOptions: ['1Y', '3Y', '5Y', 'All'],
        xKey: "date",
        dualAxis: false,
        lines: [
          { key: "NZ Total Vacancies", color: "#4f46e5", width: 3 },
          { key: "Auckland", color: "#0284c7", width: 2 },
          { key: "Wellington", color: "#059669", width: 2 },
          { key: "Canterbury", color: "#d97706", width: 2 },
        ],
        fullData: data,
        sliceMap: { '1Y': 12, '3Y': 36, '5Y': 60 },
      };
      },

  income: (monthlyData, regionalData, extraData, hlfs) => {

      const incHist = regionalData?.national_income_distribution?.historical_income_series || [];
      const data = incHist.map(item => ({
        year: String(item.year),
        "Median Weekly Wage ($/wk)": item.median_weekly,
        "Hourly Equivalent ($/hr)": item.median_hourly,
      }));
      return {
        title: "NZ National Median Income Historical Growth (1998 – 2025)",
        subtitle: "28-year annual series tracking Stats NZ Household Income Census median weekly earnings ($/wk) and hourly equivalents ($/hr).",
        source: "Stats NZ Household Labour Force Survey & Annual Income Census (1998 – 2025)",
        filename: "nz_national_income_28yr_history.csv",
        rangeOptions: ['5Y', '10Y', 'All'],
        xKey: "year",
        dualAxis: true,
        leftAxisLabel: "Weekly Wage ($)",
        rightAxisLabel: "Hourly Wage ($)",
        lines: [
          { key: "Median Weekly Wage ($/wk)", color: "#059669", width: 3, axis: "left" },
          { key: "Hourly Equivalent ($/hr)", color: "#0284c7", width: 2, axis: "right" },
        ],
        fullData: data,
        sliceMap: { '5Y': 5, '10Y': 10 },
      };
      },

  unemployment: (monthlyData, regionalData, extraData, hlfs) => {

      const hist = hlfs.historical_unemployment || [
        { quarter: "Mar-26", total: 5.3, men: 5.4, women: 5.3 }
      ];
      const data = hist.map(item => ({
        quarter: item.quarter,
        "Total Unemployment Rate (%)": item.total,
        "Men (%)": item.men,
        "Women (%)": item.women,
      }));
      return {
        title: "NZ Official Unemployment Rate Historical Series (2012 – 2026)",
        subtitle: "57 quarterly series tracking official Stats NZ HLFS seasonally adjusted unemployment rates (%) overall and by gender.",
        source: "Stats NZ Household Labour Force Survey (March 2012 – March 2026)",
        filename: "nz_unemployment_rate_14yr_history.csv",
        rangeOptions: ['1Y', '3Y', '5Y', 'All'],
        xKey: "quarter",
        dualAxis: false,
        lines: [
          { key: "Total Unemployment Rate (%)", color: "#e11d48", width: 3 },
          { key: "Men (%)", color: "#0284c7", width: 2 },
          { key: "Women (%)", color: "#9333ea", width: 2 },
        ],
        fullData: data,
        sliceMap: { '1Y': 4, '3Y': 12, '5Y': 20 },
      };
      },

  underutilisation: (monthlyData, regionalData, extraData, hlfs) => {

      const hist = hlfs.historical_underutilisation || [
        { quarter: "Mar-26", total: 12.9, men: 11.6, women: 14.3 }
      ];
      const data = hist.map(item => ({
        quarter: item.quarter,
        "Total Underutilisation Rate (%)": item.total,
        "Men (%)": item.men,
        "Women (%)": item.women,
      }));
      return {
        title: "NZ Labor Underutilisation Rate Historical Series (2012 – 2026)",
        subtitle: "57 quarterly series tracking total labor slack (unemployed + underemployed part-time workers who desire more hours).",
        source: "Stats NZ HLFS Underutilisation Release (2012 – 2026)",
        filename: "nz_labor_underutilisation_14yr_history.csv",
        rangeOptions: ['1Y', '3Y', '5Y', 'All'],
        xKey: "quarter",
        dualAxis: false,
        lines: [
          { key: "Total Underutilisation Rate (%)", color: "#d97706", width: 3 },
          { key: "Men (%)", color: "#0284c7", width: 2 },
          { key: "Women (%)", color: "#9333ea", width: 2 },
        ],
        fullData: data,
        sliceMap: { '1Y': 4, '3Y': 12, '5Y': 20 },
      };
      },

  income_source: (monthlyData, regionalData, extraData, hlfs) => {
    if (!extraData) return null;

      const srcHist = extraData.historical_series || [];
      const data = srcHist.map(item => ({
        year: String(item.year),
        "Median Weekly Wage ($/wk)": item.median_weekly,
        "Hourly Equivalent ($/hr)": item.median_hourly,
      }));
      return {
        title: `NZ ${extraData.source_name}: 28-Year Historical Trajectory (1998 – 2025)`,
        subtitle: `${extraData.description}. ${extraData.policy_note || ''}`,
        source: "Stats NZ Household Labour Force Survey & Annual Household Income Census (2025 Release)",
        filename: `nz_${extraData.source_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_history.csv`,
        rangeOptions: ['5Y', '10Y', 'All'],
        xKey: "year",
        dualAxis: true,
        leftAxisLabel: "Weekly Wage ($)",
        rightAxisLabel: "Hourly Wage ($)",
        extraBreakdown: extraData,
        lines: [
          { key: "Median Weekly Wage ($/wk)", color: extraData.color || "#4f46e5", width: 3, axis: "left" },
          { key: "Hourly Equivalent ($/hr)", color: "#0284c7", width: 2, axis: "right" },
        ],
        fullData: data,
        sliceMap: { '5Y': 5, '10Y': 10 },
      };
      },

  anzsco: (monthlyData, regionalData, extraData, hlfs) => {
    if (!extraData) return null;

      const roleHist = extraData.historical_quarters || [];
      const data = roleHist.map(item => ({
        quarter: item.date,
        "Annual Growth (%)": item.annual_change,
      }));
      return {
        title: `${extraData.title} (ANZSCO ${extraData.code}): 58-Quarter Demand Trajectory`,
        subtitle: `Occupational demand index trajectory across 58 historical quarters (2011–2026). Hourly Range: ${extraData.estimated_hourly_range}. Green List: ${extraData.inz_green_list_tier || 'Standard Pathway'}.`,
        source: "MBIE Jobs Online Detailed ANZSCO Quarterly Series (2011 – 2026)",
        filename: `nz_anzsco_${extraData.code}_history.csv`,
        rangeOptions: ['1Y', '3Y', '5Y', 'All'],
        xKey: "quarter",
        dualAxis: false,
        lines: [
          { key: "Annual Growth (%)", color: "#4f46e5", width: 3 }
        ],
        fullData: data,
        sliceMap: { '1Y': 4, '3Y': 12, '5Y': 20 },
      };
      }
};
