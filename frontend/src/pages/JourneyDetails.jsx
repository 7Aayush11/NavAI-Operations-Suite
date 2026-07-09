import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, Play, Clock, CheckCircle, AlertOctagon, 
  PlusCircle, RefreshCw, X, ShieldAlert, Monitor, Smartphone, Tablet
} from 'lucide-react';

const JourneyDetails = () => {
  const { user } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Selected Journey timeline data
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Form State: Start Journey
  const [customerId, setCustomerId] = useState('1'); // Seeded customer default
  const [branchName, setBranchName] = useState('Mumbai West');
  const [deviceType, setDeviceType] = useState('MOBILE');
  const [startSubmitting, setStartSubmitting] = useState(false);

  // Form State: Add Event
  const [eventStep, setEventStep] = useState('PAN Uploaded');
  const [eventStatus, setEventStatus] = useState('COMPLETED');
  const [eventDuration, setEventDuration] = useState('');
  const [eventFailureReason, setEventFailureReason] = useState('');
  const [eventSubmitting, setEventSubmitting] = useState(false);

  // Form State: End Journey
  const [endStatus, setEndStatus] = useState('COMPLETED');
  const [endReason, setEndReason] = useState('');
  const [endSubmitting, setEndSubmitting] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/applications');
      setApplications(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch application records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const loadTimeline = async (appId) => {
    try {
      setTimelineLoading(true);
      setSuccess('');
      setError('');
      const response = await api.get(`/api/journey/${appId}`);
      setTimeline(response.data);
      setSelectedAppId(appId);
      
      // Auto-set the next expected step in dropdown for testing
      const currentStep = response.data.current_step;
      const stepProgression = [
        "Application Started",
        "PAN Uploaded",
        "Aadhaar Uploaded",
        "OTP Verified",
        "Bank Details",
        "Document Upload",
        "Video KYC",
        "Application Submitted"
      ];
      
      const currentIdx = stepProgression.indexOf(currentStep);
      if (currentIdx !== -1 && currentIdx < stepProgression.length - 1) {
        setEventStep(stepProgression[currentIdx + 1]);
      } else {
        setEventStep("PAN Uploaded");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load chronological timeline.');
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleStartJourney = async (e) => {
    e.preventDefault();
    if (!customerId) return;
    
    setStartSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = {
        customer_id: parseInt(customerId, 10),
        branch_name: branchName,
        assigned_officer_id: user?.id || null,
        device_type: deviceType,
        browser: "Chrome v114",
        operating_system: deviceType === 'MOBILE' ? 'Android' : 'Windows',
        ip_address: "192.168.1.1",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        latitude: 19.0760,
        longitude: 72.8777
      };
      
      const res = await api.post('/api/journey/start', payload);
      setSuccess(`Journey started! Application ID: ${res.data.application_id}, Session ID: ${res.data.session_id}`);
      
      // Reload applications list and display the new timeline
      await fetchApplications();
      await loadTimeline(res.data.application_id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to start customer journey.');
    } finally {
      setStartSubmitting(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!timeline) return;

    setEventSubmitting(true);
    setError('');
    setSuccess('');

    // Find active session from events or default to first session
    const sessionId = timeline.events[0]?.session_id;

    try {
      const payload = {
        application_id: timeline.application_id,
        session_id: sessionId,
        step_name: eventStep,
        status: eventStatus,
        time_spent_seconds: eventDuration ? parseFloat(eventDuration) : null,
        failure_reason: eventStatus === 'FAILED' ? eventFailureReason : null,
        metadata: { client: "React Verification Client" }
      };

      await api.post('/api/journey/event', payload);
      setSuccess(`Event '${eventStep}' status '${eventStatus}' committed successfully.`);
      setEventDuration('');
      setEventFailureReason('');
      await loadTimeline(timeline.application_id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to commit journey event.');
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleEndJourney = async (e) => {
    e.preventDefault();
    if (!timeline) return;

    setEndSubmitting(true);
    setError('');
    setSuccess('');

    const sessionId = timeline.events[0]?.session_id;

    try {
      const payload = {
        application_id: timeline.application_id,
        session_id: sessionId,
        status: endStatus,
        reason: endReason || null
      };

      await api.post('/api/journey/end', payload);
      setSuccess(`Journey ended with status ${endStatus}.`);
      setEndReason('');
      await fetchApplications();
      await loadTimeline(timeline.application_id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to end session.');
    } finally {
      setEndSubmitting(false);
    }
  };

  // Helper to map log icons
  const getDeviceIcon = (device) => {
    if (device === 'MOBILE') return <Smartphone className="w-3.5 h-3.5" />;
    if (device === 'TABLET') return <Tablet className="w-3.5 h-3.5" />;
    return <Monitor className="w-3.5 h-3.5" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/25';
      case 'ABANDONED': return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
    }
  };

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Compass className="w-8 h-8 text-indigo-400" />
            <span>Journey Tracking Console</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Core verification dashboard for the Customer Journey Tracking Engine. Start onboarding sessions, log events, test state machines, and view chronological logs.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-250 text-xs">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Onboarding controls & History table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Start Journey Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Play className="w-4.5 h-4.5 text-emerald-400" />
              <span>Initialize Customer Journey</span>
            </h2>

            <form onSubmit={handleStartJourney} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                  Customer ID (1-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  disabled={startSubmitting}
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                  Branch Name
                </label>
                <select
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none"
                  disabled={startSubmitting}
                >
                  <option value="Mumbai West" className="bg-slate-900">Mumbai West</option>
                  <option value="Bandra Branch" className="bg-slate-900">Bandra Branch</option>
                  <option value="Worli Hub" className="bg-slate-900">Worli Hub</option>
                  <option value="Thane Regional" className="bg-slate-900">Thane Regional</option>
                </select>
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Device
                  </label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none"
                    disabled={startSubmitting}
                  >
                    <option value="MOBILE" className="bg-slate-900">MOBILE</option>
                    <option value="TABLET" className="bg-slate-900">TABLET</option>
                    <option value="DESKTOP" className="bg-slate-900">DESKTOP</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={startSubmitting}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold hover:shadow-lg transition-all h-[34px] flex items-center justify-center shrink-0"
                >
                  {startSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Start'}
                </button>
              </div>
            </form>
          </div>

          {/* Journey History Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-850 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Journey History Records
              </h2>
              <button onClick={fetchApplications} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                Fetching journey directories...
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs italic">
                No customer journey records.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 bg-slate-950/20 font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-3">App ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Current Step</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {applications.map((app) => (
                      <tr 
                        key={app.id} 
                        className={`hover:bg-slate-900/35 transition-colors ${selectedAppId === app.id ? 'bg-slate-900/60' : ''}`}
                      >
                        <td className="p-3 font-mono font-bold text-slate-350">#{app.id}</td>
                        <td className="p-3 font-bold text-slate-250">{app.customer_name}</td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.2 bg-slate-950 text-slate-400 rounded text-[9px] border border-slate-850 font-mono">
                            {app.current_step}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold border ${getStatusBadge(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => loadTimeline(app.id)}
                            className="py-1 px-2.5 bg-slate-850 border border-slate-750 hover:bg-slate-800 text-slate-300 text-[10px] rounded-lg transition-all"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Journey Details Timeline & Logs */}
        <div className="lg:col-span-1">
          {timeline ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* Profile Card */}
              <div className="border-b border-slate-850 pb-4 space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Selected Application Timeline</span>
                <h3 className="font-bold text-slate-200 text-sm">{timeline.customer_name}</h3>
                <div className="flex justify-between text-[10px] text-slate-450 pt-1.5 font-mono">
                  <span>Application: #{timeline.application_id}</span>
                  <span>Duration: {Math.round(timeline.total_duration_seconds)}s</span>
                </div>
              </div>

              {/* Progress Event Modifiers */}
              {timeline.status === 'IN_PROGRESS' && (
                <div className="space-y-4">
                  {/* Append Event Form */}
                  <div className="border border-indigo-500/10 bg-indigo-500/5 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                      <PlusCircle className="w-4 h-4" />
                      <span>Log Event Step Checkpoint</span>
                    </div>

                    <form onSubmit={handleAddEvent} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-[8px] text-slate-450 font-bold uppercase tracking-wider mb-1">Onboarding Step</label>
                        <select
                          value={eventStep}
                          onChange={(e) => setEventStep(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px] appearance-none"
                        >
                          <option value="Application Started" className="bg-slate-900">Application Started</option>
                          <option value="PAN Uploaded" className="bg-slate-900">PAN Uploaded</option>
                          <option value="Aadhaar Uploaded" className="bg-slate-900">Aadhaar Uploaded</option>
                          <option value="OTP Verified" className="bg-slate-900">OTP Verified</option>
                          <option value="Bank Details" className="bg-slate-900">Bank Details</option>
                          <option value="Document Upload" className="bg-slate-900">Document Upload</option>
                          <option value="Video KYC" className="bg-slate-900">Video KYC</option>
                          <option value="Application Submitted" className="bg-slate-900">Application Submitted</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] text-slate-450 font-bold uppercase tracking-wider mb-1">Status</label>
                          <select
                            value={eventStatus}
                            onChange={(e) => setEventStatus(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px] appearance-none"
                          >
                            <option value="STARTED" className="bg-slate-900">STARTED</option>
                            <option value="COMPLETED" className="bg-slate-900">COMPLETED</option>
                            <option value="FAILED" className="bg-slate-900">FAILED</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] text-slate-450 font-bold uppercase tracking-wider mb-1">Duration (sec)</label>
                          <input
                            type="number"
                            placeholder="Auto-calculated"
                            value={eventDuration}
                            onChange={(e) => setEventDuration(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px]"
                          />
                        </div>
                      </div>

                      {eventStatus === 'FAILED' && (
                        <div>
                          <label className="block text-[8px] text-red-400 font-bold uppercase tracking-wider mb-1">Failure Reason</label>
                          <input
                            type="text"
                            placeholder="e.g. KYC connection timeout"
                            required
                            value={eventFailureReason}
                            onChange={(e) => setEventFailureReason(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-red-950/15 border border-red-500/20 text-red-200 text-[11px] focus:outline-none"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={eventSubmitting}
                        className="w-full py-2 bg-indigo-650 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all"
                      >
                        {eventSubmitting ? 'Submitting...' : 'Commit Event'}
                      </button>
                    </form>
                  </div>

                  {/* End Journey Form */}
                  <div className="border border-red-500/10 bg-red-500/5 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                      <AlertOctagon className="w-4 h-4" />
                      <span>Conclude Onboarding Session</span>
                    </div>

                    <form onSubmit={handleEndJourney} className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-2 gap-2 items-end">
                        <div>
                          <label className="block text-[8px] text-slate-455 font-bold uppercase tracking-wider mb-1">Conclude State</label>
                          <select
                            value={endStatus}
                            onChange={(e) => setEndStatus(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px] appearance-none"
                          >
                            <option value="COMPLETED" className="bg-slate-900">COMPLETED</option>
                            <option value="REJECTED" className="bg-slate-900">REJECTED</option>
                            <option value="ABANDONED" className="bg-slate-900">ABANDONED</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={endSubmitting}
                          className="w-full py-2 bg-red-650 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold transition-all border border-red-500/10"
                        >
                          {endSubmitting ? 'Ending...' : 'End Journey'}
                        </button>
                      </div>

                      {endStatus !== 'COMPLETED' && (
                        <div>
                          <label className="block text-[8px] text-slate-455 font-bold uppercase tracking-wider mb-1">Conclude Details Notes</label>
                          <input
                            type="text"
                            placeholder="Grievance / rejection reason notes..."
                            value={endReason}
                            onChange={(e) => setEndReason(e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px]"
                          />
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}

              {/* Graphical timeline UI */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Onboarding Steps Timeline Path</span>
                </h4>

                <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-4 text-xs py-1">
                  {timeline.events.map((evt) => {
                    const isCompleted = evt.status === 'COMPLETED';
                    const isFailed = evt.status === 'FAILED';
                    return (
                      <div key={evt.id} className="relative">
                        {/* Dot on line */}
                        <div className={`absolute -left-[30px] w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center ${
                          isCompleted ? 'border-emerald-500' :
                          isFailed ? 'border-red-500' :
                          'border-indigo-500'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isCompleted ? 'bg-emerald-500' :
                            isFailed ? 'bg-red-500' :
                            'bg-indigo-500'
                          }`}></div>
                        </div>

                        <div className="glass-panel p-3 rounded-xl border border-slate-850 flex flex-col gap-1 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-200 font-mono">{evt.step_name}</span>
                            <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                              isCompleted ? 'bg-emerald-500/10 text-emerald-450' :
                              isFailed ? 'bg-red-500/10 text-red-450' :
                              'bg-indigo-500/10 text-indigo-450'
                            }`}>
                              {evt.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                            <div className="flex items-center gap-1.5">
                              {getDeviceIcon(evt.device_type)}
                              <span>{evt.browser} ({evt.operating_system})</span>
                            </div>
                            <div>
                              {evt.time_spent_seconds !== null && <span>{Math.round(evt.time_spent_seconds)}s</span>}
                              <span className="ml-2">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          {evt.failure_reason && (
                            <div className="text-[10px] text-red-300 bg-red-950/15 p-2 rounded-lg border border-red-550/15 mt-1.5">
                              {evt.failure_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs italic">
              Select an onboarding customer record from the list to view its tracking details.
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default JourneyDetails;
