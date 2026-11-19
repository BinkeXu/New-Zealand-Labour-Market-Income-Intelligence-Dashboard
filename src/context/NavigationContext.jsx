import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const NavigationContext = createContext(null);

export function NavigationProvider({ children, initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [preselectedIndustryId, setPreselectedIndustryId] = useState(null);

  const navigateToPathfinder = useCallback((industryId = null) => {
    if (industryId) {
      setPreselectedIndustryId(industryId);
    }
    setActiveTab('pathfinder');
  }, []);

  const clearPreselectedIndustry = useCallback(() => {
    setPreselectedIndustryId(null);
  }, []);

  const value = useMemo(() => ({
    activeTab,
    setActiveTab,
    preselectedIndustryId,
    navigateToPathfinder,
    clearPreselectedIndustry,
  }), [activeTab, preselectedIndustryId, navigateToPathfinder, clearPreselectedIndustry]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
