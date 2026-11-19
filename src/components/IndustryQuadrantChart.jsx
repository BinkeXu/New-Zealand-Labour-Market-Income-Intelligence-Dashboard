import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  LabelList,
} from 'recharts';
import { Briefcase, TrendingUp, DollarSign, Award, Sparkles, Compass } from 'lucide-react';
import { useNavigation } from '../context/DashboardContext';

const SECTOR_TO_PATHFINDER = {
  'IT': 'it_tech',
  'Business services': 'business_services',
  'Health care': 'healthcare',
  'Construction': 'construction_engineering',
};

function getQuadrantColor(quadrant = '') {
  if (quadrant.includes('Star')) return '#f59e0b';
  if (quadrant.includes('High Demand')) return '#10b981';
  if (quadrant.includes('High Salary')) return '#6366f1';
  return '#38bdf8';
}

function QuadrantTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-accent)',
        borderRadius: '12px',
        padding: '10px 14px',
        color: 'var(--text-main)',
        fontSize: '0.82rem',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ fontWeight: '800', marginBottom: '4px', color: getQuadrantColor(item.quadrant) }}>
        {item.industry}
      </div>
      <div>YoY Growth: <strong>{item.yoy_growth_percent > 0 ? '+' : ''}{item.yoy_growth_percent}%</strong></div>
      <div>Weekly Wage: <strong>${Math.round(item.displayWeekly).toLocaleString()} / wk</strong></div>
      <div>Opportunity Score: <strong>{item.opportunity_score} pts</strong></div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
        Click dot to inspect recommendation
      </div>
    </div>
  );
}

QuadrantTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

export default function IndustryQuadrantChart({
  sectors,
  levelBenchmarks,
  selectedIndustry,
  onSelectIndustry,
}) {
  const { navigateToPathfinder } = useNavigation();

  const chartPoints = useMemo(() => {
    return (sectors || []).map((item) => {
      const bench = levelBenchmarks?.industries?.[item.industry];
      const displayWeekly = bench ? bench.median_weekly : item.median_weekly_income || 0;
      const displayHourly = bench ? bench.salary_range_hourly : `$${(item.hourly_income || 0).toFixed(2)} / hr`;
      return {
        ...item,
        displayWeekly,
        displayHourly,
        x: Number(item.yoy_growth_percent) || 0,
        y: Number(displayWeekly) || 0,
        z: Number(item.opportunity_score) || 50,
      };
    });
  }, [sectors, levelBenchmarks]);

  const medianWageLine = useMemo(() => {
    if (chartPoints.length === 0) return 1350;
    const sorted = [...chartPoints].map((p) => p.y).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted[mid];
  }, [chartPoints]);

  const activeSector = useMemo(() => {
    if (chartPoints.length === 0) return null;
    if (selectedIndustry) {
      const found = chartPoints.find((p) => p.industry === selectedIndustry);
      if (found) return found;
    }
    return [...chartPoints].sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0))[0];
  }, [chartPoints, selectedIndustry]);

  const pathfinderTargetId = activeSector ? SECTOR_TO_PATHFINDER[activeSector.industry] : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '20px',
        alignItems: 'stretch',
        marginBottom: '16px',
      }}
    >
      {/* Left: 2x2 Scatter Quadrant Chart */}
      <div
        style={{
          background: 'var(--table-header-bg)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '10px',
            fontSize: '0.76rem',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
            Bubble size = Opportunity Score • Click any dot to inspect
          </span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ color: '#f59e0b', fontWeight: '700' }}>● Star</span>
            <span style={{ color: '#10b981', fontWeight: '700' }}>● High Demand</span>
            <span style={{ color: '#6366f1', fontWeight: '700' }}>● High Salary</span>
            <span style={{ color: '#38bdf8', fontWeight: '700' }}>● Stable</span>
          </div>
        </div>

        {/* Chart with Corner Quadrant Labels */}
        <div style={{ position: 'relative', width: '100%', height: 340 }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '6px',
              left: '58px',
              fontSize: '0.7rem',
              fontWeight: '700',
              color: '#818cf8',
              opacity: 0.85,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            HIGH SALARY • NICHE
          </div>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '6px',
              right: '16px',
              fontSize: '0.7rem',
              fontWeight: '800',
              color: '#f59e0b',
              opacity: 0.9,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            ★ STAR: HIGH PAY + GROWTH
          </div>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '42px',
              left: '58px',
              fontSize: '0.7rem',
              fontWeight: '700',
              color: '#38bdf8',
              opacity: 0.85,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            STABLE / MODERATE
          </div>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '42px',
              right: '16px',
              fontSize: '0.7rem',
              fontWeight: '700',
              color: '#10b981',
              opacity: 0.85,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            HIGH DEMAND • ENTRY
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 26, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis
                type="number"
                dataKey="x"
                name="YoY Growth"
                unit="%"
                stroke="var(--text-muted)"
                fontSize={11}
                label={{
                  value: 'YoY Vacancy Growth (%)',
                  position: 'insideBottom',
                  offset: -12,
                  fill: 'var(--text-muted)',
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Weekly Wage"
                stroke="var(--text-muted)"
                fontSize={11}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `$${v}`}
              />
              <ZAxis type="number" dataKey="z" range={[120, 600]} name="Opportunity Score" />
              <ReferenceLine x={0} stroke="var(--border-accent)" strokeDasharray="4 4" />
              <ReferenceLine y={medianWageLine} stroke="var(--border-accent)" strokeDasharray="4 4" />
              <Tooltip content={<QuadrantTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                data={chartPoints}
                onClick={(point) => {
                  if (point?.industry && onSelectIndustry) {
                    onSelectIndustry(point.industry);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <LabelList
                  dataKey="industry"
                  position="top"
                  offset={8}
                  style={{
                    fill: 'var(--text-main)',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    pointerEvents: 'none',
                  }}
                />
                {chartPoints.map((entry) => {
                  const isSelected = activeSector?.industry === entry.industry;
                  return (
                    <Cell
                      key={entry.industry}
                      fill={getQuadrantColor(entry.quadrant)}
                      fillOpacity={isSelected ? 1 : 0.78}
                      stroke={isSelected ? '#ffffff' : 'rgba(15, 23, 42, 0.5)'}
                      strokeWidth={isSelected ? 2.5 : 1}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Sector Detail Card */}
      {activeSector && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span
                className="badge"
                style={{
                  background: 'var(--primary-gradient-subtle)',
                  border: `1px solid ${getQuadrantColor(activeSector.quadrant)}`,
                  color: getQuadrantColor(activeSector.quadrant),
                  fontWeight: '700',
                }}
              >
                {activeSector.quadrant}
              </span>
              {activeSector.opportunity_score != null && (
                <span className="badge badge-amber tabular-nums" style={{ fontWeight: '800' }}>
                  {activeSector.opportunity_score} pts
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={18} color={getQuadrantColor(activeSector.quadrant)} aria-hidden="true" />
              {activeSector.industry}
            </h3>

            {activeSector.description && (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: '1.45' }}>
                {activeSector.description}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                  <TrendingUp size={13} color="var(--accent-cyan)" aria-hidden="true" /> YoY Growth
                </div>
                <div className={`tabular-nums ${activeSector.yoy_growth_percent >= 0 ? 'trend-up' : 'trend-down'}`} style={{ fontSize: '1.05rem', fontWeight: '800' }}>
                  {activeSector.yoy_growth_percent > 0 ? '+' : ''}{activeSector.yoy_growth_percent}%
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                  <Award size={13} color="var(--primary)" aria-hidden="true" /> Vacancy Index
                </div>
                <div className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {activeSector.current_vacancy_index}
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                  <DollarSign size={13} color="var(--accent-emerald)" aria-hidden="true" /> Weekly Wage
                </div>
                <div className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  ${Math.round(activeSector.displayWeekly).toLocaleString()} / wk
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--table-header-bg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                  <DollarSign size={13} color="var(--accent-emerald)" aria-hidden="true" /> Hourly Range
                </div>
                <div className="tabular-nums" style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                  {activeSector.displayHourly}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeSector.recommendation && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--primary-gradient-subtle)',
                  border: '1px solid var(--border-accent)',
                  fontSize: '0.82rem',
                  color: 'var(--text-main)',
                  lineHeight: '1.45',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Sparkles size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                <span>{activeSector.recommendation}</span>
              </div>
            )}

            <button
              type="button"
              className="nav-tab-btn active"
              onClick={() => navigateToPathfinder(pathfinderTargetId)}
              style={{ alignSelf: 'flex-start', padding: '8px 14px', fontSize: '0.82rem' }}
            >
              <Compass size={14} aria-hidden="true" />
              {pathfinderTargetId
                ? `Plan career in ${activeSector.industry} →`
                : 'Open Career Pathfinder →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

IndustryQuadrantChart.propTypes = {
  sectors: PropTypes.array.isRequired,
  levelBenchmarks: PropTypes.object,
  selectedIndustry: PropTypes.string,
  onSelectIndustry: PropTypes.func,
};
