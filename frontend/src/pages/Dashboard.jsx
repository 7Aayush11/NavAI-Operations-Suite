import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserCheck, Shield, Key, Settings, Cpu, LineChart, FileSpreadsheet, 
  MapPin, HelpCircle, ArrowUpRight, Zap, Info, Calendar, AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const renderSuperAdminDashboard = () => (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'System Active Node', value: 'Primary US-East', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Total Control Users', value: '4 Managed', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Integrations Online', value: '3 Active APIs', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Security Policy', value: 'Strict RBAC', icon: Key, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-panel p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-bold mt-1 text-slate-100">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-100">Super Admin Controls</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            As a Super Admin, you have unrestricted access to manage users, configure role-based access control policies, audit platform telemetry logs, and configure overall pipeline models.
          </p>
          <div className="pt-2 grid grid-cols-2 gap-3">
            <button className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/60 transition-all flex items-center justify-center gap-2">
              <span>Manage Users</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/60 transition-all flex items-center justify-center gap-2">
              <span>System Settings</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">Journey Pipeline Health</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            The machine learning drop-off prediction engine is functioning. Data flow ingested from mobile applications is tracking onboarding conversions at **48%**.
          </p>
          <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3 text-xs text-indigo-200">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <span>AI Recommendation engine indicates primary customer drop-offs are during the KYC validation state.</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBranchManagerDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Branch Conversion Rate', value: '48.2% Avg', icon: LineChart, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Pending Onboardings', value: '142 Applications', icon: UserCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Active Sales Officers', value: '18 Field Staff', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-panel p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-bold mt-1 text-slate-100">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-3 md:col-span-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <LineChart className="w-5 h-5" />
            <h2 className="text-base font-bold text-slate-100">Journey Analytics Hub</h2>
          </div>
          <p className="text-slate-400 text-sm">
            View regional performance analytics, drop-off hotspots, and officer route metrics. Build custom reporting pipelines for headquarters audits.
          </p>
          <div className="pt-2 flex gap-3">
            <button className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all">
              Launch Customer Journey
            </button>
            <button className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-all">
              Export Analytics
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Cpu className="w-5 h-5" />
            <h2 className="text-base font-bold text-slate-100">Regional AI Insights</h2>
          </div>
          <div className="space-y-3">
            {[
              'KYC photo upload times are causing 22% dropout in Sector 4.',
              'Allocate 2 extra agents to Zone C to counter drop-offs.'
            ].map((insight, idx) => (
              <div key={idx} className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                {insight}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperationsOfficerDashboard = () => (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">My Assigned Onboardings</h2>
          </div>
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
            Zone: North Branch
          </span>
        </div>
        
        {/* Placeholder list for assigned customers */}
        <div className="space-y-3">
          {[
            { name: 'Aditya K. Sharma', location: 'Worli, Mumbai', status: 'KYC Incomplete', date: 'Today' },
            { name: 'Priya R. Patel', location: 'Bandra West, Mumbai', status: 'Address Check Pending', date: 'Tomorrow' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-200">{item.name}</div>
                <div className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  <span>{item.location}</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/10 font-medium text-[10px]">
                  {item.status}
                </span>
                <div className="text-slate-500 flex items-center justify-end gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-2 flex gap-3">
          <button className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all">
            Update App Status
          </button>
          <button className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-all">
            Record Event Timeline
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalystDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">Drop-off Funnel Analysis</h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Updated 10m ago</span>
          </div>
          
          {/* Static visualization representation */}
          <div className="space-y-2.5">
            {[
              { step: '1. Register Account', pct: 100, drop: '0%' },
              { step: '2. Basic Info Form', pct: 82, drop: '18% drop' },
              { step: '3. Digital KYC Validation', pct: 54, drop: '28% drop' },
              { step: '4. Signature & Agreement', pct: 48, drop: '6% drop' }
            ].map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">{step.step}</span>
                  <span className="text-slate-400">{step.pct}% ({step.drop})</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: `${step.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-100">Data Exporter</h2>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Export high-fidelity funnel matrices, sales officer journey statistics, and drop-off analytics logs in CSV or Excel format.
            </p>
          </div>
          <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all">
            Download Onboarding Logs
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Dashboard Header Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Welcome Back, {user.full_name}
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Here is your node intelligence feed for today. Operations monitoring is configured for your role permissions.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3 relative z-10">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-850">
            System Node: Active
          </span>
        </div>
      </div>

      {/* Dashboard Routing Render based on role name */}
      {user.role?.name === 'Super Admin' && renderSuperAdminDashboard()}
      {user.role?.name === 'Branch Manager' && renderBranchManagerDashboard()}
      {user.role?.name === 'Operations Officer' && renderOperationsOfficerDashboard()}
      {user.role?.name === 'Analyst' && renderAnalystDashboard()}
    </main>
  );
};

export default Dashboard;
