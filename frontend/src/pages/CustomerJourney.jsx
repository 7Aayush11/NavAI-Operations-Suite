import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Compass, Search, Calendar, MapPin, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

const CustomerJourney = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/applications');
      setApplications(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch customer journey list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSelectApp = async (appId) => {
    try {
      setDetailLoading(true);
      const response = await api.get(`/api/applications/${appId}`);
      setSelectedApp(response.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load detailed journey history.');
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED': return { color: 'text-emerald-450', text: 'Converted', bg: 'bg-emerald-500/10 border-emerald-500/20' };
      case 'ABANDONED': return { color: 'text-red-450', text: 'Abandoned', bg: 'bg-red-500/10 border-red-500/20' };
      default: return { color: 'text-amber-450', text: 'In Progress', bg: 'bg-amber-500/10 border-amber-500/20' };
    }
  };

  const filteredApps = applications.filter(app => {
    const term = searchQuery.toLowerCase();
    return (
      app.customer_name.toLowerCase().includes(term) ||
      app.phone_number.toLowerCase().includes(term) ||
      (app.branch_name && app.branch_name.toLowerCase().includes(term))
    );
  });

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Compass className="w-8 h-8 text-indigo-400" />
            <span>Customer Journeys Audit</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Trace the exact chronological step path taken by onboarding applicants, investigate drop-off events, and analyze validation details.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Directory & Search */}
        <div className="lg:col-span-1 glass-panel rounded-2xl border border-slate-800 flex flex-col h-[75vh]">
          <div className="p-4 border-b border-slate-850 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search applicant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs focus:outline-none focus:border-blue-500 text-slate-300 placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-850">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading onboarding profiles...</div>
            ) : filteredApps.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No matching customer files.</div>
            ) : (
              filteredApps.map(app => {
                const badge = getStatusStyle(app.status);
                const isSelected = selectedApp?.id === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelectApp(app.id)}
                    className={`w-full p-4 text-left hover:bg-slate-900/35 transition-colors flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-slate-900/50 border-r-2 border-indigo-500' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-200 truncate">{app.customer_name}</div>
                      <div className="text-[10px] text-slate-550 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{app.branch_name}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${badge.bg} ${badge.color}`}>
                        {badge.text}
                      </span>
                      <div className="text-[8px] text-slate-550 mt-1 font-mono">{app.current_step}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Journey Telemetry Path */}
        <div className="lg:col-span-2 space-y-6">
          {selectedApp ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* Profile Bar */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-850 pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Customer Journey File #{selectedApp.id}</span>
                  <h2 className="text-lg font-bold text-slate-100">{selectedApp.customer_name}</h2>
                  <div className="flex items-center gap-3.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-550" /> {selectedApp.branch_name}</span>
                    <span>•</span>
                    <span>Officer ID: {selectedApp.assigned_officer_id || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${getStatusStyle(selectedApp.status).bg} ${getStatusStyle(selectedApp.status).color}`}>
                    {getStatusStyle(selectedApp.status).text}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1.5 flex items-center sm:justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Registered {new Date(selectedApp.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Progress Milestones Visual */}
              <div className="space-y-3.5 bg-slate-950/20 border border-slate-900 p-5 rounded-2xl">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Onboarding Funnel Checkout</h3>
                <div className="flex items-center justify-between relative py-2 max-w-xl mx-auto">
                  <div className="absolute left-1 right-1 top-1/2 h-[2px] bg-slate-800 -translate-y-1/2 z-0"></div>
                  {['REGISTER', 'PERSONAL_INFO', 'KYC_UPLOAD', 'SIGNATURE'].map((step, idx) => {
                    const stepOrder = ['REGISTER', 'PERSONAL_INFO', 'KYC_UPLOAD', 'SIGNATURE'];
                    const currentIdx = stepOrder.indexOf(selectedApp.current_step);
                    const thisIdx = stepOrder.indexOf(step);
                    
                    let nodeStyle = 'bg-slate-900 text-slate-500 border-slate-800';
                    if (thisIdx < currentIdx) {
                      nodeStyle = 'bg-emerald-600 text-white border-emerald-500';
                    } else if (thisIdx === currentIdx) {
                      if (selectedApp.status === 'ABANDONED') {
                        nodeStyle = 'bg-red-600 text-white border-red-500';
                      } else if (selectedApp.status === 'COMPLETED') {
                        nodeStyle = 'bg-emerald-600 text-white border-emerald-500';
                      } else {
                        nodeStyle = 'bg-indigo-600 text-white border-indigo-500';
                      }
                    }

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10" title={step}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${nodeStyle}`}>
                          {idx + 1}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold mt-2 font-mono uppercase tracking-tighter">
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chronological Event Tree */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-indigo-400" />
                  <span>Chronological Journey Steps Logs</span>
                </h3>

                {selectedApp.step_logs?.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-950/20 border border-slate-900 rounded-xl text-xs italic">
                    No timeline logs recorded for this application.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6 py-2">
                    {selectedApp.step_logs.map((log) => {
                      const isFailed = log.status === 'FAILED';
                      const isCompleted = log.status === 'COMPLETED';
                      return (
                        <div key={log.id} className="relative">
                          {/* Circle on line */}
                          <div className={`absolute -left-[31px] w-4.5 h-4.5 rounded-full border-2 bg-slate-950 flex items-center justify-center ${
                            isCompleted ? 'border-emerald-500 text-emerald-400' :
                            isFailed ? 'border-red-500 text-red-400' :
                            'border-indigo-500 text-indigo-400'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isCompleted ? 'bg-emerald-500' :
                              isFailed ? 'bg-red-500' :
                              'bg-indigo-500'
                            }`}></div>
                          </div>

                          <div className="glass-panel p-4 rounded-xl border border-slate-850/65 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="font-bold text-slate-200 font-mono text-[11px] tracking-wide uppercase flex items-center gap-2">
                                <span>{log.step_name.replace('_', ' ')}</span>
                                <span className={`inline-block px-1 rounded text-[8px] font-bold ${
                                  isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                  isFailed ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                                  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                                }`}>
                                  {log.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Event logged at: {new Date(log.timestamp).toLocaleString()}
                              </p>
                              {log.error_message && (
                                <div className="text-[10px] text-red-300 flex items-start gap-1 bg-red-950/10 border border-red-550/15 p-2 rounded-lg mt-2">
                                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                  <span>{log.error_message}</span>
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 text-slate-400 text-[10px] font-mono text-left md:text-right">
                              {log.duration_seconds && (
                                <div className="flex items-center gap-1 md:justify-end">
                                  <span>Time:</span>
                                  <span className="font-bold text-slate-200">{log.duration_seconds}s</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Feedbacks Panel */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4.5 h-4.5 text-indigo-400" />
                  <span>Call Follow-Ups & Feedback Registry</span>
                </h3>

                {selectedApp.feedbacks?.length === 0 ? (
                  <p className="text-slate-500 text-xs italic bg-slate-950/10 border border-slate-900 p-4 rounded-xl">
                    No feedback call records logged.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedApp.feedbacks.map((fb) => (
                      <div key={fb.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-350 border border-slate-700 text-[9px] font-bold font-mono">
                              {fb.abandoned_reason_category}
                            </span>
                            <span className="text-[10px] text-slate-500">Recorded by Officer #{fb.recorded_by}</span>
                          </div>
                          <span className="text-[9px] text-slate-550 font-medium">{new Date(fb.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300 italic leading-relaxed text-[11px] bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                          "{fb.notes}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center flex flex-col justify-center items-center text-slate-500 text-xs space-y-4">
              <Compass className="w-16 h-16 text-slate-700 animate-spin-slow" />
              <div className="max-w-xs leading-relaxed">
                Select an applicant profile from the directory on the left to inspect their specific transaction paths, logs tree, and feedback entries.
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default CustomerJourney;
