import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Download } from 'lucide-react';

/**
 * Escapes a cell value per RFC 4180 CSV specifications.
 */
function escapeCSVCell(val) {
  if (val === null || val === undefined) {
    return '""';
  }
  let str = '';
  if (typeof val === 'object') {
    str = Array.isArray(val) ? val.join('; ') : JSON.stringify(val);
  } else {
    str = String(val);
  }
  // Double-up any existing quotes and enclose in quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * DownloadCSVButton Component
 * Converts a JS array of objects into a downloadable CSV file on the client side.
 */
export default function DownloadCSVButton({ data, filename = 'nz_labour_market_data.csv', label = 'Export CSV' }) {
  const [downloadError, setDownloadError] = useState(null);

  const handleDownload = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      setDownloadError('No data');
      setTimeout(() => setDownloadError(null), 3000);
      return;
    }

    try {
      // Extract headers
      const headers = Object.keys(data[0]);
      const csvRows = [];

      // Header row
      csvRows.push(headers.map(h => escapeCSVCell(h)).join(','));

      // Data rows
      data.forEach(row => {
        const values = headers.map(header => escapeCSVCell(row[header]));
        csvRows.push(values.join(','));
      });

      // Create Blob and Download Link
      const csvContent = csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadError(null);
    } catch (err) {
      console.error('Failed to generate CSV export:', err);
      setDownloadError('Export error');
      setTimeout(() => setDownloadError(null), 3000);
    }
  };

  const isDisabled = !data || !Array.isArray(data) || data.length === 0;

  return (
    <button 
      onClick={handleDownload}
      disabled={isDisabled}
      className="filter-btn"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        background: isDisabled ? 'var(--table-header-bg)' : 'var(--nav-bg)', 
        borderColor: 'var(--border-subtle)',
        color: isDisabled ? 'var(--text-dim)' : 'var(--text-main)',
        opacity: isDisabled ? 0.6 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer'
      }}
      title={isDisabled ? "No data currently available to export" : "Download custom data report in CSV format for Microsoft Excel"}
    >
      <Download size={14} color={isDisabled ? "var(--text-dim)" : "var(--primary)"} aria-hidden="true" />
      <span>{downloadError ? downloadError : label}</span>
    </button>
  );
}

DownloadCSVButton.propTypes = {
  data: PropTypes.array,
  filename: PropTypes.string,
  label: PropTypes.string
};
