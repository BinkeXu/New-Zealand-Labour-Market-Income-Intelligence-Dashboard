import React, { lazy, Suspense } from 'react';
import { DashboardProvider, useNavigation, useTheme, useDashboardData } from './context/DashboardContext';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';

// Code-split tabs lazily to optimize initial bundle size
const Overview = lazy(() => import('./components/Overview'));
const RegionalMatrix = lazy(() => import('./components/RegionalMatrix'));
const IndustryQuadrant = lazy(() => import('./components/IndustryQuadrant'));
const CareerPathfinder = lazy(() => import('./components/CareerPathfinder'));
const Methodology = lazy(() => import('./components/Methodology'));

function TabFallback() {
  return (
    <div className="glass-card section-card" style={{ textAlign: 'center', padding: '48px', margin: '24px 0' }} role="status" aria-live="polite">
      <div className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '8px' }}>
        Loading Section…
      </div>
      <p style={{ color: 'var(--text-muted)' }}>Rendering analytics module…</p>
    </div>
  );
}

function DashboardContent() {
  const { activeTab, setActiveTab } = useNavigation();
  const { theme, toggleTheme } = useTheme();
  const { loading, error } = useDashboardData();

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
        <div className="glass-card section-card" style={{ borderColor: 'var(--accent-rose)' }}>
          <h2 style={{ color: 'var(--accent-rose)', marginBottom: '8px' }}>Dataset Load Error</h2>
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
        <ErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            {activeTab === 'overview' && (
              <Overview />
            )}

            {activeTab === 'regional' && (
              <RegionalMatrix />
            )}

            {activeTab === 'industry' && (
              <IndustryQuadrant />
            )}

            {activeTab === 'pathfinder' && (
              <CareerPathfinder />
            )}

            {activeTab === 'methodology' && (
              <Methodology />
            )}
          </Suspense>
        </ErrorBoundary>
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
