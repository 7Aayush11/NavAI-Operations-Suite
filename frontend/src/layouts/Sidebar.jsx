import React from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, ShieldAlert, Settings, 
  BarChart3, Compass, FileText, Map, UserCheck, 
  ChevronRight, LogOut, Cpu, Activity
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const history = useHistory();

  // If user is not logged in, do not render sidebar
  if (!user) return null;

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  // Define navigation based on roles
  const menuItems = [
    {
      title: 'Global Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Super Admin', 'Branch Manager', 'Operations Officer', 'Analyst']
    },
    // Super Admin Views
    {
      title: 'User Directory',
      path: '/users',
      icon: Users,
      roles: ['Super Admin']
    },
    {
      title: 'System Settings',
      path: '/settings',
      icon: Settings,
      roles: ['Super Admin']
    },
    // Branch Manager & Analyst Views
    {
      title: 'Customer Journey',
      path: '/journey',
      icon: Compass,
      roles: ['Super Admin', 'Branch Manager', 'Analyst']
    },
    {
      title: 'Funnel Analytics',
      path: '/funnel',
      icon: BarChart3,
      roles: ['Super Admin', 'Branch Manager', 'Analyst']
    },
    {
      title: 'AI Recommendations',
      path: '/ai-insights',
      icon: Cpu,
      roles: ['Super Admin', 'Branch Manager', 'Analyst']
    },
    {
      title: 'Reports Export',
      path: '/reports',
      icon: FileText,
      roles: ['Super Admin', 'Branch Manager', 'Analyst']
    },
    // Operations Officer Views
    {
      title: 'My Applications',
      path: '/applications',
      icon: UserCheck,
      roles: ['Super Admin', 'Operations Officer']
    },
    {
      title: 'Record Events',
      path: '/events',
      icon: Activity,
      roles: ['Super Admin', 'Operations Officer']
    }
  ];

  const filteredMenu = menuItems.filter(item => hasRole(item.roles));

  // Role Badge Styling Helper
  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'Super Admin':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Branch Manager':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Operations Officer':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Analyst':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div className="flex flex-col overflow-y-auto">
        {/* Sidebar Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-100 tracking-wide">NavAI Suite</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Ops Portal</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">
            Menu Navigation
          </div>
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform duration-150 group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                  }`} />
                  <span>{item.title}</span>
                </div>
                <ChevronRight className={`w-4 h-4 opacity-0 transition-all duration-150 ${
                  isActive ? 'opacity-100' : 'group-hover:opacity-40 group-hover:translate-x-0.5'
                }`} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session Profile Card & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shadow-inner">
            {user.full_name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-slate-200 truncate">{user.full_name}</div>
            <div className="text-[10px] truncate text-slate-500 mb-1">{user.email}</div>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getRoleBadgeStyle(user.role?.name)}`}>
              {user.role?.name}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-2 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-xl border border-transparent hover:border-red-500/10 text-sm font-semibold transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
