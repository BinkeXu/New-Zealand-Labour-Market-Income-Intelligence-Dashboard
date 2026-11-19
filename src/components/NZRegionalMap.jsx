import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  MapPin, RotateCcw, TrendingUp, DollarSign, Users, Home, Award, Info, Sparkles, ArrowRight
} from 'lucide-react';
import { NZ_MAP_VIEWBOX, NZ_REGION_PATHS } from '../data/nzRegionsPaths';
import { useTheme } from '../context/DashboardContext';
import { getOpportunityBadge, calculateNZTakeHomePay } from '../utils/selectors';
import {
  MAP_METRICS,
  GROUPED_REGION_NOTES,
  getMetricConfig,
  getRegionMetricRange,
  getChoroplethColor,
  computeNationalSummary,
  getTopAndBottomRegions,
} from '../utils/mapHelpers';

const SHORT_MAP_LABELS = {
  'Northland': 'Northland',
  'Auckland': 'Auckland',
  'Waikato': 'Waikato',
  'Bay of Plenty': 'BOP',
  'Gisborne/Hawkes Bay': 'Gis / HB',
  'Manawatu-Whanganui/Taranaki': 'Manawatu / Tar.',
  'Wellington': 'Wellington',
  'Tasman/Nelson/Marlborough/West Coast': 'Top of South / WC',
  'Canterbury': 'Canterbury',
  'Otago/Southland': 'Otago / Southland',
};

export default function NZRegionalMap({ regions, selectedRegion, onSelectRegion, onCompareRegion }) {
  const { theme } = useTheme();
  const [activeMetric, setActiveMetric] = useState('vacancies_per_100k');
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [useTakeHomePay, setUseTakeHomePay] = useState(false);

  const metricConfig = useMemo(() => getMetricConfig(activeMetric), [activeMetric]);

  const regionByName = useMemo(() => {
    const map = {};
    (regions || []).forEach((r) => {
      map[r.region_name] = r;
    });
    return map;
  }, [regions]);

  const { min, max } = useMemo(
    () => getRegionMetricRange(regions, activeMetric),
    [regions, activeMetric]
  );

  const nationalSummary = useMemo(
    () => computeNationalSummary(regions, activeMetric),
    [regions, activeMetric]
  );

  const rankedMiniBars = useMemo(
    () => getTopAndBottomRegions(regions, activeMetric, 3),
    [regions, activeMetric]
  );

  const activeRegionObj = selectedRegion && selectedRegion !== 'All'
    ? regionByName[selectedRegion] || null
    : null;

  const hoveredRegionObj = hoveredRegion ? regionByName[hoveredRegion] || null : null;

  const handleRegionClick = (regionName) => {
    if (!onSelectRegion) return;
    onSelectRegion(selectedRegion === regionName ? 'All' : regionName);
  };

  const handleRegionKeyDown = (e, regionName) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRegionClick(regionName);
    }
  };

  const lowColor = getChoroplethColor(min, min, max, theme);
  const highColor = getChoroplethColor(max, min, max, theme);

  const selectedPay = activeRegionObj
    ? calculateNZTakeHomePay((activeRegionObj.median_weekly_income || 0) * 52)
    : null;
  const displayedWage = activeRegionObj
    ? (useTakeHomePay ? selectedPay?.weeklyNet : activeRegionObj.median_weekly_income)
    : null;
  const displayedAfterRent = activeRegionObj
    ? (useTakeHomePay
        ? (selectedPay?.weeklyNet || 0) - (activeRegionObj.mean_weekly_rent || 0)
        : activeRegionObj.net_discretionary_income)
    : null;
  const displayedRentRatio = activeRegionObj && displayedWage > 0 && activeRegionObj.mean_weekly_rent != null
    ? ((activeRegionObj.mean_weekly_rent / displayedWage) * 100)
    : activeRegionObj?.rent_to_income_pct;

  return (
    <section
      className="glass-card section-card"
      style={{ marginBottom: '28px' }}
      aria-labelledby="nz-regional-map-title"
    >
      {/* Header + Metric Switcher */}
      <div className="card-header-flex" style={{ alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 id="nz-regional-map-title" className="card-title">
            <MapPin size={22} className="text-gradient-cyan" aria-hidden="true" />
            New Zealand Regional Labour &amp; Income Map
          </h2>
          <p className="card-subtitle">
            {metricConfig.description}. Click any region to inspect its breakdown and filter the city &amp; industry matrix below.
          </p>
        </div>

        {/* Metric Switcher Pills */}
        <div className="nav-tabs" role="group" aria-label="Map Colour Metric">
          {MAP_METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`nav-tab-btn ${activeMetric === m.id ? 'active' : ''}`}
              onClick={() => setActiveMetric(m.id)}
              style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '34px' }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive 2-Column Layout: Map Left (Top on Mobile) + Detail Card Right (Bottom on Mobile) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* Left: Interactive SVG Choropleth Map */}
        <div
          style={{
            position: 'relative',
            background: theme === 'dark' ? 'rgba(9, 13, 22, 0.55)' : 'rgba(241, 245, 249, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Hover Floating Pill */}
          <div
            style={{
              minHeight: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '8px',
              flexWrap: 'wrap',
            }}
          >
            {hoveredRegionObj ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-accent)',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                }}
              >
                <span>{hoveredRegionObj.region_name}</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '800' }}>
                  {metricConfig.format(hoveredRegionObj[activeMetric])}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Hover or click a region to explore
              </span>
            )}

            {activeRegionObj && (
              <button
                type="button"
                onClick={() => onSelectRegion('All')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-accent)',
                  background: 'var(--primary-gradient-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={12} aria-hidden="true" />
                Reset ({activeRegionObj.region_name})
              </button>
            )}
          </div>

          {/* SVG Map */}
          <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <svg
              viewBox={NZ_MAP_VIEWBOX}
              role="img"
              aria-label="Interactive New Zealand Regional Choropleth Map"
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            >
              {Object.entries(NZ_REGION_PATHS).map(([regionName, geo]) => {
                const regionData = regionByName[regionName];
                const metricVal = regionData ? Number(regionData[activeMetric]) : NaN;
                const fill = getChoroplethColor(metricVal, min, max, theme);
                const isSelected = selectedRegion === regionName;
                const isHovered = hoveredRegion === regionName;
                const isDimmed = selectedRegion && selectedRegion !== 'All' && !isSelected && !isHovered;

                return (
                  <g
                    key={regionName}
                    role="button"
                    tabIndex={0}
                    aria-label={`${regionName}: ${metricConfig.format(metricVal)}. Click to filter.`}
                    aria-pressed={isSelected}
                    onClick={() => handleRegionClick(regionName)}
                    onKeyDown={(e) => handleRegionKeyDown(e, regionName)}
                    onMouseEnter={() => setHoveredRegion(regionName)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    <path
                      d={geo.d}
                      fill={fill}
                      fillOpacity={isDimmed ? 0.35 : 0.94}
                      stroke={
                        isSelected
                          ? '#f59e0b'
                          : isHovered
                          ? (theme === 'dark' ? '#f8fafc' : '#0f172a')
                          : (theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)')
                      }
                      strokeWidth={isSelected ? 2.6 : isHovered ? 1.8 : 1.0}
                      strokeLinejoin="round"
                      style={{
                        transition: 'fill 0.25s ease, fill-opacity 0.2s ease, stroke-width 0.15s ease',
                      }}
                    />
                    <text
                      x={geo.labelX}
                      y={geo.labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      pointerEvents="none"
                      style={{
                        fontSize: '8.5px',
                        fontWeight: isSelected || isHovered ? '800' : '600',
                        fill: theme === 'dark' ? '#f8fafc' : '#0f172a',
                        paintOrder: 'stroke',
                        stroke: theme === 'dark' ? 'rgba(9, 13, 22, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                        strokeWidth: '2.5px',
                        strokeLinejoin: 'round',
                        opacity: isDimmed ? 0.5 : 0.95,
                      }}
                    >
                      {SHORT_MAP_LABELS[regionName] || regionName}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Sequential Colour Legend */}
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}
            >
              <span>Low: <strong className="tabular-nums">{metricConfig.format(min)}</strong></span>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{metricConfig.label}</span>
              <span>High: <strong className="tabular-nums">{metricConfig.format(max)}</strong></span>
            </div>
            <div
              aria-hidden="true"
              style={{
                height: '10px',
                borderRadius: '999px',
                background: `linear-gradient(90deg, ${lowColor} 0%, ${highColor} 100%)`,
                border: '1px solid var(--border-subtle)',
              }}
            />
          </div>
        </div>

        {/* Right: Interactive Detail Card (National Summary by default, or Selected Region) */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {activeRegionObj ? (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <div>
                    <span className="badge badge-indigo" style={{ marginBottom: '6px', display: 'inline-block' }}>
                      {activeRegionObj.island}
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                      {activeRegionObj.region_name}
                    </h3>
                  </div>

                  {activeRegionObj.opportunity_score != null && (
                    <span className={`badge ${getOpportunityBadge(activeRegionObj.opportunity_score).variant} tabular-nums`} style={{ fontSize: '0.85rem', fontWeight: '800' }}>
                      {activeRegionObj.opportunity_score} pts • {getOpportunityBadge(activeRegionObj.opportunity_score).label}
                    </span>
                  )}
                </div>

                {GROUPED_REGION_NOTES[activeRegionObj.region_name] && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--primary-gradient-subtle)',
                      border: '1px solid var(--border-accent)',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: '12px',
                    }}
                  >
                    <Info size={15} color="var(--accent-cyan)" style={{ flexShrink: 0 }} aria-hidden="true" />
                    <span>{GROUPED_REGION_NOTES[activeRegionObj.region_name]}</span>
                  </div>
                )}

                {/* Gross vs Net (PAYE & ACC) Tax Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    Wage Basis:
                  </span>
                  <div className="nav-tabs" role="group" aria-label="Region Detail Tax Basis" style={{ padding: '2px' }}>
                    <button
                      type="button"
                      className={`nav-tab-btn ${!useTakeHomePay ? 'active' : ''}`}
                      onClick={() => setUseTakeHomePay(false)}
                      style={{ padding: '4px 10px', minHeight: '28px', fontSize: '0.75rem' }}
                    >
                      Gross
                    </button>
                    <button
                      type="button"
                      className={`nav-tab-btn ${useTakeHomePay ? 'active' : ''}`}
                      onClick={() => setUseTakeHomePay(true)}
                      style={{ padding: '4px 10px', minHeight: '28px', fontSize: '0.75rem' }}
                    >
                      🛡️ Net (PAYE &amp; ACC)
                    </button>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <TrendingUp size={13} color="var(--accent-cyan)" aria-hidden="true" /> Vacancies / 100k
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {activeRegionObj.vacancies_per_100k != null ? `${activeRegionObj.vacancies_per_100k} / 100k` : 'N/A'}
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <DollarSign size={13} color="var(--primary)" aria-hidden="true" /> {useTakeHomePay ? 'Net Take-Home' : 'Median Weekly Wage'}
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {displayedWage != null ? `$${Math.round(displayedWage).toLocaleString()} / wk` : 'N/A'}
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <Home size={13} color="var(--accent-rose)" aria-hidden="true" /> Mean Weekly Rent
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--accent-rose)' }}>
                      {activeRegionObj.mean_weekly_rent != null ? `$${activeRegionObj.mean_weekly_rent.toFixed(0)} / wk` : 'N/A'}
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <Award size={13} color="var(--accent-emerald)" aria-hidden="true" /> {useTakeHomePay ? 'Net After Tax & Rent' : 'After-Rent Cash'}
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                      {displayedAfterRent != null ? `$${Math.round(displayedAfterRent).toLocaleString()} / wk` : 'N/A'}
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <Users size={13} color="var(--accent-amber)" aria-hidden="true" /> Regional Unemployment
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {activeRegionObj.unemployment_rate != null ? `${activeRegionObj.unemployment_rate.toFixed(1)}%` : 'N/A'}
                    </div>
                    {activeRegionObj.unemployment_note && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {activeRegionObj.unemployment_note}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <Home size={13} color="var(--accent-rose)" aria-hidden="true" /> Rent-to-Income Ratio
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: '800', color: displayedRentRatio > 42 ? 'var(--accent-rose)' : 'var(--text-main)' }}>
                      {displayedRentRatio != null ? `${displayedRentRatio.toFixed(1)}%` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      of {useTakeHomePay ? 'net' : 'gross'} wage
                    </div>
                  </div>
                </div>

                {/* Top Industries & Cities */}
                {activeRegionObj.top_key_industries?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Top Hiring Industries
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {activeRegionObj.top_key_industries.map((ind) => (
                        <span key={ind} className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeRegionObj.cities_included?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Major Centres Included
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
                      {activeRegionObj.cities_included.join(' • ')}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="nav-tab-btn"
                  onClick={() => onSelectRegion('All')}
                  style={{ padding: '8px 14px', fontSize: '0.82rem', border: '1px solid var(--border-subtle)' }}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  National Summary
                </button>
                {onCompareRegion && (
                  <button
                    type="button"
                    className="nav-tab-btn active"
                    onClick={() => onCompareRegion(activeRegionObj.region_name)}
                    style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  >
                    Compare {SHORT_MAP_LABELS[activeRegionObj.region_name] || activeRegionObj.region_name} head-to-head
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Default Unselected State: National NZ Summary + Top 3 / Bottom 3 Mini-Bars */
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Sparkles size={18} color="var(--accent-cyan)" aria-hidden="true" />
                  <span className="badge badge-indigo">National Overview • {nationalSummary?.regionCount || 10} MBIE Regions</span>
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
                  New Zealand Labour Market Summary
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
                  Click any region on the map—or any bar below—to inspect wages, rent, and filter the city &amp; industry matrix.
                </p>

                {nationalSummary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                        <Users size={13} color="var(--primary)" aria-hidden="true" /> Working-Age Pop
                      </div>
                      <div className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {(nationalSummary.totalWorkingAgePop / 1_000_000).toFixed(2)}M
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                        <TrendingUp size={13} color="var(--accent-cyan)" aria-hidden="true" /> Avg Vacancies / 100k
                      </div>
                      <div className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {nationalSummary.avgVacanciesPer100k.toFixed(1)} / 100k
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                        <DollarSign size={13} color="var(--accent-emerald)" aria-hidden="true" /> Avg Regional Wage
                      </div>
                      <div className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        ${Math.round(nationalSummary.avgWeeklyIncome).toLocaleString()} / wk
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                        <Award size={13} color="var(--accent-amber)" aria-hidden="true" /> Top {metricConfig.shortLabel}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                        {SHORT_MAP_LABELS[nationalSummary.topMetricRegion?.region_name] || nationalSummary.topMetricRegion?.region_name || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ranked Top 3 & Bottom 3 Mini-Bars */}
                {rankedMiniBars.top.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                        Top 3 ({metricConfig.shortLabel})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        {rankedMiniBars.top.map((r) => {
                          const val = Number(r[activeMetric]) || 0;
                          const pct = Math.max(8, Math.round((val / rankedMiniBars.maxVal) * 100));
                          return (
                            <button
                              key={r.region_name}
                              type="button"
                              onClick={() => onSelectRegion(r.region_name)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                textAlign: 'left',
                                cursor: 'pointer',
                                color: 'var(--text-main)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                                <span style={{ fontWeight: '600' }}>{SHORT_MAP_LABELS[r.region_name] || r.region_name}</span>
                                <span className="tabular-nums" style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{metricConfig.format(val)}</span>
                              </div>
                              <div style={{ height: '5px', borderRadius: '999px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-emerald)', borderRadius: '999px' }} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Lowest 3 ({metricConfig.shortLabel})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        {rankedMiniBars.bottom.map((r) => {
                          const val = Number(r[activeMetric]) || 0;
                          const pct = Math.max(8, Math.round((val / rankedMiniBars.maxVal) * 100));
                          return (
                            <button
                              key={r.region_name}
                              type="button"
                              onClick={() => onSelectRegion(r.region_name)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                textAlign: 'left',
                                cursor: 'pointer',
                                color: 'var(--text-main)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                                <span style={{ fontWeight: '600' }}>{SHORT_MAP_LABELS[r.region_name] || r.region_name}</span>
                                <span className="tabular-nums" style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{metricConfig.format(val)}</span>
                              </div>
                              <div style={{ height: '5px', borderRadius: '999px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '999px', opacity: 0.75 }} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {nationalSummary?.topOpportunityRegion && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--primary-gradient-subtle)',
                    border: '1px solid var(--border-accent)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      #1 Overall Opportunity Score
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {nationalSummary.topOpportunityRegion.region_name} ({nationalSummary.topOpportunityRegion.opportunity_score} pts)
                    </div>
                  </div>
                  <button
                    type="button"
                    className="nav-tab-btn active"
                    onClick={() => onSelectRegion(nationalSummary.topOpportunityRegion.region_name)}
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Inspect Region
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

NZRegionalMap.propTypes = {
  regions: PropTypes.array.isRequired,
  selectedRegion: PropTypes.string,
  onSelectRegion: PropTypes.func,
  onCompareRegion: PropTypes.func,
};
