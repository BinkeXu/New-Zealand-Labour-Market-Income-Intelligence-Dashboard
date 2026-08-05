import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { NavigationProvider, useNavigation } from './NavigationContext';
import { DataProvider, useDashboardData } from './DataContext';

export { ThemeProvider, useTheme } from './ThemeContext';
export { NavigationProvider, useNavigation } from './NavigationContext';
export { DataProvider, useDashboardData } from './DataContext';

export function DashboardProvider({ children }) {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}

