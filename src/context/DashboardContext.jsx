import React, { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Default to Light Mode
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nz_dashboard_theme') || 'light';
  });

  const [monthlyData, setMonthlyData] = useState(null);
  const [regionalData, setRegionalData] = useState(null);
  const [cityIndustryData, setCityIndustryData] = useState(null);
  const [industryData, setIndustryData] = useState(null);
  const [occupationData, setOccupationData] = useState(null);
  const [pathfinderRules, setPathfinderRules] = useState(null);
  const [irdIncomeData, setIrdIncomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nz_dashboard_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resMonthly, resRegional, resCityIndustry, resIndustry, resOccupation, resRules, resIrd] = await Promise.all([
          fetch('/data/monthly_series.json'),
          fetch('/data/regional_summary.json'),
          fetch('/data/city_industry_vacancies.json'),
          fetch('/data/industry_matrix.json'),
          fetch('/data/detailed_occupations.json'),
          fetch('/data/career_pathfinder_rules.json'),
          fetch('/data/ird_income_distributions.json')
        ]);

        if (!resMonthly.ok || !resRegional.ok || !resCityIndustry.ok) {
          throw new Error('Failed to load JSON datasets. Ensure ETL pipeline has been executed.');
        }

        const dataMonthly = await resMonthly.json();
        const dataRegional = await resRegional.json();
        const dataCityIndustry = await resCityIndustry.json();
        const dataIndustry = await resIndustry.json();
        const dataOccupation = await resOccupation.json();
        const dataRules = await resRules.json();
        const dataIrd = resIrd.ok ? await resIrd.json() : null;

        setMonthlyData(dataMonthly);
        setRegionalData(dataRegional);
        setCityIndustryData(dataCityIndustry);
        setIndustryData(dataIndustry);
        setOccupationData(dataOccupation);
        setPathfinderRules(dataRules);
        setIrdIncomeData(dataIrd);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard datasets:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const value = {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    monthlyData,
    regionalData,
    cityIndustryData,
    industryData,
    occupationData,
    pathfinderRules,
    irdIncomeData,
    loading,
    error
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
