import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, Plus, Search, Filter, Calendar, MapPin, 
  Trash2, Eye, X, Send, Clock, AlertTriangle, MessageSquare, PlusCircle
} from 'lucide-react';

const ApplicationsManager = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'Super Admin';
  const isOfficer = user?.role?.name === 'Operations Officer';
  const canWrite = isAdmin || isOfficer || user?.role?.name === 'Branch Manager';

  const [applications, setApplications] = useState([]);
  const [officers, setOfficers] = useState([]); // Only loaded for Super Admin
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Selected Application for Detail Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Application Form State
  const [custName, setCustName] = useState('');
  const [phone, setPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [branchName, setBranchName] = useState('');
  const [assignedOfficerId, setAssignedOfficerId] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // New Log Event Form State
  const [logStep, setLogStep] = useState('PERSONAL_INFO');
  const [logStatus, setLogStatus] = useState('COMPLETED');
  const [logDuration, setLogDuration] = useState('');
  const [logErrorMsg, setLogErrorMsg] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  // New Feedback Form State
  const [fbCategory, setFbCategory] = useState('KYC_ISSUE');
  const [fbNotes, setFbNotes] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let path = '/api/applications';
      const params = [];
      if (statusFilter) params.push(`status_filter=${statusFilter}`);
      if (branchFilter) params.push(`branch_filter=${branchFilter}`);
      if (params.length > 0) {
        path += `?${params.join('&')}`;
      }
      const response = await api.get(path);
      setApplications(response.data);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError('Could not retrieve onboarding applications from system.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    if (!isAdmin) return;
    try {
      const response = await api.get('/api/users');
      // Filter for officers
      const filtered = response.data.filter(u => u.role?.name === 'Operations Officer');
      setOfficers(filtered);
    } catch (err) {
      console.error('Failed to load officers for assignment:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchOfficers();
  }, [statusFilter, branchFilter]);

  // Handle Application Click for Details
  const handleViewDetails = async (appId) => {
    try {
      setDetailLoading(true);
      const response = await api.get(`/api/applications/${appId}`);
      setSelectedApp(response.data);
      
      // Auto-set the next chronological step in log form
      const currentStep = response.data.current_step;
      if (currentStep === 'REGISTER') setLogStep('PERSONAL_INFO');
      else if (currentStep === 'PERSONAL_INFO') setLogStep('KYC_UPLOAD');
      else if (currentStep === 'KYC_UPLOAD') setLogStep('SIGNATURE');
      else setLogStep('SIGNATURE');
    } catch (err) {
      console.error('Failed to load details for app:', err);
      alert('Failed to retrieve application timeline data.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Re-fetch details to sync components
  const syncDetails = async (appId) => {
    try {
      const response = await api.get(`/api/applications/${appId}`);
      setSelectedApp(response.data);
      fetchApplications(); // Refresh list as well
    } catch (err) {
      console.error(err);
    }
  };

  // Create Application Action
  const handleCreateApplication = async (e) => {
    e.preventDefault();
    if (!custName || !phone) {
      alert('Customer Name and Phone Number are required.');
      return;
    }
    setCreateSubmitting(true);
    try {
      const payload = {
        customer_name: custName,
        phone_number: phone,
        email: custEmail || null,
        branch_name: branchName || null,
        assigned_officer_id: assignedOfficerId ? parseInt(assignedOfficerId, 10) : (isOfficer ? user.id : null)
      };
      await api.post('/api/applications', payload);
      setShowCreateModal(false);
      setCustName('');
      setPhone('');
      setCustEmail('');
      setBranchName('');
      setAssignedOfficerId('');
      fetchApplications();
    } catch (err) {
      console.error('Create application error:', err);
      alert(err.response?.data?.detail || 'Failed to initialize onboarding application.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Add Step Log Timeline Action
  const handleAddLog = async (e) => {
    e.preventDefault();
    setLogSubmitting(true);
    try {
      const payload = {
        step_name: logStep,
        status: logStatus,
        duration_seconds: logDuration ? parseFloat(logDuration) : null,
        error_message: logStatus === 'FAILED' ? logErrorMsg : null
      };
      await api.post(`/api/applications/${selectedApp.id}/logs`, payload);
      setLogDuration('');
      setLogErrorMsg('');
      await syncDetails(selectedApp.id);
    } catch (err) {
      console.error('Add log error:', err);
      alert(err.response?.data?.detail || 'Failed to record step log event.');
    } finally {
      setLogSubmitting(false);
    }
  };

  // Add Customer Feedback Action
  const handleAddFeedback = async (e) => {
    e.preventDefault();
    setFbSubmitting(true);
    try {
      const payload = {
        abandoned_reason_category: fbCategory,
        notes: fbNotes || null
      };
      await api.post(`/api/applications/${selectedApp.id}/feedbacks`, payload);
      setFbNotes('');
      await syncDetails(selectedApp.id);
    } catch (err) {
      console.error('Add feedback error:', err);
      alert(err.response?.data?.detail || 'Failed to record feedback note.');
    } finally {
      setFbSubmitting(false);
    }
  };

  // Delete Onboarding Application (Admin Only)
  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this application and all associated logs?')) {
      return;
    }
    try {
      await api.delete(`/api/applications/${appId}`);
      if (selectedApp?.id === appId) {
        setSelectedApp(null);
      }
      fetchApplications();
    } catch (err) {
      console.error('Delete application error:', err);
      alert(err.response?.data?.detail || 'Permission denied: Failed to delete onboarding record.');
    }
  };

  // Manual status update
  const handleUpdateStatus = async (field, val) => {
    try {
      const payload = { [field]: val };
      await api.put(`/api/applications/${selectedApp.id}`, payload);
      await syncDetails(selectedApp.id);
    } catch (err) {
      console.error('Update application error:', err);
      alert(err.response?.data?.detail || 'Failed to update application status.');
    }
  };

  // Search local filtering
  const filteredApps = applications.filter(app => {
    const term = searchQuery.toLowerCase();
    return (
      app.customer_name.toLowerCase().includes(term) ||
      app.phone_number.toLowerCase().includes(term) ||
      (app.email && app.email.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ABANDONED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-indigo-400" />
            <span>Applications Manager</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            {isOfficer 
              ? 'Validate, monitor, and record onboarding checkpoints for your assigned customer portfolios.'
              : 'Audit customer journeys, reassign files to field agents, inspect bottlenecks, and clear records.'
            }
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/15 relative z-10"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Filters Row */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search customer, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs focus:outline-none focus:border-blue-500 text-slate-300 placeholder-slate-500 transition-all"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-44 pl-3 pr-8 py-2 rounded-xl glass-input text-xs appearance-none"
            >
              <option value="" className="bg-slate-900">All Funnel Statuses</option>
              <option value="IN_PROGRESS" className="bg-slate-900">In Progress</option>
              <option value="COMPLETED" className="bg-slate-900">Completed (Converted)</option>
              <option value="ABANDONED" className="bg-slate-900">Abandoned (Drop-off)</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex-1 md:flex-none">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full md:w-44 pl-3 pr-8 py-2 rounded-xl glass-input text-xs appearance-none"
            >
              <option value="" className="bg-slate-900">All Branches</option>
              <option value="Mumbai West" className="bg-slate-900">Mumbai West</option>
              <option value="Bandra Branch" className="bg-slate-900">Bandra Branch</option>
              <option value="Worli Hub" className="bg-slate-900">Worli Hub</option>
              <option value="Thane Regional" className="bg-slate-900">Thane Regional</option>
            </select>
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid: List & Detail view */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Application List */}
        <div className={`${selectedApp ? 'xl:col-span-2' : 'xl:col-span-3'} glass-panel rounded-2xl border border-slate-800 overflow-hidden`}>
          <div className="p-5 border-b border-slate-850 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Onboarding Pipeline Files
            </h2>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
              Showing {filteredApps.length} rows
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Fetching pipeline records...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No onboarding application records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 bg-slate-950/20 font-semibold">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Current Step</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Timeline</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className={`hover:bg-slate-900/30 transition-colors ${selectedApp?.id === app.id ? 'bg-slate-900/50' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-slate-200">{app.customer_name}</div>
                        <div className="text-[10px] text-slate-500">{app.phone_number}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{app.branch_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                          {app.current_step}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        <div className="flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3 h-3 text-slate-650" />
                          <span>{new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(app.id)}
                            className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 rounded-lg transition-all border border-slate-750"
                            title="Inspect Onboarding Logs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteApplication(app.id)}
                              className="p-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-500/10"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Application Detailed View Pane */}
        {selectedApp && (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[85vh] sticky top-24">
            {/* Detail Pane Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm truncate max-w-[200px]">{selectedApp.customer_name}</h3>
                <span className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-semibold border mt-1 ${getStatusBadge(selectedApp.status)}`}>
                  {selectedApp.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-200 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Info grid */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Phone:</span>
                  <span className="text-slate-200 font-medium">{selectedApp.phone_number}</span>
                </div>
                {selectedApp.email && (
                  <div className="flex justify-between text-slate-400">
                    <span>Email:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[150px]">{selectedApp.email}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Branch:</span>
                  <span className="text-slate-200 font-medium">{selectedApp.branch_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Officer ID:</span>
                  <span className="text-slate-200 font-medium">{selectedApp.assigned_officer_id || 'Unassigned'}</span>
                </div>
              </div>

              {/* Progress Flow */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Onboarding Milestones</h4>
                <div className="flex items-center justify-between relative py-2">
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
                        nodeStyle = 'bg-red-650 text-white border-red-500 animate-pulse';
                      } else if (selectedApp.status === 'COMPLETED') {
                        nodeStyle = 'bg-emerald-600 text-white border-emerald-500';
                      } else {
                        nodeStyle = 'bg-indigo-600 text-white border-indigo-500 animate-pulse';
                      }
                    }

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10 group" title={step}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border ${nodeStyle}`}>
                          {idx + 1}
                        </div>
                        <span className="text-[8px] text-slate-500 font-medium mt-1 font-mono uppercase tracking-tighter">
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Log Event Form */}
              {canWrite && selectedApp.status === 'IN_PROGRESS' && (
                <div className="border border-indigo-500/10 bg-indigo-500/5 p-4 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Log Onboarding Step Event</span>
                  </div>

                  <form onSubmit={handleAddLog} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1">Step</label>
                        <select
                          value={logStep}
                          onChange={(e) => setLogStep(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px] appearance-none"
                        >
                          <option value="REGISTER" className="bg-slate-900">REGISTER</option>
                          <option value="PERSONAL_INFO" className="bg-slate-900">PERSONAL INFO</option>
                          <option value="KYC_UPLOAD" className="bg-slate-900">KYC UPLOAD</option>
                          <option value="SIGNATURE" className="bg-slate-900">SIGNATURE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status</label>
                        <select
                          value={logStatus}
                          onChange={(e) => setLogStatus(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px] appearance-none"
                        >
                          <option value="STARTED" className="bg-slate-900">STARTED</option>
                          <option value="COMPLETED" className="bg-slate-900">COMPLETED</option>
                          <option value="FAILED" className="bg-slate-900">FAILED</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1">Duration (sec)</label>
                        <input
                          type="number"
                          placeholder="e.g. 120"
                          value={logDuration}
                          onChange={(e) => setLogDuration(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px]"
                        />
                      </div>

                      {logStatus === 'FAILED' && (
                        <div>
                          <label className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1 text-red-455">Error Details</label>
                          <input
                            type="text"
                            placeholder="Glary document details..."
                            required
                            value={logErrorMsg}
                            onChange={(e) => setLogErrorMsg(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-red-950/10 border border-red-500/20 text-[11px] text-red-200 placeholder-red-700/80 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={logSubmitting}
                      className="w-full py-2 bg-indigo-650 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] transition-all"
                    >
                      {logSubmitting ? 'Recording event...' : 'Commit Event Log'}
                    </button>
                  </form>
                </div>
              )}

              {/* Log Feedbacks Form */}
              {canWrite && selectedApp.status === 'ABANDONED' && (
                <div className="border border-red-500/10 bg-red-550/5 p-4 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold">
                    <MessageSquare className="w-4 h-4" />
                    <span>Log Call Feedback (Follow-up)</span>
                  </div>

                  <form onSubmit={handleAddFeedback} className="space-y-3">
                    <div>
                      <label className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1">Feedback Category</label>
                      <select
                        value={fbCategory}
                        onChange={(e) => setFbCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px] appearance-none"
                      >
                        <option value="KYC_ISSUE" className="bg-slate-900">KYC Upload Failure</option>
                        <option value="UI_NAVIGATION" className="bg-slate-900">Interface Navigation</option>
                        <option value="PRICING" className="bg-slate-900">Pricing / Dues Rates</option>
                        <option value="NO_INTEREST" className="bg-slate-900">Lost Interest / Preference</option>
                        <option value="OTHER" className="bg-slate-900">Other reasons</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1">Follow-up Call Notes</label>
                      <textarea
                        rows={2}
                        value={fbNotes}
                        onChange={(e) => setFbNotes(e.target.value)}
                        placeholder="Detail notes regarding what customer reported..."
                        required
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={fbSubmitting}
                      className="w-full py-2 bg-red-650 hover:bg-red-500 text-white rounded-lg font-bold text-[10px] transition-all border border-red-550/10"
                    >
                      {fbSubmitting ? 'Recording notes...' : 'Record Call Logs'}
                    </button>
                  </form>
                </div>
              )}

              {/* Logs Timeline details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-350 uppercase tracking-wider text-[10px]">Timeline Events History</h4>
                {selectedApp.step_logs?.length === 0 ? (
                  <p className="text-slate-500 text-[10px] italic">No transaction timeline event log records logged.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedApp.step_logs.slice().reverse().map((log) => (
                      <div key={log.id} className="p-2.5 bg-slate-950/50 border border-slate-900 rounded-lg flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-200 font-mono text-[10px]">{log.step_name}</div>
                          <span className={`inline-block px-1 rounded text-[8px] font-bold uppercase mt-1 ${
                            log.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                            log.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                            'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {log.status}
                          </span>
                          {log.error_message && (
                            <div className="text-[9px] text-red-350 mt-1 flex items-start gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                              <span>{log.error_message}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right text-[9px] text-slate-500">
                          {log.duration_seconds && <div>{log.duration_seconds}s</div>}
                          <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedbacks History */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-350 uppercase tracking-wider text-[10px]">Customer Feedback Reports</h4>
                {selectedApp.feedbacks?.length === 0 ? (
                  <p className="text-slate-500 text-[10px] italic">No follow-up feedback notes logged.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedApp.feedbacks.map((fb) => (
                      <div key={fb.id} className="p-2.5 bg-slate-950/30 border border-slate-900 rounded-lg space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-750">
                            {fb.abandoned_reason_category}
                          </span>
                          <span className="text-[8px] text-slate-500">{new Date(fb.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[10.5px] italic">"{fb.notes}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Initialize Onboarding Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-slate-100">Add Customer Onboarding</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4 text-xs">
              <div>
                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyesh Patel"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  disabled={createSubmitting}
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Mobile Contact (+91)</label>
                <input
                  type="text"
                  required
                  placeholder="+91 9998887776"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  disabled={createSubmitting}
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  disabled={createSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Branch Name</label>
                  <select
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs appearance-none"
                    disabled={createSubmitting}
                  >
                    <option value="" className="bg-slate-900">Select Branch</option>
                    <option value="Mumbai West" className="bg-slate-900">Mumbai West</option>
                    <option value="Bandra Branch" className="bg-slate-900">Bandra Branch</option>
                    <option value="Worli Hub" className="bg-slate-900">Worli Hub</option>
                    <option value="Thane Regional" className="bg-slate-900">Thane Regional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Assign Officer</label>
                  {isAdmin ? (
                    <select
                      value={assignedOfficerId}
                      onChange={(e) => setAssignedOfficerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs appearance-none"
                      disabled={createSubmitting}
                    >
                      <option value="" className="bg-slate-900">Unassigned</option>
                      {officers.map(o => (
                        <option key={o.id} value={o.id} className="bg-slate-900">
                          {o.full_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-500 text-xs"
                      value={isOfficer ? `Me (${user.full_name})` : 'System Assigned'}
                      disabled
                    />
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-850 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 rounded-xl font-bold transition-all"
                  disabled={createSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10"
                >
                  {createSubmitting ? 'Creating...' : 'Initialize File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default ApplicationsManager;
