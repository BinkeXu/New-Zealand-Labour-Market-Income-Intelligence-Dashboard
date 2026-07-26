import React from 'react';
import { TrendingUp, DollarSign, MapPin, Award, Database } from 'lucide-react';

export default function KPICards({ monthlyData, regionalData }) {
  const latestIndex = monthlyData?.totals?.[monthlyData.totals.length - 1] || 101.8;
  const latestChange = monthlyData?.annual_change?.[monthlyData.annual_change.length - 1] || 13.5;
  
  const nationalWeekly = regionalData?.metadata?.national_median_weekly || 1380;
  const nationalHourly = regionalData?.metadata?.national_median_hourly || (nationalWeekly / 40.0).toFixed(2);

  const cards = [
    {
      title: "NZ Overall Vacancy Index",
      value: `${latestIndex}`,
      subtitle: `${latestChange > 0 ? '+' : ''}${latestChange}% YoY Growth`,
      source: "MBIE Jobs Online Monthly Series",
      icon: TrendingUp,
      iconBg: "rgba(99, 102, 241, 0.15)",
      iconColor: "#4f46e5",
      trendClass: latestChange >= 0 ? "trend-up" : "trend-down"
    },
    {
      title: "NZ National Median Income",
      value: `$${nationalWeekly.toLocaleString()} / wk`,
      subtitle: `$${nationalHourly}/hr ($${(nationalWeekly * 52).toLocaleString()}/yr)`,
      source: "Stats NZ Household Income Census",
      icon: DollarSign,
      iconBg: "rgba(5, 150, 105, 0.15)",
      iconColor: "#059669",
      trendClass: "trend-up"
    },
    {
      title: "Top Hiring Regions",
      value: "Auckland & Canterbury",
      subtitle: "Highest Volume & Regional Rebuild Growth",
      source: "MBIE Consolidated Regional Series",
      icon: MapPin,
      iconBg: "rgba(2, 132, 199, 0.15)",
      iconColor: "#0284c7",
      trendClass: "trend-up"
    },
    {
      title: "Highest Earning Sector",
      value: "IT & Digital Services",
      subtitle: "$46.25/hr ($1,850/wk • $96,200/yr)",
      source: "Stats NZ ANZSIC Earnings Benchmark",
      icon: Award,
      iconBg: "rgba(217, 119, 6, 0.15)",
      iconColor: "#d97706",
      trendClass: "trend-up"
    }
  ];

  return (
    <div className="kpi-grid" aria-label="Key Performance Indicators">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="glass-card kpi-card">
            <div>
              <div className="kpi-header">
                <span className="kpi-title">{card.title}</span>
                <div className="kpi-icon" style={{ background: card.iconBg, color: card.iconColor }} aria-hidden="true">
                  <Icon size={20} />
                </div>
              </div>
              <div className="kpi-value tabular-nums">{card.value}</div>
              <div className="kpi-footer">
                <span className={card.trendClass}>{card.subtitle}</span>
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
