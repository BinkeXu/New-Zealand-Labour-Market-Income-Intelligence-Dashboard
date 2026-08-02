import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce fast-changing values (such as text input keystrokes).
 * 
 * @param {any} value - The input value to debounce.
 * @param {number} delay - Debounce delay in milliseconds (default: 250ms).
 * @returns {any} Debounced value.
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
