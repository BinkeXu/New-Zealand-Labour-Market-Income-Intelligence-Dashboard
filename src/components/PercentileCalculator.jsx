import React, { useState, useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PercentileCalculator({ irdIncomeData }) {
  const [inputVal, setInputVal] = useState('85000');
  const [isWeekly, setIsWeekly] = useState(false);

  const numericVal = parseFloat(inputVal.replace(/[^0-9.]/g, '')) || 0;
  const annualSalary = isWeekly ? numericVal * 52 : numericVal;

  const result = useMemo(() => {
    if (!annualSalary || annualSalary <= 0) return null;

    const deciles = irdIncomeData?.deciles || [];
    const topP = irdIncomeData?.top_percentiles || [];

    // All boundary points: (percentile, boundary_dollar)
    const points = [];
    deciles.forEach(d => {
      points.push({ percentile: d.decile * 10, dollar: d.annual_boundary_2025 });
    });
    topP.forEach(p => {
      points.push({ percentile: p.percentile, dollar: p.annual_boundary_2025 });
    });
    points.sort((a, b) => a.percentile - b.percentile);

    if (points.length === 0) return null;

    if (annualSalary <= points[0].dollar) {
      const pct = Math.max(1, Math.round((annualSalary / points[0].dollar) * 10));
      return { percentileRank: pct, topPct: 100 - pct, tierLabel: 'Lower Bracket' };
    }

    if (annualSalary >= points[points.length - 1].dollar) {
      return { percentileRank: 99, topPct: 1, tierLabel: 'Top 1% NZ High Earner' };
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (annualSalary >= p1.dollar && annualSalary <= p2.dollar) {
        const ratio = (annualSalary - p1.dollar) / (p2.dollar - p1.dollar);
        const estPct = Math.round(p1.percentile + ratio * (p2.percentile - p1.percentile));
        const topPct = 100 - estPct;

        let tierLabel = 'Above Average Earner';
        if (estPct >= 90) tierLabel = 'Top 10% High Earner';
        else if (estPct >= 75) tierLabel = 'Upper-Middle Income';
        else if (estPct >= 50) tierLabel = 'Above Median Income';
        else tierLabel = 'Lower-Middle Income';

        return { percentileRank: estPct, topPct: Math.max(1, topPct), tierLabel };
      }
    }

    return { percentileRank: 50, topPct: 50, tierLabel: 'Median Income' };
  }, [annualSalary, irdIncomeData]);

  const histogramData = irdIncomeData?.income_histogram || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
      {/* Input Calculator Box */}
      <div style={{ background: 'var(--table-header-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-accent)' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <label htmlFor="salary-calc-input" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Enter Your Salary to Calculate NZ Percentile Rank:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: '700' }}>$</span>
                <input 
                  id="salary-calc-input"
                  type="text" 
                  value={inputVal} 
                  onChange={(e) => setInputVal(e.target.value)} 
                  className="select-control"
                  style={{ paddingLeft: '28px', fontSize: '1.1rem', fontWeight: '800', width: '180px' }}
                  aria-label="Salary amount input"
                />
              </div>

              {/* Unit Toggle */}
              <div className="nav-tabs" role="group" aria-label="Salary Frequency Selector" style={{ padding: '3px' }}>
                <button 
                  className={`nav-tab-btn ${!isWeekly ? 'active' : ''}`}
                  onClick={() => setIsWeekly(false)}
                  style={{ padding: '4px 10px', minHeight: '32px', fontSize: '0.8rem' }}
                >
                  $/yr (Annual)
                </button>
                <button 
                  className={`nav-tab-btn ${isWeekly ? 'active' : ''}`}
                  onClick={() => setIsWeekly(true)}
                  style={{ padding: '4px 10px', minHeight: '32px', fontSize: '0.8rem' }}
                >
                  $/wk (Weekly)
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Calculated Rank Card */}
          {result && (
            <div style={{ background: 'var(--bg-card)', padding: '14px 20px', borderRadius: '14px', border: '1px solid var(--primary)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                Estimated NZ Rank:
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)' }}>
                {result.topPct <= 10 ? `Top ${result.topPct}% Earner` : `Top ${result.topPct}% (${result.percentileRank}th Percentile)`}
              </div>
              <span className="badge badge-emerald" style={{ marginTop: '4px' }}>
                {result.tierLabel} • ${annualSalary.toLocaleString()}/yr
              </span>
            </div>
          )}
        </div>

        {/* 2025 Key IRD Percentile Benchmark Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10th Percentile</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>$6,923 / yr</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>$133 / wk</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #4f46e5' }}>
            <div style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: '700' }}>50th (Median Income)</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>$59,908 / yr</div>
            <div style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: '600' }}>$1,152 / wk</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #0284c7' }}>
            <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '700' }}>Top 20% Threshold</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>$99,932 / yr</div>
            <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>$1,922 / wk</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #059669' }}>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>Top 10% Threshold</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>$129,846 / yr</div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>$2,497 / wk</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #d97706' }}>
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '700' }}>Top 5% Threshold</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>$163,389 / yr</div>
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>$3,142 / wk</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #e11d48' }}>
            <div style={{ fontSize: '0.75rem', color: '#e11d48', fontWeight: '700' }}>Top 1% Threshold</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>$278,750 / yr</div>
            <div style={{ fontSize: '0.75rem', color: '#e11d48', fontWeight: '600' }}>$5,361 / wk</div>
          </div>
        </div>
      </div>

      {/* IRD Income Bracket Histogram Bar Chart */}
      <div style={{ width: '100%' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={18} color="#059669" aria-hidden="true" />
          NZ Individual Income Distribution Histogram (2.46 Million Taxpayers)
        </h3>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="range_label" stroke="var(--text-muted)" fontSize={11} interval={0} angle={-25} textAnchor="end" />
              <YAxis stroke="var(--text-muted)" fontSize={11} label={{ value: 'Workers (k)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}k workers (${histogramData.find(h => h.people_count_thousands === value)?.percentage_of_earners || ''}%)`, 
                  'Worker Count'
                ]}
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-accent)',
                  borderRadius: '10px',
                  color: 'var(--text-main)' 
                }} 
              />
              <Bar dataKey="people_count_thousands" fill="#059669" radius={[6, 6, 0, 0]} name="Workers (Thousands)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
