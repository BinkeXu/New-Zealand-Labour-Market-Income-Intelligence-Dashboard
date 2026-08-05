import PropTypes from 'prop-types';
import { CHART_CONFIG_STRATEGIES } from '../config/chartStrategies';
import React, { useState, useMemo, useEffect } from 'react';
import { X, Database, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import DownloadCSVButton from './DownloadCSVButton';

export default function HistoricalChartModal({ isOpen, onClose, modalMetric, extraData, monthlyData, regionalData }) {
  const [modalTimeRange, setModalTimeRange] = useState('All');

  // Handle Escape key & body overflow lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Compute chart configuration based on modalMetric
  const chartConfig = useMemo(() => {
    if (!modalMetric || !CHART_CONFIG_STRATEGIES[modalMetric]) return null;
    const hlfs = monthlyData?.metadata?.hlfs_labor_metrics || {};
    return CHART_CONFIG_STRATEGIES[modalMetric](monthlyData, regionalData, extraData, hlfs);
  }, [modalMetric, monthlyData, regionalData, extraData]);

  // Filter fullData according to modalTimeRange
  const displayData = useMemo(() => {
    if (!chartConfig || !chartConfig.fullData) return [];
    if (modalTimeRange === 'All' || !chartConfig.sliceMap || !chartConfig.sliceMap[modalTimeRange]) {
      return chartConfig.fullData;
    }
    const count = chartConfig.sliceMap[modalTimeRange];
    return chartConfig.fullData.slice(-count);
  }, [chartConfig, modalTimeRange]);

  if (!isOpen || !chartConfig) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="glass-card modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: '#4f46e5', marginBottom: '6px', background: 'rgba(79, 70, 229, 0.1)', padding: '3px 10px', borderRadius: '12px' }}>
              <TrendingUp size={14} />
              <span>Analytics & Trajectory Analysis</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px', lineHeight: '1.2' }}>
              {chartConfig.title}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {chartConfig.subtitle}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="filter-btn" 
            style={{ 
              padding: '8px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }} 
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Range Controls & Export */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div className="nav-tabs">
            {chartConfig.rangeOptions.map((range) => (
              <button
                key={range}
                className={`nav-tab-btn ${modalTimeRange === range ? 'active' : ''}`}
                onClick={() => setModalTimeRange(range)}
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                {range}
              </button>
            ))}
          </div>

          <DownloadCSVButton 
            data={displayData}
            filename={chartConfig.filename}
            label="Export Modal Data"
          />
        </div>

        {/* Dynamic Chart */}
        <div style={{ width: '100%', height: 320, marginBottom: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartConfig.isBarChart ? (
              <BarChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={chartConfig.xKey} stroke="var(--text-muted)" fontSize={11} interval={0} angle={-25} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-accent)',
                    borderRadius: '10px',
                    color: 'var(--text-main)' 
                  }} 
                />
                <Bar dataKey="Opportunity Score (pts)" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Opportunity Score (pts)" />
              </BarChart>
            ) : chartConfig.dualAxis ? (
              <LineChart data={displayData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={chartConfig.xKey} stroke="var(--text-muted)" fontSize={11} />
                <YAxis yAxisId="left" stroke="#059669" fontSize={11} label={{ value: chartConfig.leftAxisLabel, angle: -90, position: 'insideLeft', fill: '#059669' }} />
                <YAxis yAxisId="right" stroke="#0284c7" fontSize={11} orientation="right" label={{ value: chartConfig.rightAxisLabel, angle: 90, position: 'insideRight', fill: '#0284c7' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-accent)',
                    borderRadius: '10px',
                    color: 'var(--text-main)' 
                  }} 
                />
                <Legend verticalAlign="top" height={36} />
                {chartConfig.lines.map((l) => (
                  <Line
                    key={l.key}
                    yAxisId={l.axis}
                    type="monotone"
                    dataKey={l.key}
                    stroke={l.color}
                    strokeWidth={l.width}
                    dot={false}
                  />
                ))}
              </LineChart>
            ) : (
              <LineChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey={chartConfig.xKey} stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-accent)',
                    borderRadius: '10px',
                    color: 'var(--text-main)' 
                  }} 
                />
                <Legend verticalAlign="top" height={36} />
                {chartConfig.lines.map((l) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    stroke={l.color}
                    strokeWidth={l.width}
                    dot={false}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Data Source Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={14} aria-hidden="true" />
            <span>{chartConfig.source}</span>
          </div>
          <button onClick={onClose} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

HistoricalChartModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  modalMetric: PropTypes.string,
  extraData: PropTypes.object,
  monthlyData: PropTypes.object,
  regionalData: PropTypes.object
};
