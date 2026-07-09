import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { 
  Search, Filter, ShieldAlert, Cpu, DollarSign, Calendar, MapPin, 
  CheckCircle, Edit3, ArrowRight, ChevronLeft, ChevronRight, BarChart3, Info
} from 'lucide-react';

const LoanRecoveryDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStrategy, setEditStrategy] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, queueRes] = await Promise.all([
        api.get('/loan-recovery/dashboard'),
        api.get('/loan-recovery/queue')
      ]);
      setDashboardData(dashRes.data);
      setQueue(queueRes.data);
      setError('');
    } catch (err) {
      console.error("Failed to load loan recovery data:", err);
      setError("Failed to fetch recovery metrics. Ensure backend server is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditStrategy(record.recovery_strategy);
    setEditNotes(record.notes || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      setIsSaving(true);
      const response = await api.put(`/loan-recovery/${editingRecord.id}`, {
        recovery_strategy: editStrategy,
        notes: editNotes
      });
      
      // Update queue locally
      setQueue(prev => prev.map(item => item.id === editingRecord.id ? response.data : item));
      
      // Refresh dashboard metrics
      const dashRes = await api.get('/loan-recovery/dashboard');
      setDashboardData(dashRes.data);
      
      setEditingRecord(null);
    } catch (err) {
      console.error("Failed to save strategy updates:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading Loan Recovery metrics and intelligence queue...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 glass-panel rounded-2xl border border-red-500/10 bg-red-500/5 text-center">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-200">Synchronization Error</h2>
        <p className="text-slate-400 text-xs mt-2 leading-relaxed">{error}</p>
        <button 
          onClick={fetchData} 
          className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-all border border-slate-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Derived columns / formats helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Filters logic
  const filteredQueue = queue.filter(item => {
    const matchesSearch = item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toString() === searchTerm.trim();
    
    const matchesStrategy = selectedStrategy === 'All' || item.recovery_strategy === selectedStrategy;
    
    // Risk evaluation matching predict logic
    const calculateRisk = (score, days) => {
      if (score >= 30.0 || days >= 90) return 'High';
      if (score >= 15.0 || days >= 45) return 'Medium';
      return 'Low';
    };
    const risk = calculateRisk(item.priority_score, item.days_overdue);
    const matchesRisk = selectedRisk === 'All' || risk === selectedRisk;

    return matchesSearch && matchesStrategy && matchesRisk;
  });

  // Pagination logic
  const totalItems = filteredQueue.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQueue.slice(indexOfFirstItem, indexOfLastItem);

  const getRiskStyle = (score, days) => {
    if (score >= 30.0 || days >= 90) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (score >= 15.0 || days >= 45) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  const getRiskLabel = (score, days) => {
    if (score >= 30.0 || days >= 90) return 'High';
    if (score >= 15.0 || days >= 45) return 'Medium';
    return 'Low';
  };

  const getStrategyStyle = (strategy) => {
    switch (strategy) {
      case 'Field Visit':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Priority Call':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Regular Call':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-indigo-400" />
            <span>Loan Recovery AI</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Machine Learning Prioritization Queue for overdue loans. Automated collection strategy prediction.
          </p>
        </div>
        <div className="relative z-10 flex gap-3 shrink-0">
          <Link 
            to="/recovery-predict"
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/15 flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            <span>Predict Strategy</span>
          </Link>
          <Link 
            to="/recovery-analytics"
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700/60 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics Dashboard</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { label: 'Average Priority Score', value: `${dashboardData.average_priority_score.toFixed(1)} / 100`, subtext: 'Weighted Risk Assessment', icon: Cpu, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Average Outstanding', value: formatCurrency(dashboardData.average_outstanding), subtext: 'Per Overdue Account', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Average Days Overdue', value: `${dashboardData.average_days_overdue.toFixed(0)} Days`, subtext: 'Avg Age of Delinquency', icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'High Risk Customers', value: dashboardData.high_risk_customers_count, subtext: 'Score >= 30 or Days >= 90', icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-800/80">
                <div className="space-y-1.5">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-black text-slate-100">{stat.value}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{stat.subtext}</p>
                </div>
                <div className={`p-3.5 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Queue Section */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Prioritized Recovery Queue</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">High-priority customer files requiring urgent contact.</p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by customer name or ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs focus:outline-none focus:border-indigo-500 text-slate-350 placeholder-slate-550 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-950/45 p-1 rounded-xl border border-slate-850">
              <select
                value={selectedStrategy}
                onChange={(e) => { setSelectedStrategy(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-350 text-[11px] font-semibold px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-950">All Strategies</option>
                <option value="SMS Reminder" className="bg-slate-950">SMS Reminder</option>
                <option value="Regular Call" className="bg-slate-950">Regular Call</option>
                <option value="Priority Call" className="bg-slate-950">Priority Call</option>
                <option value="Field Visit" className="bg-slate-950">Field Visit</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/45 p-1 rounded-xl border border-slate-850">
              <select
                value={selectedRisk}
                onChange={(e) => { setSelectedRisk(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-350 text-[11px] font-semibold px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-950">All Risks</option>
                <option value="High" className="bg-slate-950">High Risk</option>
                <option value="Medium" className="bg-slate-950">Medium Risk</option>
                <option value="Low" className="bg-slate-950">Low Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Datatable */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-slate-850/60 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-4">ID</th>
                <th className="pb-3">Customer Name</th>
                <th className="pb-3">Outstanding Amount</th>
                <th className="pb-3">Days Overdue</th>
                <th className="pb-3">Priority Score</th>
                <th className="pb-3">Risk Level</th>
                <th className="pb-3">Recommended Strategy</th>
                <th className="pb-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/30 text-slate-300 transition-colors">
                    <td className="py-3.5 pl-4 font-mono font-bold text-slate-500 text-[11px]">#{item.id}</td>
                    <td className="py-3.5 font-bold text-slate-200">{item.customer_name}</td>
                    <td className="py-3.5 font-semibold text-slate-300">{formatCurrency(item.outstanding_amount)}</td>
                    <td className="py-3.5 font-mono text-slate-400">{item.days_overdue} Days</td>
                    <td className="py-3.5">
                      <span className="font-mono font-extrabold text-indigo-400">{item.priority_score.toFixed(1)}</span>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskStyle(item.priority_score, item.days_overdue)}`}>
                        {getRiskLabel(item.priority_score, item.days_overdue)}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStrategyStyle(item.recovery_strategy)}`}>
                        {item.recovery_strategy}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <button 
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-transparent hover:border-slate-700/60 transition-all inline-flex items-center gap-1.5 text-[11px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Override</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 italic text-xs">
                    No matching loan recovery records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-850 pt-5">
            <span className="text-[10px] font-semibold text-slate-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} prioritized files
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-850 hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-300 px-2 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-850 hover:bg-slate-900 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Override Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-4 shadow-2xl bg-slate-900 relative">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">Override Recovery Strategy</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Customer: {editingRecord.customer_name} (ID: #{editingRecord.id})</p>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Assigned Strategy</label>
                <select
                  value={editStrategy}
                  onChange={(e) => setEditStrategy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 cursor-pointer"
                >
                  <option value="SMS Reminder">SMS Reminder</option>
                  <option value="Regular Call">Regular Call</option>
                  <option value="Priority Call">Priority Call</option>
                  <option value="Field Visit">Field Visit</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Action Remarks / Notes</label>
                <textarea
                  placeholder="Record interaction remarks or manual overrides..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows="4"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 placeholder-slate-600 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-900 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/15 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Apply Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default LoanRecoveryDashboard;
