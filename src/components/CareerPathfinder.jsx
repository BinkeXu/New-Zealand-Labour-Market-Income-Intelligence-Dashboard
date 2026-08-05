import React, { useState } from 'react';
import DownloadCSVButton from './DownloadCSVButton';
import { 
  Compass, MapPin, DollarSign, Award, Target, ArrowRight, RotateCcw, CheckCircle2, ShieldCheck, Database, Briefcase, Info
} from 'lucide-react';
import { useDashboardData } from '../context/DashboardContext';
import { selectJobVolumeEstimates } from '../utils/selectors';

export default function CareerPathfinder() {
  const { pathfinderRules, regionalData, industryData, levelData, jobVolumeData } = useDashboardData();
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [careerLevel, setCareerLevel] = useState('mid_level');
  const [relocationOpen, setRelocationOpen] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const industries = pathfinderRules?.target_industries || [];
  const levelGuidance = pathfinderRules?.career_level_guidance || {};

  const handleGenerateBrief = () => {
    if (!selectedIndustry) {
      setErrorMsg('Please select your target industry sector before generating a brief.');
      return;
    }
    setErrorMsg('');
    setQuizCompleted(true);
  };

  const handleReset = () => {
    setSelectedIndustry('');
    setCareerLevel('mid_level');
    setRelocationOpen(true);
    setQuizCompleted(false);
  };

  const currentIndustryObj = industries.find(ind => ind.id === selectedIndustry);
  const currentGuidance = levelGuidance[careerLevel];

  // Map CareerPathfinder state to levelData keys
  const levelMap = {
    "entry_level": "Junior",
    "mid_level": "Intermediate",
    "senior_level": "Senior"
  };

  const industryIdMap = {
    "it_tech": "IT",
    "business_services": "Business services",
    "healthcare": "Health care",
    "construction_engineering": "Construction",
    "manufacturing_logistics": "Manufacturing",
    "hospitality_tourism": "Hospitality",
    "sales_retail": "Sales",
    "primary_agriculture": "Primary",
    "education": "Education"
  };

  // Resolve dynamic level-specific salary benchmark
  let displaySalary = currentIndustryObj?.median_salary;
  if (levelData && selectedIndustry && careerLevel) {
    const levelKey = levelMap[careerLevel];
    const indKey = industryIdMap[selectedIndustry];
    const levelIndData = levelData.levels?.[levelKey]?.industries?.[indKey];
    if (levelIndData) {
      displaySalary = `${levelIndData.salary_range_annual} / yr (${levelIndData.salary_range_hourly})`;
    }
  }

  // Calculate estimated job pool size for the recommended regions
  let totalEstimatedRoles = null;
  if (jobVolumeData && selectedIndustry && careerLevel && currentIndustryObj?.top_regions) {
    const levelKey = levelMap[careerLevel];
    const indKey = industryIdMap[selectedIndustry];
    let sum = 0;
    let found = false;
    currentIndustryObj.top_regions.forEach(reg => {
      const vol = selectJobVolumeEstimates(jobVolumeData, indKey, reg, levelKey);
      if (vol !== null) {
        sum += vol;
        found = true;
      }
    });
    if (found) {
      totalEstimatedRoles = sum;
    }
  }

  // Brief Export Data object for DownloadCSVButton
  const briefExportData = currentIndustryObj ? [
    {
      Industry: currentIndustryObj.label,
      "Median Salary": displaySalary,
      "Market Outlook": currentIndustryObj.market_outlook,
      "INZ Visa Status": currentIndustryObj.inz_visa_status || '🟢 INZ Green List Tier 1 (Straight to Residence)',
      "Top Target Regions": currentIndustryObj.top_regions.join('; '),
      "Career Level": currentGuidance?.title || careerLevel,
      "Strategy Advice": currentGuidance?.key_advice || '',
      "Relocation Advice": currentIndustryObj.nz_relocation_advice
    }
  ] : [];

  return (
    <div className="section-grid">
      <section className="glass-card section-card col-12" aria-labelledby="pathfinder-title">
        <div className="card-header-flex">
          <div>
            <h2 id="pathfinder-title" className="card-title" style={{ fontSize: '1.4rem' }}>
              <Compass size={26} className="text-gradient" aria-hidden="true" />
              NZ Career Pathfinder & Personalised Job Market Strategy Engine
            </h2>
            <p className="card-subtitle" style={{ fontSize: '0.9rem' }}>
              Interactive decision guide matching your target industry, career stage, and relocation willingness against MBIE vacancies, Stats NZ salary benchmarks, and <strong>Immigration NZ (INZ) Green List Visa Status</strong>.
            </p>
          </div>

          {quizCompleted && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <DownloadCSVButton 
                data={briefExportData} 
                filename="nz_career_strategy_brief.csv" 
                label="Export Strategy Brief (CSV)" 
              />
              <button onClick={handleReset} className="btn-secondary">
                <RotateCcw size={14} style={{ marginRight: '4px' }} aria-hidden="true" /> Reset Pathfinder
              </button>
            </div>
          )}
        </div>

        {!quizCompleted ? (
          <div style={{ background: 'var(--table-header-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="#4f46e5" aria-hidden="true" />
              Step 1: Define Your Target New Zealand Career Parameters
            </h3>

            <div className="section-grid" style={{ marginBottom: '20px' }}>
              {/* Question 1: Target Industry */}
              <div className="col-6">
                <label htmlFor="quiz-industry-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '8px', fontWeight: '700' }}>
                  1. Select Target Industry Sector:
                </label>
                <select 
                  id="quiz-industry-select"
                  className="select-control"
                  style={{ width: '100%', padding: '12px' }}
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  aria-label="Select Target Industry Sector"
                >
                  <option value="">-- Choose Industry Sector --</option>
                  {industries.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.label}</option>
                  ))}
                </select>
              </div>

              {/* Question 2: Career Level */}
              <div className="col-6">
                <label htmlFor="quiz-level-select" className="navbar-subtitle" style={{ display: 'block', marginBottom: '8px', fontWeight: '700' }}>
                  2. Select Your Career Experience Level:
                </label>
                <select 
                  id="quiz-level-select"
                  className="select-control"
                  style={{ width: '100%', padding: '12px' }}
                  value={careerLevel}
                  onChange={(e) => setCareerLevel(e.target.value)}
                  aria-label="Select Career Experience Level"
                >
                  <option value="entry_level">Junior / Entry-Level (0 - 2 Years Experience)</option>
                  <option value="mid_level">Mid-Level Professional (3 - 6 Years Experience)</option>
                  <option value="senior_level">Senior / Team Lead / Executive (7+ Years Experience)</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--accent-rose)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 'bold' }}>
                {errorMsg}
              </div>
            )}

            <button 
              onClick={handleGenerateBrief} 
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: '700', borderRadius: '12px', width: '100%', justifyContent: 'center' }}
            >
              Generate Personalised NZ Career Strategy Brief <ArrowRight size={18} style={{ marginLeft: '8px' }} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div>
            <div className="glass-card section-card" style={{ borderColor: 'var(--primary)', background: 'var(--table-header-bg)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-indigo" style={{ marginBottom: '8px' }}>Personalised Career Strategy Brief</span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Target Sector: {currentIndustryObj?.label}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Level-Specific Earnings Benchmark:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#059669' }}>
                    {displaySalary}
                  </div>
                </div>
              </div>

              {/* INZ Visa Status Badge */}
              <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="#059669" aria-hidden="true" />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>Immigration NZ (INZ) Visa Pathway Status: </span>
                  <span className="badge badge-emerald" style={{ marginLeft: '6px' }}>
                    {currentIndustryObj?.inz_visa_status || '🟢 INZ Green List Tier 1 (Straight to Residence)'}
                  </span>
                </div>
              </div>

              {/* Estimated Job Volume Badge */}
              {totalEstimatedRoles !== null && (
                <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Briefcase size={20} color="#0284c7" aria-hidden="true" />
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>Estimated Active Job Pool: </span>
                    <span className="badge badge-cyan" style={{ marginLeft: '6px', fontWeight: '900' }}>
                      ~{totalEstimatedRoles.toLocaleString()} open roles per year
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      (across recommended target regions)
                      <Info size={14} color="var(--text-muted)" aria-label="Calculated using official Stats NZ Industry Size multiplied by LEED Annual Turnover Rate, Regional Share, and your Seniority level." title="Calculated using official Stats NZ Industry Size multiplied by LEED Annual Turnover Rate, Regional Share, and your Seniority level." />
                    </span>
                  </div>
                </div>
              )}

              <div className="section-grid" style={{ marginBottom: 0 }}>
                {/* Strategic Advice */}
                <div className="col-6">
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#4f46e5" aria-hidden="true" />
                    {currentGuidance?.title}:
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {currentGuidance?.key_advice}
                  </p>
                </div>

                {/* Top Regions & Relocation Advice */}
                <div className="col-6">
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} color="#0284c7" aria-hidden="true" />
                    Recommended Target NZ Regions:
                  </h4>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {currentIndustryObj?.top_regions.map((reg, idx) => (
                      <span key={idx} className="badge badge-indigo" style={{ fontWeight: '700' }}>{reg}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {currentIndustryObj?.nz_relocation_advice}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={handleReset} className="btn-secondary">
                <RotateCcw size={14} style={{ marginRight: '4px' }} aria-hidden="true" /> Configure Different Target Strategy
              </button>
            </div>
          </div>
        )}

        <div className="data-source-caption" style={{ marginTop: '20px' }}>
          <Database size={14} aria-hidden="true" />
          <span>Data Sources: MBIE Jobs Online, Stats NZ Income Census & Immigration New Zealand Green List (March 2026)</span>
        </div>
      </section>
    </div>
  );
}
