import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Sidebar from './layouts/Sidebar';
import Navbar from './layouts/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// New specialized page imports
import UserDirectory from './pages/UserDirectory';
import CustomerJourney from './pages/CustomerJourney';
import FunnelAnalytics from './pages/FunnelAnalytics';
import AIInsights from './pages/AIInsights';
import ReportsExport from './pages/ReportsExport';
import ApplicationsManager from './pages/ApplicationsManager';
import RecordEvents from './pages/RecordEvents';
import Settings from './pages/Settings';

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Switch>
        {/* Public Login & Denied Routes */}
        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/unauthorized" component={Unauthorized} />

        {/* Protected App Routes Layout */}
        <Route
          render={({ location }) => {
            // If the user is not authenticated and attempts to access protected layout routes,
            // the ProtectedRoute inside the Switch will handle redirecting to /login.
            return (
              <div className="flex min-h-screen bg-slate-950 text-slate-100">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <Navbar />
                  <div className="flex-1 overflow-y-auto">
                    <Switch>
                      <Redirect exact from="/" to="/dashboard" />
                      <ProtectedRoute exact path="/dashboard" component={Dashboard} />
                      
                      {/* Mount specialized views */}
                      <ProtectedRoute exact path="/users" component={UserDirectory} roles={['Super Admin']} />
                      <ProtectedRoute exact path="/settings" component={Settings} roles={['Super Admin']} />
                      <ProtectedRoute exact path="/journey" component={CustomerJourney} roles={['Super Admin', 'Branch Manager', 'Analyst']} />
                      <ProtectedRoute exact path="/funnel" component={FunnelAnalytics} roles={['Super Admin', 'Branch Manager', 'Analyst']} />
                      <ProtectedRoute exact path="/ai-insights" component={AIInsights} roles={['Super Admin', 'Branch Manager', 'Analyst']} />
                      <ProtectedRoute exact path="/reports" component={ReportsExport} roles={['Super Admin', 'Branch Manager', 'Analyst']} />
                      <ProtectedRoute exact path="/applications" component={ApplicationsManager} roles={['Super Admin', 'Operations Officer']} />
                      <ProtectedRoute exact path="/events" component={RecordEvents} roles={['Super Admin', 'Operations Officer']} />
                      
                      <Route component={NotFound} />
                    </Switch>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </Switch>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;