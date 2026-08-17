import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import FeaturesPage from './pages/public/FeaturesPage';
import PricingPage from './pages/public/PricingPage';
import TutorialsPage from './pages/public/TutorialsPage';
import AboutPage from './pages/public/AboutPage';
import DownloadPage from './pages/public/DownloadPage';
import FeedbackPage from './pages/public/FeedbackPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import GoogleCallbackPage from './pages/public/GoogleCallbackPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import { savePendingIntent } from './utils/pendingIntent';

// Customer Pages
import AccountDashboardPage from './pages/customer/AccountDashboardPage';
import LicensesPage from './pages/customer/LicensesPage';
import OrdersPage from './pages/customer/OrdersPage';
import ProfilePage from './pages/customer/ProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminLicensesPage from './pages/admin/AdminLicensesPage';
import AdminRevenuePage from './pages/admin/AdminRevenuePage';
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import AdminReleasesPage from './pages/admin/AdminReleasesPage';

// Protected Route Wrapper
const ProtectedCustomerRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, isProfileLoading, user } = useAuthStore();

  if (!isAuthenticated && !localStorage.getItem('bimautomation_token')) {
    return <Navigate to="/login" replace />;
  }

  // Wait for the profile (and its role) to load before deciding access,
  // otherwise a legitimate admin gets bounced on a hard refresh.
  if (isProfileLoading) {
    return null;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const ProtectedDownloadRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    savePendingIntent({ type: 'download', returnTo: '/download' });
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  const { fetchProfile } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <Routes>
      {/* Public Site Layout & Pages */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="tutorials" element={<TutorialsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="download" element={<ProtectedDownloadRoute><DownloadPage /></ProtectedDownloadRoute>} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Customer Account Portal */}
      <Route
        path="/account"
        element={
          <ProtectedCustomerRoute>
            <CustomerLayout />
          </ProtectedCustomerRoute>
        }
      >
        <Route index element={<AccountDashboardPage />} />
        <Route path="licenses" element={<LicensesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Operations Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="licenses" element={<AdminLicensesPage />} />
        <Route path="revenue" element={<AdminRevenuePage />} />
        <Route path="feedback" element={<AdminFeedbackPage />} />
        <Route path="releases" element={<AdminReleasesPage />} />
      </Route>

      {/* Catch-all redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
