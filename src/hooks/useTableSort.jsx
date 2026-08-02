import React, { useState, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Pure helper component for rendering table header sort icons.
 */
export function SortIcon({ field, sortField, sortDirection }) {
  if (sortField !== field) {
    return <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: 0.5 }} aria-hidden="true" />;
  }
  return sortDirection === 'asc' ? (
    <ArrowUp size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />
  ) : (
    <ArrowDown size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />
  );
}

/**
 * Custom hook for table sorting state management.
 */
export function useTableSort(initialField = 'opportunity_score', initialDirection = 'desc') {
  const [sortField, setSortField] = useState(initialField);
  const [sortDirection, setSortDirection] = useState(initialDirection);

  const handleSort = useCallback((field) => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        return currentField;
      } else {
        setSortDirection('desc');
        return field;
      }
    });
  }, []);

  const onKeyDown = useCallback((e, field) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort(field);
    }
  }, [handleSort]);

  // Backward-compatible render method
  const renderSortIcon = useCallback((field) => (
    <SortIcon field={field} sortField={sortField} sortDirection={sortDirection} />
  ), [sortField, sortDirection]);

  return { sortField, sortDirection, handleSort, onKeyDown, renderSortIcon };
}
