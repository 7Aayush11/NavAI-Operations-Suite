import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Activity, Clock, MessageSquare, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';

const RecordEvents = () => {
  const { user } = useAuth();
  const isOfficer = user?.role?.name === 'Operations Officer';

  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Log Form State
  const [stepName, setStepName] = useState('PERSONAL_INFO');
  const [logStatus, setLogStatus] = useState('COMPLETED');
  const [duration, setDuration] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  // Feedback Form State
  const [fbCategory, setFbCategory] = useState('KYC_ISSUE');
  const [fbNotes, setFbNotes] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // We only want active applications in progress or abandoned for easy logging
      const response = await api.get('/api/applications');
      setApplications(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAppChange = (e) => {
    const id = e.target.value;
    setSelectedAppId(id);
    setSuccess('');
    setError('');
    
    if (!id) {
      setSelectedApp(null);
      return;
    }

    const app = applications.find(a => a.id === parseInt(id, 10));
    setSelectedApp(app);

    // Predict next logical step
    if (app) {
      if (app.current_step === 'REGISTER') setStepName('PERSONAL_INFO');
      else if (app.current_step === 'PERSONAL_INFO') setStepName('KYC_UPLOAD');
      else if (app.current_step === 'KYC_UPLOAD') setStepName('SIGNATURE');
      else setStepName('SIGNATURE');
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!selectedAppId) return;

    setLogSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        step_name: stepName,
        status: logStatus,
        duration_seconds: duration ? parseFloat(duration) : null,
        error_message: logStatus === 'FAILED' ? errorMsg : null
      };

      await api.post(`/api/applications/${selectedAppId}/logs`, payload);
      setSuccess(`Step ${stepName} status ${logStatus} logged successfully.`);
      setDuration('');
      setErrorMsg('');
      
      // Reload apps list and refresh the selected app representation
      const response = await api.get('/api/applications');
      setApplications(response.data);
      const updatedApp = response.data.find(a => a.id === parseInt(selectedAppId, 10));
      setSelectedApp(updatedApp);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to log step timeline event.');
    } finally {
      setLogSubmitting(false);
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    if (!selectedAppId) return;

    setFbSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        abandoned_reason_category: fbCategory,
        notes: fbNotes
      };

      await api.post(`/api/applications/${selectedAppId}/feedbacks`, payload);
      setSuccess(`Feedback category ${fbCategory} successfully saved.`);
      setFbNotes('');

      const response = await api.get('/api/applications');
      setApplications(response.data);
      const updatedApp = response.data.find(a => a.id === parseInt(selectedAppId, 10));
      setSelectedApp(updatedApp);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to register customer feedback notes.');
    } finally {
      setFbSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ABANDONED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-400" />
            <span>Record Timeline Events</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Quick-access terminal to log system status updates, checkpoints, and customer telephone feedbacks on the go.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Select Application & Details Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Select Customer File
            </label>
            <select
              value={selectedAppId}
              onChange={handleAppChange}
              className="w-full px-3 py-2.5 rounded-lg glass-input text-xs appearance-none"
              disabled={loading}
            >
              <option value="" className="bg-slate-900">Choose Onboarding Record...</option>
              {applications.map(app => (
                <option key={app.id} value={app.id} className="bg-slate-900 text-slate-100">
                  {app.customer_name} ({app.branch_name || 'No Branch'})
                </option>
              ))}
            </select>
          </div>

          {selectedApp ? (
            <div className="border-t border-slate-850 pt-4 space-y-3.5 text-xs">
              <h3 className="font-bold text-slate-200 text-sm">{selectedApp.customer_name}</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Phone Number:</span>
                  <span className="text-slate-200 font-medium">{selectedApp.phone_number}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Branch:</span>
                  <span className="text-slate-200 font-medium">{selectedApp.branch_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Step:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700">
                    {selectedApp.current_step}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>File Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getStatusBadge(selectedApp.status)}`}>
                    {selectedApp.status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-slate-850 pt-8 text-center text-slate-500 text-xs italic">
              Select an onboarding file from the dropdown to access telemetry inputs.
            </div>
          )}
        </div>

        {/* Logging Forms */}
        <div className="lg:col-span-2 space-y-6">
          {selectedApp && selectedApp.status === 'IN_PROGRESS' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-850 space-y-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>Log Checkpoint Progress Event</span>
              </h2>

              <form onSubmit={handleAddLog} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      Onboarding Step
                    </label>
                    <select
                      value={stepName}
                      onChange={(e) => setStepName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none"
                      disabled={logSubmitting}
                    >
                      <option value="REGISTER" className="bg-slate-900">REGISTER</option>
                      <option value="PERSONAL_INFO" className="bg-slate-900">PERSONAL_INFO</option>
                      <option value="KYC_UPLOAD" className="bg-slate-900">KYC_UPLOAD</option>
                      <option value="SIGNATURE" className="bg-slate-900">SIGNATURE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      Progress Status
                    </label>
                    <select
                      value={logStatus}
                      onChange={(e) => setLogStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none"
                      disabled={logSubmitting}
                    >
                      <option value="STARTED" className="bg-slate-900">STARTED</option>
                      <option value="COMPLETED" className="bg-slate-900">COMPLETED</option>
                      <option value="FAILED" className="bg-slate-900">FAILED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      Duration of step (seconds)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 180"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                      disabled={logSubmitting}
                    />
                  </div>

                  {logStatus === 'FAILED' && (
                    <div>
                      <label className="block text-red-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                        Failure / Error Message
                      </label>
                      <input
                        type="text"
                        placeholder="Document OCR scanning mismatch..."
                        value={errorMsg}
                        onChange={(e) => setErrorMsg(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-red-950/15 border border-red-500/20 text-red-200 text-xs"
                        disabled={logSubmitting}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={logSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {logSubmitting ? 'Submitting telemetry...' : 'Commit Timeline Checkpoint'}
                </button>
              </form>
            </div>
          )}

          {selectedApp && selectedApp.status === 'ABANDONED' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-850 space-y-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-400" />
                <span>Log Telephone Call Feedback (Follow-Up Check)</span>
              </h2>

              <form onSubmit={handleAddFeedback} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Feedback Category
                  </label>
                  <select
                    value={fbCategory}
                    onChange={(e) => setFbCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none"
                    disabled={fbSubmitting}
                  >
                    <option value="KYC_ISSUE" className="bg-slate-900">KYC Verification Issue</option>
                    <option value="UI_NAVIGATION" className="bg-slate-900">App Navigation / Interface struggles</option>
                    <option value="PRICING" className="bg-slate-900">Pricing / Interest processing fees</option>
                    <option value="NO_INTEREST" className="bg-slate-900">Lost Interest / Preference offline</option>
                    <option value="OTHER" className="bg-slate-900">Other reasons</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Follow-Up Auditing Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter what the customer explained during the phone follow-up check..."
                    value={fbNotes}
                    onChange={(e) => setFbNotes(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs resize-none"
                    disabled={fbSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={fbSubmitting}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 border border-red-500/10"
                >
                  {fbSubmitting ? 'Recording call logs...' : 'Submit Call Feedback Log'}
                </button>
              </form>
            </div>
          )}

          {selectedApp && selectedApp.status === 'COMPLETED' && (
            <div className="glass-panel p-8 rounded-2xl border border-slate-850 text-center space-y-3">
              <Smartphone className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">Onboarding File Completed</h3>
              <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                This customer has successfully completed the onboarding pipeline and is fully converted. No further telemetry logging is needed.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default RecordEvents;
