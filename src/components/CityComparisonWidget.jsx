import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, MapPin, DollarSign, Home, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { calculateNZTakeHomePay, getOpportunityBadge } from '../utils/selectors';

export default function CityComparisonWidget({ regions }) {
  const [regionAId, setRegionAId] = useState('Auckland');
  const [regionBId, setRegionBId] = useState('Canterbury');
  const [compareTakeHome, setCompareTakeHome] = useState(true);

  if (!regions || regions.length < 2) return null;

  const regA = regions.find(r => r.region_name === regionAId) || regions[0];
  const regB = regions.find(r => r.region_name === regionBId) || regions[1];

  // Financial calculations
  const payA = calculateNZTakeHomePay((regA.median_weekly_income || 0) * 52);
  const payB = calculateNZTakeHomePay((regB.median_weekly_income || 0) * 52);

  const rentA = regA.mean_weekly_rent || 0;
  const rentB = regB.mean_weekly_rent || 0;

  const effectiveWeeklyA = compareTakeHome ? payA.weeklyNet : (regA.median_weekly_income || 0);
  const effectiveWeeklyB = compareTakeHome ? payB.weeklyNet : (regB.median_weekly_income || 0);

  const discretionaryA = effectiveWeeklyA - rentA;
  const discretionaryB = effectiveWeeklyB - rentB;
  const diff = discretionaryB - discretionaryA;

  const badgeA = getOpportunityBadge(regA.opportunity_score);
  const badgeB = getOpportunityBadge(regB.opportunity_score);

  return (
    <section className="glass-card section-card" style={{ marginBottom: '28px' }} aria-labelledby="city-comparator-title">
      <div className="card-header-flex" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} className="text-gradient" aria-hidden="true" />
            <h2 id="city-comparator-title" className="card-title" style={{ fontSize: '1.2rem' }}>
              Head-to-Head Regional Relocation Comparator
            </h2>
          </div>
          <p className="card-subtitle">
            Compare real living costs, tax-adjusted take-home pay, and job opportunities between any two New Zealand regions.
          </p>
        </div>

        {/* Take-Home Toggle */}
        <div className="nav-tabs" role="group" aria-label="Tax adjustment toggle" style={{ padding: '3px' }}>
          <button 
            className={`nav-tab-btn ${compareTakeHome ? 'active' : ''}`}
            onClick={() => setCompareTakeHome(true)}
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            🛡️ Net Take-Home (After Tax & ACC)
          </button>
          <button 
            className={`nav-tab-btn ${!compareTakeHome ? 'active' : ''}`}
            onClick={() => setCompareTakeHome(false)}
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            Gross Income (Pre-Tax)
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <label htmlFor="reg-a-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '6px' }}>Region A (Baseline):</label>
          <select 
            id="reg-a-select"
            className="select-control"
            value={regionAId}
            onChange={(e) => setRegionAId(e.target.value)}
            style={{ width: '100%', fontWeight: '700' }}
          >
            {regions.map(r => (
              <option key={r.region_name} value={r.region_name}>{r.region_name}</option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.9rem', marginTop: '18px' }}>
          VS
        </div>

        <div>
          <label htmlFor="reg-b-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '6px' }}>Region B (Comparison):</label>
          <select 
            id="reg-b-select"
            className="select-control"
            value={regionBId}
            onChange={(e) => setRegionBId(e.target.value)}
            style={{ width: '100%', fontWeight: '700' }}
          >
            {regions.map(r => (
              <option key={r.region_name} value={r.region_name}>{r.region_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Card A */}
        <div style={{ background: 'var(--table-header-bg)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#4f46e5" /> {regA.region_name}
            </h3>
            <span className={`badge ${badgeA.variant}`}>{badgeA.label}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Median Gross Wage:</span>
              <strong>${regA.median_weekly_income?.toLocaleString()}/wk (${Math.round((regA.median_weekly_income || 0) * 52).toLocaleString()}/yr)</strong>
            </div>
            {compareTakeHome && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Net Take-Home Pay:</span>
                <strong>${payA.weeklyNet.toLocaleString()}/wk (~${payA.annualNet.toLocaleString()}/yr)</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mean Weekly Rent:</span>
              <strong style={{ color: 'var(--accent-rose)' }}>${rentA.toFixed(2)}/wk</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <span style={{ fontWeight: '700' }}>Remaining Discretionary:</span>
              <strong style={{ fontSize: '1.05rem', color: discretionaryA >= 0 ? '#059669' : 'var(--accent-rose)' }}>
                ${discretionaryA.toFixed(2)} / wk
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Vacancies / 100k pop:</span>
              <span><strong>{regA.vacancies_per_100k}</strong> roles</span>
            </div>
          </div>
        </div>

        {/* Card B */}
        <div style={{ background: 'var(--table-header-bg)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#0284c7" /> {regB.region_name}
            </h3>
            <span className={`badge ${badgeB.variant}`}>{badgeB.label}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Median Gross Wage:</span>
              <strong>${regB.median_weekly_income?.toLocaleString()}/wk (${Math.round((regB.median_weekly_income || 0) * 52).toLocaleString()}/yr)</strong>
            </div>
            {compareTakeHome && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Net Take-Home Pay:</span>
                <strong>${payB.weeklyNet.toLocaleString()}/wk (~${payB.annualNet.toLocaleString()}/yr)</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mean Weekly Rent:</span>
              <strong style={{ color: 'var(--accent-rose)' }}>${rentB.toFixed(2)}/wk</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <span style={{ fontWeight: '700' }}>Remaining Discretionary:</span>
              <strong style={{ fontSize: '1.05rem', color: discretionaryB >= 0 ? '#059669' : 'var(--accent-rose)' }}>
                ${discretionaryB.toFixed(2)} / wk
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Vacancies / 100k pop:</span>
              <span><strong>{regB.vacancies_per_100k}</strong> roles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Advantage Callout */}
      {regA.region_name !== regB.region_name && (
        <div style={{ 
          background: diff >= 0 ? 'rgba(5, 150, 105, 0.08)' : 'rgba(79, 70, 229, 0.08)', 
          border: `1px solid ${diff >= 0 ? 'rgba(5, 150, 105, 0.3)' : 'rgba(79, 70, 229, 0.3)'}`,
          padding: '12px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.875rem'
        }}>
          <DollarSign size={20} color={diff >= 0 ? '#059669' : '#4f46e5'} />
          <div>
            Living in <strong>{diff >= 0 ? regB.region_name : regA.region_name}</strong> yields an estimated{' '}
            <strong style={{ color: diff >= 0 ? '#059669' : '#4f46e5' }}>
              +${Math.abs(diff).toFixed(2)}/week (+${Math.round(Math.abs(diff) * 52).toLocaleString()}/year)
            </strong>{' '}
            more discretionary cash after paying rent {compareTakeHome ? 'and PAYE tax' : ''} compared to{' '}
            <strong>{diff >= 0 ? regA.region_name : regB.region_name}</strong>.
          </div>
        </div>
      )}
    </section>
  );
}

CityComparisonWidget.propTypes = {
  regions: PropTypes.array.isRequired
};
