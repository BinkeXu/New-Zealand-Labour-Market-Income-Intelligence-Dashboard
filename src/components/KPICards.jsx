import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Database, UserX, ShieldAlert, BarChart2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function KPICards({ monthlyData, regionalData, onOpenModal }) {
  const latestIndex = monthlyData?.totals?.[monthlyData.totals.length - 1] || 101.8;
  const latestChange = monthlyData?.annual_change?.[monthlyData.annual_change.length - 1] || 13.5;
  
  const nationalWeekly = regionalData?.metadata?.national_median_weekly || 1380;
  const nationalHourly = regionalData?.metadata?.national_median_hourly || (nationalWeekly / 40.0).toFixed(2);

  const hlfs = monthlyData?.metadata?.hlfs_labor_metrics || {
    quarter: "Jun-26",
    unemployment_rate: { total: 5.6, men: 5.7, women: 5.5 },
    underutilisation_rate: { total: 13.8, men: 12.4, women: 15.3 }
  };

  const quarterLabel = hlfs?.quarter ? (hlfs.quarter === 'Jun-26' ? 'June 2026' : hlfs.quarter) : 'June 2026';

  const cards = useMemo(() => [
    {
      metricId: "vacancy",
      title: "NZ Vacancy Index",
      value: `${latestIndex}`,
      subtitle: `${latestChange > 0 ? '+' : ''}${latestChange}% YoY Growth`,
      source: "MBIE Jobs Online Monthly Series",
      icon: TrendingUp,
      iconBg: "rgba(99, 102, 241, 0.15)",
      iconColor: "#4f46e5",
      isPositive: latestChange >= 0
    },
    {
      metricId: "income",
      title: "NZ Median Income",
      value: `$${nationalWeekly.toLocaleString()} / wk`,
      subtitle: `$${nationalHourly}/hr ($${(nationalWeekly * 52).toLocaleString()}/yr)`,
      source: "Stats NZ Household Income Census",
      icon: DollarSign,
      iconBg: "rgba(5, 150, 105, 0.15)",
      iconColor: "#059669",
      isPositive: true
    },
    {
      metricId: "unemployment",
      title: "Unemployment Rate",
      value: `${hlfs.unemployment_rate.total}%`,
      subtitle: `Men: ${hlfs.unemployment_rate.men}% • Women: ${hlfs.unemployment_rate.women}%`,
      source: `Stats NZ HLFS (${quarterLabel} Quarter)`,
      icon: UserX,
      iconBg: "rgba(244, 63, 94, 0.15)",
      iconColor: "#e11d48",
      isPositive: false
    },
    {
      metricId: "underutilisation",
      title: "Underutilisation Rate",
      value: `${hlfs.underutilisation_rate.total}%`,
      subtitle: `Men: ${hlfs.underutilisation_rate.men}% • Women: ${hlfs.underutilisation_rate.women}%`,
      source: `Stats NZ HLFS (${quarterLabel} Quarter)`,
      icon: ShieldAlert,
      iconBg: "rgba(217, 119, 6, 0.15)",
      iconColor: "#d97706",
      isPositive: false
    }
  ], [latestIndex, latestChange, nationalWeekly, nationalHourly, hlfs]);

  return (
    <div className="kpi-grid" aria-label="Key Performance Indicators">
      {cards.map((card) => {
        const Icon = card.icon;
        const TrendArrow = card.isPositive ? ArrowUpRight : ArrowDownRight;
        return (
          <div 
            key={card.metricId} 
            className="glass-card kpi-card"
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => onOpenModal && onOpenModal(card.metricId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenModal && onOpenModal(card.metricId);
              }
            }}
            title={`Click to view historical trend chart for ${card.title}`}
          >
            <div>
              <div className="kpi-header">
                <span className="kpi-title">{card.title}</span>
                <div className="kpi-icon" style={{ background: card.iconBg, color: card.iconColor }} aria-hidden="true">
                  <Icon size={20} />
                </div>
              </div>

              <div className="kpi-value tabular-nums">{card.value}</div>

              <div className="kpi-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span className={card.isPositive ? "trend-up" : "trend-down"}>
                  <TrendArrow size={14} style={{ marginRight: '2px' }} />
                  {card.subtitle}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                  <BarChart2 size={13} /> Graph
                </span>
              </div>
            </div>

            {/* Data Source Attribution */}
            <div className="data-source-caption">
              <Database size={12} aria-hidden="true" />
              <span>Source: {card.source}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
