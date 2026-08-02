import React, { createContext, useContext, useState, useMemo } from 'react';

const NavigationContext = createContext(null);

export function NavigationProvider({ children, initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const value = useMemo(() => ({
    activeTab,
    setActiveTab
  }), [activeTab]);

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
