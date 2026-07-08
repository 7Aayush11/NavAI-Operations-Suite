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
                      
                      {/* Placeholders for subsequent Phase views */}
                      <ProtectedRoute exact path="/users" component={Dashboard} roles={['Super Admin']} />
                      <ProtectedRoute exact path="/settings" component={Dashboard} roles={['Super Admin']} />
                      <ProtectedRoute exact path="/journey" component={Dashboard} roles={['Super Admin', 'Branch Manager', 'Analyst']} />
                      <ProtectedRoute exact path="/funnel" component={Dashboard} roles={['Super Admin', 'Branch Manager', 'Analyst']} />
                      <ProtectedRoute exact path="/ai-insights" component={Dashboard} roles={['Super Admin', 'Branch Manager', 'Analyst']} />
                      <ProtectedRoute exact path="/reports" component={Dashboard} roles={['Super Admin', 'Branch Manager', 'Analyst']} />
                      <ProtectedRoute exact path="/applications" component={Dashboard} roles={['Super Admin', 'Operations Officer']} />
                      <ProtectedRoute exact path="/events" component={Dashboard} roles={['Super Admin', 'Operations Officer']} />
                      
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