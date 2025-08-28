
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { SubdomainRouter } from '@/components/SubdomainRouter';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import SignUp from '@/pages/SignUp';
import OAuthCallback from '@/pages/OAuthCallback';
import AdminDashboard from '@/pages/AdminDashboard';
import SubcontractorManagement from '@/pages/SubcontractorManagement';
import CustomerPortalDashboard from '@/pages/CustomerPortalDashboard';
import SubcontractorDashboard from '@/pages/SubcontractorDashboard';
import OfficeManagerDashboard from '@/pages/OfficeManagerDashboard';
import BookingPage from '@/pages/BookingPage';
import JobAssignments from '@/pages/JobAssignments';

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/customer-portal-dashboard" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <SubdomainRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subcontractor-management" 
                element={
                  <ProtectedRoute requireAdmin>
                    <SubcontractorManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customer-portal-dashboard" 
                element={
                  <ProtectedRoute>
                    <CustomerPortalDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subcontractor-dashboard" 
                element={
                  <ProtectedRoute>
                    <SubcontractorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/office-manager-dashboard" 
                element={
                  <ProtectedRoute>
                    <OfficeManagerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/booking" element={<BookingPage />} />
              <Route 
                path="/job-assignments" 
                element={
                  <ProtectedRoute requireAdmin>
                    <JobAssignments />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </SubdomainRouter>
        </Router>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
