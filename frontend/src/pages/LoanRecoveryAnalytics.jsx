import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { 
  BarChart3, ArrowLeft, ShieldAlert, Cpu, Award, LineChart, 
  FileSpreadsheet, MapPin, TrendingUp, Info, HelpCircle, CheckCircle 
} from 'lucide-react';

const LoanRecoveryAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/loan-recovery/analytics');
      setAnalyticsData(response.data);
      setError('');
    } catch (err) {
      console.error("Failed to load loan recovery analytics:", err);
      setError("Failed to fetch analytics datasets. Ensure backend server is online.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !analyticsData) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Compiling Loan Recovery distribution maps and business intelligence metrics...
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

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Helper to build a horizontal bar metric
  const renderDistributionBar = (label, count, total, barColor = 'from-blue-500 via-indigo-500 to-indigo-650') => {
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    return (
      <div key={label} className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-semibold">{label}</span>
          <span className="text-slate-350 font-mono font-bold">{count} <span className="text-slate-500 text-[10px]">({pct}%)</span></span>
        </div>
        <div className="w-full bg-slate-950 border border-slate-850 h-2.5 rounded-full overflow-hidden p-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${barColor}`}
            style={{ width: `${pct}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const getSum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0) || 1;

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return 'from-red-500 to-rose-600';
      case 'Medium': return 'from-amber-400 to-orange-500';
      default: return 'from-emerald-400 to-teal-500';
    }
  };

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex items-center justify-between border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Link 
            to="/recovery"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700/60 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              <span>Recovery Analytics</span>
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              Statistical distributions and strategy benchmarks derived from the active ML-evaluated collection list.
            </p>
          </div>
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Business Insights Row (Dataset-driven) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">AI Business Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.business_insights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-550/5 flex gap-3 text-xs leading-relaxed text-indigo-200">
                  <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Grid: Distributions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strategy Distribution */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <Cpu className="w-4.5 h-4.5 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Recovery Strategy Distribution</h2>
              </div>
              <div className="space-y-4">
                {Object.keys(analyticsData.strategy_counts).map(key => 
                  renderDistributionBar(key, analyticsData.strategy_counts[key], getSum(analyticsData.strategy_counts))
                )}
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <ShieldAlert className="w-4.5 h-4.5 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Risk Level Distribution</h2>
              </div>
              <div className="space-y-4">
                {Object.keys(analyticsData.risk_distribution).map(key => 
                  renderDistributionBar(key, analyticsData.risk_distribution[key], getSum(analyticsData.risk_distribution), getRiskColor(key))
                )}
              </div>
            </div>

            {/* Priority Score Distribution */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <BarChart3 className="w-4.5 h-4.5 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Priority Score Distribution</h2>
              </div>
              <div className="space-y-4">
                {Object.keys(analyticsData.priority_distribution).map(key => 
                  renderDistributionBar(key, analyticsData.priority_distribution[key], getSum(analyticsData.priority_distribution))
                )}
              </div>
            </div>

            {/* Credit Score Distribution */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <BarChart3 className="w-4.5 h-4.5 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Credit Score Distribution</h2>
              </div>
              <div className="space-y-4">
                {Object.keys(analyticsData.credit_score_distribution).map(key => 
                  renderDistributionBar(key, analyticsData.credit_score_distribution[key], getSum(analyticsData.credit_score_distribution))
                )}
              </div>
            </div>
          </div>

          {/* Grouped Averages Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <LineChart className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Indicators Averages by Recovery Strategy</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-850/60 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-4">Recovery Strategy</th>
                    <th className="pb-3">Average Outstanding Amount</th>
                    <th className="pb-3">Average Credit Score</th>
                    <th className="pb-3">Average Days Overdue</th>
                    <th className="pb-3 pr-4">Average Priority Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/40">
                  {analyticsData.averages_by_strategy.map((avg) => (
                    <tr key={avg.strategy} className="hover:bg-slate-900/30 text-slate-350 transition-colors">
                      <td className="py-3.5 pl-4 font-bold text-slate-200">{avg.strategy}</td>
                      <td className="py-3.5 font-semibold text-slate-300">{formatCurrency(avg.average_outstanding)}</td>
                      <td className="py-3.5 font-mono text-slate-400">{avg.average_credit_score.toFixed(0)}</td>
                      <td className="py-3.5 font-mono text-slate-450">{avg.average_days_overdue.toFixed(1)} Days</td>
                      <td className="py-3.5 pr-4">
                        <span className="font-mono font-extrabold text-indigo-400">{avg.average_priority_score.toFixed(1)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 10 High Priority Customers */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Top 10 High Priority Recovery Customers</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-850/60 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-4">ID</th>
                    <th className="pb-3">Customer Name</th>
                    <th className="pb-3">Outstanding Amount</th>
                    <th className="pb-3">Days Overdue</th>
                    <th className="pb-3">Priority Score</th>
                    <th className="pb-3 pr-4">Recommended Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/40">
                  {analyticsData.top_10_priority_customers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-900/30 text-slate-350 transition-colors">
                      <td className="py-3.5 pl-4 font-mono font-bold text-slate-500">#{cust.id}</td>
                      <td className="py-3.5 font-bold text-slate-200">{cust.customer_name}</td>
                      <td className="py-3.5 font-semibold text-slate-300">{formatCurrency(cust.outstanding_amount)}</td>
                      <td className="py-3.5 font-mono text-slate-400">{cust.days_overdue} Days</td>
                      <td className="py-3.5 font-extrabold text-indigo-400 font-mono">{cust.priority_score.toFixed(2)}</td>
                      <td className="py-3.5 pr-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                          {cust.recovery_strategy}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default LoanRecoveryAnalytics;
