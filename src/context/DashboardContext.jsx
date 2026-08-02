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

/**
 * Backward-compatible hook combining navigation, theme, and dataset states.
 * For optimal render performance in new components, prefer `useTheme()`, `useNavigation()`, or `useDashboardData()`.
 */
export function useDashboardContext() {
  const themeState = useTheme();
  const navState = useNavigation();
  const dataState = useDashboardData();

  return {
    ...themeState,
    ...navState,
    ...dataState
  };
}
