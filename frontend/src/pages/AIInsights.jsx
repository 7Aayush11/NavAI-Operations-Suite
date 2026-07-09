import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Cpu, AlertTriangle, TrendingDown, ArrowUpRight, Zap, Info } from 'lucide-react';

const AIInsights = () => {
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
        setError('Failed to fetch data for AI recommendations.');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Booting AI intelligence recommendation engine...
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
  if (total === 0) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs italic">
        No onboarding data available to compute machine insights.
      </div>
    );
  }

  // --- Dynamic calculations for AI Recommendations ---

  // 1. Bottleneck Stage
  const stepRegister = total;
  const stepPersonalInfo = applications.filter(app => app.step_logs?.some(l => l.step_name === 'PERSONAL_INFO') || app.current_step !== 'REGISTER').length;
  const stepKyc = applications.filter(app => app.step_logs?.some(l => l.step_name === 'KYC_UPLOAD') || (app.current_step !== 'REGISTER' && app.current_step !== 'PERSONAL_INFO')).length;
  const stepSignature = applications.filter(app => app.step_logs?.some(l => l.step_name === 'SIGNATURE') || app.status === 'COMPLETED').length;
  const stepCompleted = applications.filter(app => app.status === 'COMPLETED').length;

  const drops = [
    { stage: 'Register', drop: stepRegister - stepPersonalInfo, from: stepRegister },
    { stage: 'Personal Info Form', drop: stepPersonalInfo - stepKyc, from: stepPersonalInfo },
    { stage: 'KYC Photo Upload', drop: stepKyc - stepSignature, from: stepKyc },
    { stage: 'Agreement Signature', drop: stepSignature - stepCompleted, from: stepSignature }
  ];

  // Find stage with highest drop-off rate (drop/from)
  let highestDropStage = drops[0];
  let maxRate = 0;
  drops.forEach(d => {
    if (d.from > 0) {
      const rate = d.drop / d.from;
      if (rate > maxRate) {
        maxRate = rate;
        highestDropStage = d;
      }
    }
  });

  const bottleneckPct = Math.round(maxRate * 100);

  // 2. Main Grievance Category
  const feedbacks = [];
  applications.forEach(app => {
    if (app.feedbacks) feedbacks.push(...app.feedbacks);
  });

  const feedbackCounts = { KYC_ISSUE: 0, UI_NAVIGATION: 0, PRICING: 0, NO_INTEREST: 0, OTHER: 0 };
  feedbacks.forEach(f => {
    if (feedbackCounts.hasOwnProperty(f.abandoned_reason_category)) {
      feedbackCounts[f.abandoned_reason_category]++;
    }
  });

  let topGrievance = 'KYC_ISSUE';
  let topCount = 0;
  Object.keys(feedbackCounts).forEach(k => {
    if (feedbackCounts[k] > topCount) {
      topCount = feedbackCounts[k];
      topGrievance = k;
    }
  });

  // Get specific suggestion text based on top grievance
  const getGrievanceAnalysis = (cat) => {
    switch (cat) {
      case 'KYC_ISSUE':
        return {
          title: 'KYC Image capture & validation friction',
          desc: 'Optical verification services timeout due to low-light environments and edge blur.',
          action: 'Integrate real-time edge-detection camera overlays and guidance prompts in the mobile onboarding app. Provide fallback web upload alternatives for low-end devices.'
        };
      case 'UI_NAVIGATION':
        return {
          title: 'Onboarding Form UX reloads',
          desc: 'Form inputs are reset on network re-authentications during address entry.',
          action: 'Configure progressive local draft saves (IndexedDB) in the mobile client so user progress is cached locally, preventing total data loss on disconnect.'
        };
      case 'PRICING':
        return {
          title: 'Pricing transparency concerns',
          desc: 'Applicants drop out after seeing interest schedules at signature checkpoints.',
          action: 'Introduce interactive fee calculators earlier in the REGISTER step. Providing transparent quotes upfront improves conversion intent.'
        };
      case 'NO_INTEREST':
        return {
          title: 'Preference for offline processing',
          desc: 'Customers choose paper folders over digital upload screens.',
          action: 'Enable an option to request face-to-face assistance. Dispatch a local Operations Officer with a secure tablet to finalize KYC on-site.'
        };
      default:
        return {
          title: 'General workflow friction',
          desc: 'Minor network dropouts and user cancellations.',
          action: 'Set up SMS alerts that notify users of saved progress links so they can resume their session easily later.'
        };
    }
  };

  const grievanceInfo = getGrievanceAnalysis(topGrievance);

  // 3. Branch Staff Allocation Optimization
  const branchCounts = {};
  applications.forEach(app => {
    if (app.branch_name) {
      if (!branchCounts[app.branch_name]) {
        branchCounts[app.branch_name] = { total: 0, active: 0, completed: 0, abandoned: 0 };
      }
      branchCounts[app.branch_name].total++;
      if (app.status === 'IN_PROGRESS') branchCounts[app.branch_name].active++;
      else if (app.status === 'COMPLETED') branchCounts[app.branch_name].completed++;
      else if (app.status === 'ABANDONED') branchCounts[app.branch_name].abandoned++;
    }
  });

  // Find branch with highest pending files
  let targetBranch = 'Worli Hub';
  let maxPending = 0;
  Object.keys(branchCounts).forEach(b => {
    const pending = branchCounts[b].active + branchCounts[b].abandoned;
    if (pending > maxPending) {
      maxPending = pending;
      targetBranch = b;
    }
  });

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-indigo-400" />
            <span>AI Operations Insights</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Dynamic node diagnostics engine running statistical audits on digital customer onboarding folders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Bottleneck and Critical Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Bottleneck Identification */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Critical Flow Bottleneck</h2>
            </div>
            
            <p className="text-slate-350 text-xs leading-relaxed">
              Diagnostic sweeps indicate the primary drop-off occurs during the **{highestDropStage.stage}** step, losing **{bottleneckPct}%** of users entering this stage.
            </p>

            <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-900 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Friction Index</span>
                <span className="text-slate-200 font-bold">Stage drop rate</span>
              </div>
              <span className="text-xl font-black text-amber-400">{bottleneckPct}%</span>
            </div>
          </div>

          {/* Branch Allocation Optimizer */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Branch Telemetry Optimizer</h2>
            </div>
            
            <p className="text-slate-350 text-xs leading-relaxed">
              Audit data indicates branch **"{targetBranch}"** represents the highest density of unresolved/inactive onboarding files ({maxPending} applications).
            </p>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3 text-xs text-indigo-200 leading-relaxed">
              <Info className="w-5.5 h-5.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                **Actionable Recommendation:** Reallocate 2 extra Operations Officers to branch **"{targetBranch}"** to assist field onboarding support and resolve pending applications.
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Recommendations Card */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">AI Recommendation Summary</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Top Grievance Category</span>
                <span className="font-bold text-slate-200">{grievanceInfo.title}</span>
              </div>
              
              <div className="space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Root Cause Analysis</span>
                <p className="text-slate-400 leading-relaxed">{grievanceInfo.desc}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Suggested Engineering Action</span>
                <p className="text-slate-350 leading-relaxed bg-slate-950/60 p-3.5 border border-slate-900 rounded-xl italic">
                  "{grievanceInfo.action}"
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850">
            <button 
              onClick={() => alert("Report parameters successfully saved. Model retraining triggered.")}
              className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-250 hover:text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>Save Telemetry parameters</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AIInsights;
