import React from 'react';
import { Briefcase, Compass, BarChart3, MapPin, Award, BookOpen, Sun, Moon, Activity } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Market Overview', icon: BarChart3 },
  { id: 'regional', label: 'Regional & Income', icon: MapPin },
  { id: 'industry', label: 'Industry Matrix', icon: Award },
  { id: 'pathfinder', label: 'Career Pathfinder', icon: Compass },
  { id: 'methodology', label: 'Data & Methodology', icon: BookOpen }
];

export default function Header({ activeTab, setActiveTab, theme, toggleTheme }) {
  return (
    <header>
      <nav className="navbar glass-card" aria-label="Main Navigation">
        <div className="navbar-brand">
          <div className="navbar-logo" aria-hidden="true">
            <Briefcase size={22} />
          </div>
          <div>
            <h1 className="navbar-title">NZ Labour Market & Income Intelligence</h1>
            <div className="navbar-subtitle">
              <span className="status-dot" aria-hidden="true" />
              <span>MBIE Vacancy & Stats NZ Census • 2026 Release</span>
            </div>
          </div>
        </div>

        <div className="nav-controls">
          <div className="nav-tabs" role="tablist" aria-label="Dashboard Views">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Theme Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
        </div>
      </nav>
    </header>
  );
}
