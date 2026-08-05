import PropTypes from 'prop-types';
import React from 'react';
import { Award } from 'lucide-react';

export default function RegionalLeaderboard({ data }) {
  return (
    <section className="glass-card section-card" style={{ marginBottom: '28px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(79, 70, 229, 0.04) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }} aria-labelledby="opp-leaderboard-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 id="opp-leaderboard-title" className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
              <Award size={24} color="#8b5cf6" aria-hidden="true" />
              NZ Working-Age Opportunity Score Regional Leaderboard
            </h2>
            <p className="card-subtitle">
              Evaluates job vacancy availability per 100k active Working-Age residents (Ages 15–64) relative to Stats NZ median weekly earnings.
            </p>
          </div>
          <span className="badge badge-amber" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            ⭐ Working-Age Density Benchmark
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          {data.map((reg, idx) => (
            <div 
              key={reg.region_name} 
              style={{ 
                background: 'var(--bg-card)', 
                padding: '14px 16px', 
                borderRadius: '12px', 
                border: idx === 0 ? '2px solid #8b5cf6' : '1px solid var(--border-subtle)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: idx === 0 ? '#8b5cf6' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Rank #{idx + 1} Region
                </span>
                <span className={`badge ${idx === 0 ? 'badge-amber' : idx === 1 ? 'badge-indigo' : 'badge-emerald'}`} style={{ fontSize: '0.75rem' }}>
                  {reg.opportunity_score} pts
                </span>
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                {reg.region_name}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Vacancies: <strong>{reg.vacancies_per_100k}/100k</strong></span>
                <span>Wage: <strong>${reg.median_weekly_income}/wk</strong></span>
              </div>
            </div>
          ))}
        </div>
      </section>
  );
}

RegionalLeaderboard.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    region_name: PropTypes.string,
    opportunity_score: PropTypes.number,
    vacancies_per_100k: PropTypes.number,
    median_weekly_income: PropTypes.number
  })).isRequired
};
