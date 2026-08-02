import React from 'react';
import { DashboardProvider, useDashboardContext } from './context/DashboardContext';
import Header from './components/Header';
import Overview from './components/Overview';
import RegionalMatrix from './components/RegionalMatrix';
import IndustryQuadrant from './components/IndustryQuadrant';
import CareerPathfinder from './components/CareerPathfinder';
import Methodology from './components/Methodology';

function DashboardContent() {
  const { 
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
  } = useDashboardContext();

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-card section-card" style={{ textAlign: 'center', padding: '48px' }} role="status" aria-live="polite">
          <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>
            Loading NZ Labour Market Intelligence…
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Fetching MBIE vacancy indices and Stats NZ income benchmarks…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="glass-card section-card" style={{ borderColor: '#f43f5e' }}>
          <h2 style={{ color: '#f43f5e', marginBottom: '8px' }}>Dataset Load Error</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />

      {/* Main Tab Content */}
      <main>
        {activeTab === 'overview' && (
          <Overview 
            monthlyData={monthlyData} 
            regionalData={regionalData} 
            irdIncomeData={irdIncomeData}
            onNavigate={(tab) => setActiveTab(tab)} 
          />
        )}

        {activeTab === 'regional' && (
          <RegionalMatrix 
            regionalData={regionalData} 
            cityIndustryData={cityIndustryData}
            irdIncomeData={irdIncomeData}
          />
        )}

        {activeTab === 'industry' && (
          <IndustryQuadrant 
            industryData={industryData} 
            occupationData={occupationData} 
            cityIndustryData={cityIndustryData}
            monthlyData={monthlyData}
            regionalData={regionalData}
          />
        )}

        {activeTab === 'pathfinder' && (
          <CareerPathfinder 
            pathfinderRules={pathfinderRules} 
            regionalData={regionalData}
            industryData={industryData}
          />
        )}

        {activeTab === 'methodology' && (
          <Methodology />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          New Zealand Labour Market & Income Intelligence Platform • Data Sources: MBIE Jobs Online & Stats NZ Census (2026 Release)
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
