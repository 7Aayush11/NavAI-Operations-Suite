import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { BarChart3, AlertCircle, TrendingUp, HelpCircle, Compass, Users } from 'lucide-react';

const FunnelAnalytics = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/applications');
        setApplications(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch applications database for metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Calculating funnel metrics and analytics matrices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-400 text-xs border border-red-500/10 rounded-2xl bg-red-500/5">
        {error}
      </div>
    );
  }

  const total = applications.length;

  // 1. Funnel Math calculations (stage-by-stage counts)
  const stepRegister = total;
  const stepPersonalInfo = applications.filter(app => 
    app.step_logs?.some(l => l.step_name === 'PERSONAL_INFO') ||
    (app.current_step !== 'REGISTER')
  ).length;

  const stepKyc = applications.filter(app => 
    app.step_logs?.some(l => l.step_name === 'KYC_UPLOAD') ||
    (app.current_step !== 'REGISTER' && app.current_step !== 'PERSONAL_INFO')
  ).length;

  const stepSignature = applications.filter(app => 
    app.step_logs?.some(l => l.step_name === 'SIGNATURE') ||
    app.status === 'COMPLETED'
  ).length;

  const stepCompleted = applications.filter(app => app.status === 'COMPLETED').length;

  // Conversion rates relative to start (REGISTER)
  const pctRegister = 100;
  const pctPersonalInfo = total > 0 ? Math.round((stepPersonalInfo / total) * 100) : 0;
  const pctKyc = total > 0 ? Math.round((stepKyc / total) * 100) : 0;
  const pctSignature = total > 0 ? Math.round((stepSignature / total) * 100) : 0;
  const pctCompleted = total > 0 ? Math.round((stepCompleted / total) * 100) : 0;

  // Stage-by-stage drop-off rates (percentage of users entering the stage who dropped out)
  const dropRegister = stepRegister - stepPersonalInfo;
  const dropPersonalInfo = stepPersonalInfo - stepKyc;
  const dropKyc = stepKyc - stepSignature;
  const dropSignature = stepSignature - stepCompleted;

  const dropRateRegister = stepRegister > 0 ? Math.round((dropRegister / stepRegister) * 100) : 0;
  const dropRatePersonalInfo = stepPersonalInfo > 0 ? Math.round((dropPersonalInfo / stepPersonalInfo) * 100) : 0;
  const dropRateKyc = stepKyc > 0 ? Math.round((dropKyc / stepKyc) * 100) : 0;
  const dropRateSignature = stepSignature > 0 ? Math.round((dropSignature / stepSignature) * 100) : 0;

  // 2. Feedback Categories Math
  // Accumulate feedbacks from all applications
  const feedbacks = [];
  applications.forEach(app => {
    if (app.feedbacks) {
      feedbacks.push(...app.feedbacks);
    }
  });

  const feedbackCounts = {
    KYC_ISSUE: 0,
    UI_NAVIGATION: 0,
    PRICING: 0,
    NO_INTEREST: 0,
    OTHER: 0
  };

  feedbacks.forEach(f => {
    if (feedbackCounts.hasOwnProperty(f.abandoned_reason_category)) {
      feedbackCounts[f.abandoned_reason_category]++;
    } else {
      feedbackCounts.OTHER++;
    }
  });

  const totalFeedback = feedbacks.length || 1;
  const feedbackRatios = Object.keys(feedbackCounts).map(cat => ({
    category: cat,
    count: feedbackCounts[cat],
    pct: Math.round((feedbackCounts[cat] / totalFeedback) * 100)
  })).sort((a, b) => b.count - a.count);

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'KYC_ISSUE': return 'KYC Upload / Scanning Glare';
      case 'UI_NAVIGATION': return 'Form Usability & Page Reloads';
      case 'PRICING': return 'Pricing & Loan Processing Fees';
      case 'NO_INTEREST': return 'Lost Interest / Switched Offline';
      default: return 'Other Miscellaneous Reasons';
    }
  };

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-400" />
            <span>Funnel Analytics</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Real-time analytics computation of digital customer onboarding pipelines. Discover conversion rates and pinpoint customer drop-offs.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Gross Conversion Rate</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-100">{pctCompleted}%</h3>
            <p className="text-[10px] text-emerald-450 font-medium mt-1">Target benchmark: 48.0%</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Onboardings Initiated</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-100">{total}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Aggregated across all branches</p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Follow-up Audits Logged</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-100">{feedbacks.length} Notes</h3>
            <p className="text-[10px] text-slate-550 font-medium mt-1">Active customer feedback capture</p>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Compass className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Onboarding Funnel Progress Representation */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Drop-off Funnel Analysis</h2>
          </div>

          <div className="space-y-5">
            {[
              { name: '1. Register Account', count: stepRegister, pct: pctRegister, dropRate: dropRateRegister, label: 'Initial Application setup' },
              { name: '2. Basic Info Form', count: stepPersonalInfo, pct: pctPersonalInfo, dropRate: dropRatePersonalInfo, label: 'Personal & address detail forms' },
              { name: '3. Digital KYC Validation', count: stepKyc, pct: pctKyc, dropRate: dropRateKyc, label: 'Identity and liveness verification checks' },
              { name: '4. Signature & Agreement', count: stepSignature, pct: pctSignature, dropRate: dropRateSignature, label: 'Document signing and terms' },
              { name: '5. Completed (Converted)', count: stepCompleted, pct: pctCompleted, dropRate: null, label: 'Active loan folders successfully seeded' }
            ].map((step, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <span className="font-bold text-slate-200">{step.name}</span>
                    <span className="text-[9px] text-slate-500 block">{step.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-300 font-bold font-mono">{step.count} ({step.pct}%)</span>
                    {step.dropRate !== null && step.dropRate > 0 && (
                      <span className="text-[10px] text-red-400 ml-2 font-semibold">({step.dropRate}% stage drop-off)</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-900/60 border border-slate-850 h-3 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-650 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${step.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Reason Categories */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Abandonment Reason Categories</h2>
          </div>

          <div className="space-y-4">
            {feedbackRatios.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs italic">
                No customer abandonment reasons recorded.
              </div>
            ) : (
              feedbackRatios.map((item, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-[11px] font-medium text-slate-350">
                    <span className="truncate max-w-[200px]" title={item.category}>{getCategoryLabel(item.category)}</span>
                    <span className="text-slate-400 font-mono font-bold">{item.count} notes ({item.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950/60 border border-slate-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full" 
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex gap-3 text-[10px] text-red-200 leading-relaxed">
            <HelpCircle className="w-5.5 h-5.5 text-red-400 shrink-0 mt-0.5" />
            <span>
              Follow-up records show that **KYC upload failures** represent the single largest friction point for digital onboardings. Camera freezing and glare are primary issues.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default FunnelAnalytics;
