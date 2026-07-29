import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function useTableSort(initialField = 'opportunity_score', initialDirection = 'desc') {
  const [sortField, setSortField] = useState(initialField);
  const [sortDirection, setSortDirection] = useState(initialDirection);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const onKeyDown = (e, field) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort(field);
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: 0.5 }} aria-hidden="true" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />
    ) : (
      <ArrowDown size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} aria-hidden="true" />
    );
  };

  return { sortField, sortDirection, handleSort, onKeyDown, renderSortIcon };
}
