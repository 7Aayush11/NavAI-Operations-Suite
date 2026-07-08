import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { FileText, Download, AlertCircle, FileSpreadsheet, CheckCircle } from 'lucide-react';

const ReportsExport = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState('');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/applications');
        setApplications(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch data for export.');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const getFilteredApps = () => {
    return applications.filter(app => {
      const matchStatus = !statusFilter || app.status === statusFilter;
      const matchBranch = !branchFilter || app.branch_name === branchFilter;
      return matchStatus && matchBranch;
    });
  };

  const triggerDownload = (csvContent, fileName) => {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(`Successfully downloaded: ${fileName}`);
      setTimeout(() => setDownloadSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to generate file download.');
    }
  };

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Export 1: Applications list
  const handleExportApplications = () => {
    const targets = getFilteredApps();
    if (targets.length === 0) {
      alert('No records match selected filters.');
      return;
    }

    const headers = ['Application ID', 'Customer Name', 'Phone Number', 'Email', 'Branch Name', 'Current Step', 'Status', 'Abandoned Reason', 'Created At'];
    const rows = targets.map(app => [
      app.id,
      escapeCsv(app.customer_name),
      escapeCsv(app.phone_number),
      escapeCsv(app.email),
      escapeCsv(app.branch_name),
      escapeCsv(app.current_step),
      escapeCsv(app.status),
      escapeCsv(app.abandoned_reason),
      app.created_at
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    triggerDownload(csvContent, `applications_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Export 2: Step Timeline Logs
  const handleExportLogs = () => {
    const targets = getFilteredApps();
    const rows = [];
    targets.forEach(app => {
      if (app.step_logs) {
        app.step_logs.forEach(log => {
          rows.push([
            app.id,
            escapeCsv(app.customer_name),
            escapeCsv(app.branch_name),
            escapeCsv(log.step_name),
            escapeCsv(log.status),
            log.duration_seconds || '',
            escapeCsv(log.error_message),
            log.timestamp
          ]);
        });
      }
    });

    if (rows.length === 0) {
      alert('No timeline log records found matching filters.');
      return;
    }

    const headers = ['Application ID', 'Customer Name', 'Branch Name', 'Step Name', 'Step Status', 'Duration (seconds)', 'Error Message', 'Timestamp'];
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    triggerDownload(csvContent, `journey_step_logs_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Export 3: Customer Call Feedbacks
  const handleExportFeedbacks = () => {
    const targets = getFilteredApps();
    const rows = [];
    targets.forEach(app => {
      if (app.feedbacks) {
        app.feedbacks.forEach(fb => {
          rows.push([
            app.id,
            escapeCsv(app.customer_name),
            escapeCsv(app.branch_name),
            escapeCsv(fb.abandoned_reason_category),
            escapeCsv(fb.notes),
            fb.recorded_by,
            fb.timestamp
          ]);
        });
      }
    });

    if (rows.length === 0) {
      alert('No feedback entries found matching filters.');
      return;
    }

    const headers = ['Application ID', 'Customer Name', 'Branch Name', 'Category', 'Auditing Notes', 'Recorded By (Officer ID)', 'Timestamp'];
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    triggerDownload(csvContent, `customer_feedbacks_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const filteredAppsCount = getFilteredApps().length;

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-400" />
            <span>Reports & Exports</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Generate and export custom spreadsheets containing operations telemetry datasets for compliance audits and performance reviews.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-xs">
          {error}
        </div>
      )}

      {downloadSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-250 text-xs">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Main Exporter Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
          <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Configure Dataset Export</h2>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-2">
              Filter by Funnel Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg glass-input text-xs appearance-none"
              disabled={loading}
            >
              <option value="" className="bg-slate-900">All Funnel Statuses</option>
              <option value="IN_PROGRESS" className="bg-slate-900">In Progress</option>
              <option value="COMPLETED" className="bg-slate-900">Completed (Converted)</option>
              <option value="ABANDONED" className="bg-slate-900">Abandoned (Drop-off)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-2">
              Filter by Branch Name
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg glass-input text-xs appearance-none"
              disabled={loading}
            >
              <option value="" className="bg-slate-900">All Regional Branches</option>
              <option value="Mumbai West" className="bg-slate-900">Mumbai West</option>
              <option value="Bandra Branch" className="bg-slate-900">Bandra Branch</option>
              <option value="Worli Hub" className="bg-slate-900">Worli Hub</option>
              <option value="Thane Regional" className="bg-slate-900">Thane Regional</option>
            </select>
          </div>
        </div>

        {/* Export triggers */}
        <div className="border-t border-slate-850 pt-6 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Filtered Dataset Size:</span>
            <span className="font-bold text-slate-200 bg-slate-900 px-3 py-1 rounded border border-slate-850">
              {filteredAppsCount} Applications
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={handleExportApplications}
              disabled={loading || filteredAppsCount === 0}
              className="py-3 px-4 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Export Applications</span>
            </button>

            <button
              onClick={handleExportLogs}
              disabled={loading || filteredAppsCount === 0}
              className="py-3 px-4 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export Stage Logs</span>
            </button>

            <button
              onClick={handleExportFeedbacks}
              disabled={loading || filteredAppsCount === 0}
              className="py-3 px-4 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-red-400" />
              <span>Export Call Feedbacks</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl flex gap-3 text-[10px] text-slate-500 leading-relaxed">
          <AlertCircle className="w-5.5 h-5.5 text-slate-600 shrink-0 mt-0.5" />
          <span>
            Note: Exported CSV reports use standard character sets (`UTF-8`). You can load these CSV tables directly into spreadsheets like Microsoft Excel, Google Sheets, or python pandas scripts.
          </span>
        </div>
      </div>
    </main>
  );
};

export default ReportsExport;
