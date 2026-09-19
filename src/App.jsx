import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { SchemesProvider } from './contexts/SchemesContext';
import { PricingProvider } from './contexts/PricingContext';
import BottomNav from './components/layout/BottomNav';

// Pages
import LanguageSelect from './pages/onboarding/LanguageSelect';
import RoleSelect from './pages/auth/RoleSelect';
import { UserLogin, UserRegister, WorkerLogin, WorkerRegister, AdminLogin } from './pages/auth/AuthForms';
import UserHome from './pages/user/UserHome';
import ServiceRequest from './pages/user/ServiceRequest';
import AIChatRequest from './pages/user/AIChatRequest';
import {
  WorkerMatching, WorkerProfileView, ConfirmBooking,
  UserBookings, BookingDetail, InvoicePage, PaymentPage,
  RateService, UserProfile, UserSettings
} from './pages/user/UserPages';
import {
  WorkerHome, IncomingRequests, RequestDetail, ActiveJob, WorkerJobs,
  MaterialsEntry, TravelCostPage, WorkerInvoice, WorkerEarnings,
  WorkerWelfare, WorkerAvailability, WorkerServiceArea,
  WorkerProfile, WorkerSettings
} from './pages/worker/WorkerPages';
import WorkerSchemes from './pages/worker/WorkerSchemes';
import WorkerSchemeDetail from './pages/worker/WorkerSchemeDetail';

// Admin Module
import AdminLayout from './admin/components/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import Workers from './admin/pages/Workers';
import Verification from './admin/pages/Verification';
import Certifications from './admin/pages/Certifications';
import Services from './admin/pages/Services';
import AdminBookings from './admin/pages/Bookings';
import Pricing from './admin/pages/Pricing';
import TravelCost from './admin/pages/TravelCost';
import Payments from './admin/pages/Payments';
import AdminWelfare from './admin/pages/Welfare';
import Insurance from './admin/pages/Insurance';
import GovernmentSchemes from './admin/pages/GovernmentSchemes';
import GovernmentSchemeForm from './admin/pages/GovernmentSchemeForm';
import GovernmentSchemeDetail from './admin/pages/GovernmentSchemeDetail';
import GovernmentSchemeApplications from './admin/pages/GovernmentSchemeApplications';
import TrainingPrograms from './admin/pages/TrainingPrograms';
import WorkforceAnalytics from './admin/pages/WorkforceAnalytics';
import GovernmentRequirements from './admin/pages/GovernmentRequirements';
import Support from './admin/pages/Support';
import AuditLogs from './admin/pages/AuditLogs';
import WorkerPriceProposal from './pages/worker/WorkerPriceProposal';

function UserLayout() {
  return (
    <>
      <Outlet />
      <BottomNav role="user" />
    </>
  );
}

function WorkerLayout() {
  return (
    <>
      <Outlet />
      <BottomNav role="worker" />
    </>
  );
}

function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: userRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (role && userRole !== role) return <Navigate to={`/${userRole}/home`} replace />;
  return children || <Outlet />;
}

function LanguageGate({ children }) {
  const { language } = useLanguage();
  if (!language) return <Navigate to="/" replace />;
  return children || <Outlet />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BookingProvider>
            <SchemesProvider>
            <PricingProvider>
             <BrowserRouter>
              <Routes>
                {/* Onboarding */}
                <Route path="/" element={<LanguageSelect />} />

                {/* Auth */}
                <Route element={<LanguageGate />}>
                  <Route path="/auth" element={<RoleSelect />} />
                  <Route path="/auth/user/login" element={<UserLogin />} />
                  <Route path="/auth/user/register" element={<UserRegister />} />
                  <Route path="/auth/worker/login" element={<WorkerLogin />} />
                  <Route path="/auth/worker/register" element={<WorkerRegister />} />
                  <Route path="/auth/admin/login" element={<AdminLogin />} />
                </Route>

                {/* User routes */}
                <Route element={<ProtectedRoute role="user" />}>
                  <Route element={<UserLayout />}>
                    <Route path="/user/home" element={<UserHome />} />
                    <Route path="/user/bookings" element={<UserBookings />} />
                    <Route path="/user/profile" element={<UserProfile />} />
                  </Route>
                  {/* Full screen user routes (no bottom nav) */}
                  <Route path="/user/request/new" element={<ServiceRequest />} />
                  <Route path="/user/request/ai" element={<AIChatRequest />} />
                  <Route path="/user/matching" element={<WorkerMatching />} />
                  <Route path="/user/worker/:id" element={<WorkerProfileView />} />
                  <Route path="/user/confirm-booking" element={<ConfirmBooking />} />
                  <Route path="/user/bookings/:id" element={<BookingDetail />} />
                  <Route path="/user/invoice/:id" element={<InvoicePage />} />
                  <Route path="/user/payment/:id" element={<PaymentPage />} />
                  <Route path="/user/rate/:id" element={<RateService />} />
                  <Route path="/user/settings" element={<UserSettings />} />
                </Route>

                {/* Worker routes */}
                <Route element={<ProtectedRoute role="worker" />}>
                  <Route element={<WorkerLayout />}>
                    <Route path="/worker/home" element={<WorkerHome />} />
                    <Route path="/worker/requests" element={<IncomingRequests />} />
                    <Route path="/worker/jobs" element={<WorkerJobs />} />
                    <Route path="/worker/earnings" element={<WorkerEarnings />} />
                    <Route path="/worker/profile" element={<WorkerProfile />} />
                  </Route>
                  {/* Full screen worker routes */}
                  <Route path="/worker/requests/:id" element={<RequestDetail />} />
                  <Route path="/worker/jobs/:id" element={<ActiveJob />} />
                  <Route path="/worker/materials/:id" element={<MaterialsEntry />} />
                  <Route path="/worker/travel/:id" element={<TravelCostPage />} />
                  <Route path="/worker/invoice/:id" element={<WorkerInvoice />} />
                  <Route path="/worker/welfare" element={<WorkerWelfare />} />
                  <Route path="/worker/availability" element={<WorkerAvailability />} />
                  <Route path="/worker/service-area" element={<WorkerServiceArea />} />
                  <Route path="/worker/settings" element={<WorkerSettings />} />
                  {/* Government Schemes */}
                  <Route path="/worker/schemes" element={<WorkerSchemes />} />
                  <Route path="/worker/schemes/:id" element={<WorkerSchemeDetail />} />
                  {/* Pricing Participation */}
                  <Route path="/worker/pricing" element={<WorkerPriceProposal />} />
                </Route>

                {/* Admin routes */}
                <Route element={<ProtectedRoute role="admin" />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    {/* Workers */}
                    <Route path="/admin/workers" element={<Workers />} />
                    <Route path="/admin/verification" element={<Verification />} />
                    <Route path="/admin/certifications" element={<Certifications />} />
                    {/* Operations */}
                    <Route path="/admin/services" element={<Services />} />
                    <Route path="/admin/bookings" element={<AdminBookings />} />
                    <Route path="/admin/pricing" element={<Pricing />} />
                    <Route path="/admin/travel-cost" element={<TravelCost />} />
                    {/* Finance */}
                    <Route path="/admin/payments" element={<Payments />} />
                    <Route path="/admin/welfare" element={<AdminWelfare />} />
                    <Route path="/admin/insurance" element={<Insurance />} />
                    {/* Programs */}
                    <Route path="/admin/schemes" element={<GovernmentSchemes />} />
                    <Route path="/admin/schemes/new" element={<GovernmentSchemeForm />} />
                    <Route path="/admin/schemes/:id" element={<GovernmentSchemeDetail />} />
                    <Route path="/admin/schemes/:id/edit" element={<GovernmentSchemeForm />} />
                    <Route path="/admin/applications" element={<GovernmentSchemeApplications />} />
                    <Route path="/admin/training" element={<TrainingPrograms />} />
                    {/* System */}
                    <Route path="/admin/analytics" element={<WorkforceAnalytics />} />
                    <Route path="/admin/requirements" element={<GovernmentRequirements />} />
                    <Route path="/admin/support" element={<Support />} />
                    <Route path="/admin/audit-logs" element={<AuditLogs />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
             </BrowserRouter>
            </PricingProvider>
            </SchemesProvider>
          </BookingProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
