import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from 'react-router-dom'
import ProtectedRoute from '@/routes/PrivateRoute'
import ErrorBoundary from '@/components/feedback/ErrorBoundary'
import RouteErrorPage from '@/components/feedback/RouteErrorPage'
import { PageSkeleton } from '@/components/feedback/Skeleton'

// Pages load on demand so the first paint only needs the app shell
const AdditionalNotesPage = lazy(() => import('@/pages/patient/AdditionalNotesPage'))
const AiQuestionsPage = lazy(() => import('@/pages/patient/AiQuestionsPage'))
const CreatePrescriptionPage = lazy(() => import('@/pages/doctor/CreatePrescriptionPage'))
const DoctorCalendarPage = lazy(() => import('@/pages/doctor/DoctorCalendarPage'))
const DoctorConsultationPage = lazy(() => import('@/pages/doctor/DoctorConsultationPage'))
const DoctorDashboardPage = lazy(() => import('@/pages/doctor/DoctorDashboardPage'))
const DoctorPatientsPage = lazy(() => import('@/pages/doctor/DoctorPatientsPage'))
const DoctorProfilePage = lazy(() => import('@/pages/doctor/DoctorProfilePage'))
const EditPrescriptionPage = lazy(() => import('@/pages/doctor/EditPrescriptionPage'))
const FollowUpPage = lazy(() => import('@/pages/patient/FollowUpPage'))
const HistoryPage = lazy(() => import('@/pages/patient/HistoryPage'))
const HomePage = lazy(() => import('@/pages/patient/HomePage'))
const LanguagePage = lazy(() => import('@/pages/auth/LanguagePage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const MedicalHistoryPage = lazy(() => import('@/pages/patient/MedicalHistoryPage'))
const MoreQuestionsPage = lazy(() => import('@/pages/patient/MoreQuestionsPage'))
const OtpPage = lazy(() => import('@/pages/auth/OtpPage'))
const PatientPrescriptionPage = lazy(() => import('@/pages/patient/PatientPrescriptionPage'))
const PatientProfilePage = lazy(() => import('@/pages/patient/PatientProfilePage'))
const PdfSharePage = lazy(() => import('@/pages/patient/PdfSharePage'))
const PrescriptionApprovedPage = lazy(() => import('@/pages/doctor/PrescriptionApprovedPage'))
const SummaryPage = lazy(() => import('@/pages/patient/SummaryPage'))
const SubmissionSuccessPage = lazy(() => import('@/pages/patient/SubmissionSuccessPage'))
const SymptomsPage = lazy(() => import('@/pages/patient/SymptomsPage'))
const WelcomePage = lazy(() => import('@/pages/auth/WelcomePage'))
const EmergencyPage = lazy(() => import('@/pages/patient/EmergencyPage'))
const FindDoctorPage = lazy(() => import('@/pages/patient/FindDoctorPage'))
const HealthTipsPage = lazy(() => import('@/pages/patient/HealthTipsPage'))
const SupportPage = lazy(() => import('@/pages/patient/SupportPage'))
const SupportInboxPage = lazy(() => import('@/pages/staff/SupportInboxPage'))
const AuthPage = lazy(() => import('@/pages/auth/authFlow').then((m) => ({ default: m.AuthPage })))
const DoctorRegistrationPage = lazy(() => import('@/pages/auth/authFlow').then((m) => ({ default: m.DoctorRegistrationPage })))
const NotificationsPage = lazy(() => import('@/pages/auth/authFlow').then((m) => ({ default: m.NotificationsPage })))
const PatientMyProfilePage = lazy(() => import('@/pages/auth/authFlow').then((m) => ({ default: m.PatientMyProfilePage })))
const PatientRegistrationPage = lazy(() => import('@/pages/auth/authFlow').then((m) => ({ default: m.PatientRegistrationPage })))
const RoleSelectionPage = lazy(() => import('@/pages/auth/authFlow').then((m) => ({ default: m.RoleSelectionPage })))

/** Shared parent for every route: lazy-chunk fallback + router-level error screen */
const RootLayout = () => (
  <Suspense fallback={<PageSkeleton />}>
    <Outlet />
  </Suspense>
)

const routes: RouteObject[] = [
  { path: '/', element: <LanguagePage /> },
  { path: '/welcome', element: <WelcomePage /> },
  // Public on purpose: emergency numbers must work without a session
  { path: '/emergency', element: <EmergencyPage /> },
  { path: '/role-selection', element: <RoleSelectionPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/auth', element: <AuthPage /> },
  { path: '/otp', element: <OtpPage /> },
  {
    path: '/patient-register',
    element: (
      <ErrorBoundary title="Registration could not load">
        <PatientRegistrationPage />
      </ErrorBoundary>
    ),
  },
  {
    path: '/doctor-register',
    element: (
      <ErrorBoundary title="Registration could not load">
        <DoctorRegistrationPage />
      </ErrorBoundary>
    ),
  },
  { path: '/doctor-login', element: <Navigate to="/auth" replace /> },
  { path: '/doctor-otp', element: <Navigate to="/otp" replace /> },
  { path: '/register', element: <Navigate to="/auth?tab=register" replace /> },
  { path: '/doctor-profile-setup', element: <Navigate to="/doctor-register" replace /> },
  {
    path: '/my-profile',
    element: (
      <ProtectedRoute patientOnly>
        <PatientMyProfilePage />
      </ProtectedRoute>
    ),
  },
  { path: '/profile', element: <Navigate to="/my-profile" replace /> },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute patientOnly>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/medical-history',
    element: (
      <ProtectedRoute patientOnly>
        <MedicalHistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute patientOnly>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/symptoms',
    element: (
      <ProtectedRoute patientOnly>
        <SymptomsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/ai-questions',
    element: (
      <ProtectedRoute patientOnly>
        <AiQuestionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/more-questions',
    element: (
      <ProtectedRoute patientOnly>
        <MoreQuestionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/additional-notes',
    element: (
      <ProtectedRoute patientOnly>
        <AdditionalNotesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/summary',
    element: (
      <ProtectedRoute patientOnly>
        <SummaryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/submission-success',
    element: (
      <ProtectedRoute patientOnly>
        <SubmissionSuccessPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctor-dashboard',
    element: (
      <ProtectedRoute role="DOCTOR">
        <DoctorDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctor-notifications',
    element: (
      <ProtectedRoute role="DOCTOR">
        <NotificationsPage role="DOCTOR" />
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctor-patients',
    element: (
      <ProtectedRoute role="DOCTOR">
        <DoctorPatientsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctor-calendar',
    element: (
      <ProtectedRoute role="DOCTOR">
        <DoctorCalendarPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctor-profile',
    element: (
      <ProtectedRoute role="DOCTOR">
        <DoctorProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctor-consultation/:id',
    element: (
      <ProtectedRoute role="DOCTOR">
        <DoctorConsultationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/create-prescription/:id',
    element: (
      <ProtectedRoute role="DOCTOR">
        <CreatePrescriptionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/edit-prescription/:id',
    element: (
      <ProtectedRoute role="DOCTOR">
        <EditPrescriptionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/prescription-approved',
    element: (
      <ProtectedRoute role="DOCTOR">
        <PrescriptionApprovedPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/my-prescription/:prescriptionId?',
    element: (
      <ProtectedRoute patientOnly>
        <PatientPrescriptionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pdf-share',
    element: (
      <ProtectedRoute>
        <PdfSharePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/follow-up',
    element: (
      <ProtectedRoute patientOnly>
        <FollowUpPage />
      </ProtectedRoute>
    ),
  },
  { path: '/health-tips', element: <HealthTipsPage /> },
  { path: '/support', element: <SupportPage /> },
  {
    // Staff = accounts listed in the backend's SUPPORT_STAFF_EMAILS; the page shows a notice to everyone else
    path: '/staff/support',
    element: (
      <ProtectedRoute>
        <SupportInboxPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/find-doctor',
    element: (
      <ProtectedRoute patientOnly>
        <FindDoctorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/history',
    element: (
      <ProtectedRoute patientOnly>
        <HistoryPage />
      </ProtectedRoute>
    ),
  },
]

export const router = createBrowserRouter([
  { element: <RootLayout />, errorElement: <RouteErrorPage />, children: routes },
])

