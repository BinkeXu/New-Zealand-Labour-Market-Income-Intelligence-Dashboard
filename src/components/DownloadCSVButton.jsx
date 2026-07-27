import React from 'react';
import { Download } from 'lucide-react';

/**
 * DownloadCSVButton Component
 * Converts a JS array of objects into a downloadable CSV file on the client side.
 * 
 * @param {Array<Object>} data - Array of row objects to convert to CSV.
 * @param {string} filename - Output filename (e.g., 'nz_regional_market_data.csv').
 * @param {string} label - Button display text.
 */
export default function DownloadCSVButton({ data, filename = 'nz_labour_market_data.csv', label = 'Export CSV' }) {
  const handleDownload = () => {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    // Extract headers
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Header row
    csvRows.push(headers.join(','));

    // Data rows
    data.forEach(row => {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) {
          val = '';
        } else if (typeof val === 'object') {
          val = Array.isArray(val) ? val.join('; ') : JSON.stringify(val);
        }
        // Escape quotes
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    // Create Blob and Download Link
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={handleDownload}
      className="filter-btn"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        background: 'var(--table-header-bg)', 
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-main)',
        cursor: 'pointer'
      }}
      title="Download custom data report in CSV format for Microsoft Excel"
    >
      <Download size={14} color="var(--primary)" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
