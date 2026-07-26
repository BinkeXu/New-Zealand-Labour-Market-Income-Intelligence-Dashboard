import React, { useState } from 'react';
import { 
  Compass, Briefcase, MapPin, Award, CheckCircle, ArrowRight, RefreshCw, Printer, UserCheck, Sparkles, Database, AlertCircle 
} from 'lucide-react';

export default function CareerPathfinder({ pathfinderRules }) {
  const [step, setStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState('it_tech');
  const [selectedLevel, setSelectedLevel] = useState('entry_level');
  const [selectedLocation, setSelectedLocation] = useState('open');
  const [reportGenerated, setReportGenerated] = useState(false);

  const industries = pathfinderRules?.target_industries || [
    { id: 'it_tech', label: 'IT, Software & Data Analytics' },
    { id: 'business_services', label: 'Business Services, HR & Marketing' },
    { id: 'healthcare', label: 'Healthcare & Community Services' },
    { id: 'construction_engineering', label: 'Construction, Trades & Civil Engineering' }
  ];

  const levels = [
    { id: 'entry_level', label: 'Junior / Entry-Level (0 - 2 Yrs)', desc: 'Starting your career, looking for high-growth sectors with strong entry hiring.' },
    { id: 'mid_level', label: 'Mid-Level Professional (3 - 6 Yrs)', desc: 'Established skills, seeking optimal salary growth and progression pathways.' },
    { id: 'senior_level', label: 'Senior / Managerial (7+ Yrs)', desc: 'Leadership, strategic oversight, and executive compensation targeting.' }
  ];

  const locations = [
    { id: 'open', label: 'Open to Relocating (Anywhere in NZ)', desc: 'Maximum flexibility across North and South Islands.' },
    { id: 'Auckland', label: 'Auckland Region', desc: 'Commercial hub, corporate headquarters & tech density.' },
    { id: 'Wellington', label: 'Wellington Region', desc: 'Capital city, public sector, policy & government tech.' },
    { id: 'Canterbury', label: 'Canterbury (Christchurch)', desc: 'High housing affordability, civil rebuild & manufacturing.' },
    { id: 'Waikato', label: 'Waikato (Hamilton)', desc: 'Agritech, logistics & growing tech hub.' },
    { id: 'Bay of Plenty', label: 'Bay of Plenty (Tauranga / Rotorua)', desc: 'Horticulture, forestry & healthcare.' }
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setReportGenerated(true);
    }
  };

  const handleReset = () => {
    setStep(1);
    setReportGenerated(false);
  };

  const handleKeyDown = (e, callback) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  const currentIndMeta = industries.find(i => i.id === selectedIndustry) || industries[0];
  const currentLvlMeta = pathfinderRules?.career_level_guidance?.[selectedLevel] || { title: "Career Strategy", key_advice: "Focus on upskilling and market demand." };

  return (
    <section className="glass-card pathfinder-container" aria-labelledby="pathfinder-heading">
      <div style={{ marginBottom: '24px' }}>
        <h2 id="pathfinder-heading" className="hero-title" style={{ fontSize: '1.8rem' }}>
          <Compass className="text-gradient" size={28} style={{ display: 'inline', marginRight: '10px' }} aria-hidden="true" />
          NZ Career Pathfinder <span className="text-gradient-cyan">& Decision Guide</span>
        </h2>
        <p className="hero-desc">
          Answer 3 quick questions about your career background and preferences to receive a personalized <strong>New Zealand Market & Salary Strategy Brief</strong>.
        </p>
      </div>

      {!reportGenerated ? (
        <div>
          {/* Progress Indicator */}
          <div className="quiz-step-indicator" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label={`Step ${step} of 3`}>
            <div className="step-pill">
              <div className="step-pill-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>Step {step} of 3</span>
          </div>

          {/* STEP 1: Select Industry */}
          {step === 1 && (
            <fieldset style={{ border: 'none', padding: 0 }}>
              <legend className="card-title" style={{ marginBottom: '16px', fontSize: '1.1rem' }}>
                1. Select your primary target Industry / Sector:
              </legend>
              <div className="options-grid" role="radiogroup" aria-label="Select target industry">
                {industries.map((ind) => {
                  const isSelected = selectedIndustry === ind.id;
                  return (
                    <div 
                      key={ind.id} 
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedIndustry(ind.id)}
                      onKeyDown={(e) => handleKeyDown(e, () => setSelectedIndustry(ind.id))}
                      aria-label={`${ind.label}, Median Salary: ${ind.median_salary || '$80,000+'}`}
                    >
                      <div className="option-icon" aria-hidden="true">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <div className="option-title">{ind.label}</div>
                        <div className="option-desc">Median Salary: {ind.median_salary || '$80,000+'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* STEP 2: Select Level */}
          {step === 2 && (
            <fieldset style={{ border: 'none', padding: 0 }}>
              <legend className="card-title" style={{ marginBottom: '16px', fontSize: '1.1rem' }}>
                2. Select your Career Seniority Level:
              </legend>
              <div className="options-grid" role="radiogroup" aria-label="Select career seniority level">
                {levels.map((lvl) => {
                  const isSelected = selectedLevel === lvl.id;
                  return (
                    <div 
                      key={lvl.id} 
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedLevel(lvl.id)}
                      onKeyDown={(e) => handleKeyDown(e, () => setSelectedLevel(lvl.id))}
                      aria-label={`${lvl.label}, ${lvl.desc}`}
                    >
                      <div className="option-icon" aria-hidden="true">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <div className="option-title">{lvl.label}</div>
                        <div className="option-desc">{lvl.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* STEP 3: Select Location */}
          {step === 3 && (
            <fieldset style={{ border: 'none', padding: 0 }}>
              <legend className="card-title" style={{ marginBottom: '16px', fontSize: '1.1rem' }}>
                3. Select your Location Preference:
              </legend>
              <div className="options-grid" role="radiogroup" aria-label="Select location preference">
                {locations.map((loc) => {
                  const isSelected = selectedLocation === loc.id;
                  return (
                    <div 
                      key={loc.id} 
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedLocation(loc.id)}
                      onKeyDown={(e) => handleKeyDown(e, () => setSelectedLocation(loc.id))}
                      aria-label={`${loc.label}, ${loc.desc}`}
                    >
                      <div className="option-icon" aria-hidden="true">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div className="option-title">{loc.label}</div>
                        <div className="option-desc">{loc.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '24px' }}>
            {step > 1 && (
              <button className="btn-secondary" onClick={() => setStep(step - 1)} aria-label="Go back to previous step">
                Back
              </button>
            )}
            <button className="btn-primary" onClick={handleNext} style={{ marginLeft: 'auto' }} aria-label={step === 3 ? 'Generate My NZ Career Brief' : 'Next Step'}>
              {step === 3 ? 'Generate My NZ Career Brief' : 'Next Step'} <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        /* REPORT RESULT BRIEF */
        <article aria-labelledby="report-title">
          <div className="report-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <span className="badge badge-emerald">
                <Sparkles size={14} aria-hidden="true" /> Custom NZ Career Brief Generated
              </span>
              <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: '38px' }} onClick={() => window.print()} aria-label="Print or save PDF of career brief">
                <Printer size={14} aria-hidden="true" /> Print / Save PDF
              </button>
            </div>
            <h3 id="report-title" className="card-title" style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>
              Strategic Career Brief: {currentIndMeta.label}
            </h3>
            <p className="card-subtitle">Tailored for New Zealand Employment Market • Based on Stats NZ & MBIE Datasets</p>
          </div>

          <div className="section-grid">
            {/* Top Target Cities */}
            <div className="glass-card section-card col-6">
              <h4 className="card-title" style={{ marginBottom: '12px', fontSize: '1.1rem' }}>
                <MapPin size={20} color="#4f46e5" aria-hidden="true" />
                Recommended Target Cities in NZ
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {currentIndMeta.top_regions?.map((reg, idx) => (
                  <span key={idx} className="badge badge-indigo" style={{ fontSize: '0.9rem', padding: '8px 14px' }}>
                    {reg}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {currentIndMeta.nz_relocation_advice}
              </p>
            </div>

            {/* Compensation & Salary Expectations */}
            <div className="glass-card section-card col-6">
              <h4 className="card-title" style={{ marginBottom: '12px', fontSize: '1.1rem' }}>
                <Award size={20} color="#059669" aria-hidden="true" />
                Salary & Compensation Benchmark
              </h4>
              <div className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#059669', marginBottom: '8px' }}>
                {currentIndMeta.median_salary}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Based on Stats NZ ANZSIC06 Census median weekly and hourly earnings dataset. Highly-skilled technical leads in Auckland/Wellington average 15-25% above median baseline.
              </p>
            </div>

            {/* Strategic Advice Card */}
            <div className="glass-card section-card col-12">
              <h4 className="card-title" style={{ marginBottom: '12px', fontSize: '1.1rem' }}>
                <CheckCircle size={20} color="#0284c7" aria-hidden="true" />
                Actionable Advice for Job Seekers ({currentLvlMeta.title})
              </h4>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '16px' }}>
                {currentLvlMeta.key_advice}
              </p>

              <div style={{ background: 'var(--table-header-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>💡 Employer Interview Tip:</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  When interviewing with New Zealand companies, demonstrate familiarity with NZ market context (e.g. regional housing accessibility, local customer bases, and adaptability to agile cross-functional teams).
                </p>
              </div>
            </div>
          </div>

          {/* Data Source Caption */}
          <div className="data-source-caption" style={{ marginBottom: '24px' }}>
            <Database size={14} aria-hidden="true" />
            <span>Data Source: MBIE Jobs Online Consolidated Series & Stats NZ Household Labour Force Survey Census</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={handleReset} aria-label="Retake quiz and change options">
              <RefreshCw size={16} aria-hidden="true" /> Retake Quiz & Change Options
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
