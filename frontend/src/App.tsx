import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { RegisterPage } from './pages/auth/RegisterPage'
import { MasjidLoginPage } from './pages/auth/MasjidLoginPage'
import { FindWorkspacePage } from './pages/auth/FindWorkspacePage'
import { PublicMasjidPage } from './pages/public/PublicMasjidPage'
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardHome } from './pages/dashboard/DashboardHome'
import { HouseholdsPage } from './pages/dashboard/households/HouseholdsPage'
import { HouseholdFormPage } from './pages/dashboard/households/HouseholdFormPage'
import { HouseholdDetailPage } from './pages/dashboard/households/HouseholdDetailPage'
import { AnnouncementsPage } from './pages/dashboard/announcements/AnnouncementsPage'
import RemindersPage from './pages/dashboard/reminders/RemindersPage'
import { FinancePage } from './pages/dashboard/finance/FinancePage'
import { TransactionsPage } from './pages/dashboard/finance/TransactionsPage'
import { VoucherDetailPage } from './pages/dashboard/finance/VoucherDetailPage'
import { VoucherEntryPage } from './pages/dashboard/finance/voucher/VoucherEntryPage'
import { ChartOfAccountsPage } from './pages/dashboard/finance/accounts/ChartOfAccountsPage'
import { ReportsPage } from './pages/dashboard/finance/reports/ReportsPage'
import { SurveysPage } from './pages/dashboard/surveys/SurveysPage'
import { SurveyBuilderPage } from './pages/dashboard/surveys/builder/SurveyBuilderPage'
import { WelfarePage } from './pages/dashboard/welfare/WelfarePage'
import { SettingsPage } from './pages/dashboard/settings/SettingsPage'
import { SystemSettingsPage } from './pages/dashboard/settings/SystemSettingsPage'
import { UsersPage } from './pages/dashboard/users/UsersPage'
import { ActivityLogPage } from './pages/dashboard/users/ActivityLogPage'
import { InboxPage } from './pages/dashboard/inbox/InboxPage'
import { BasiraPage } from './pages/dashboard/basira/BasiraPage'
import { ProfilePage } from './pages/dashboard/profile/ProfilePage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Toaster } from './components/ui/toaster'
import './index.css'



import { PortalLoginPage } from './pages/portal/PortalLoginPage'
import { PortalDashboardPage } from './pages/portal/PortalDashboardPage'
import { PortalReceiptsPage } from './pages/portal/PortalReceiptsPage'
import { PortalFamilyPage } from './pages/portal/PortalFamilyPage'
import { PortalAnnouncementsPage } from './pages/portal/PortalAnnouncementsPage'
import { PortalServicesPage } from './pages/portal/PortalServicesPage'
import { TenantHomePage } from './pages/TenantHomePage'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes (public) */}
          <Route path="/auth/signin" element={<Navigate to="/auth/masjid/login" replace />} />
          <Route path="/auth/masjid/login" element={<MasjidLoginPage />} />
          <Route path="/auth/login" element={<Navigate to="/auth/masjid/login" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/find-masjid" element={<FindWorkspacePage />} />

          {/* Portal Routes (public) */}
          <Route path="/portal/login" element={<PortalLoginPage />} />
          <Route path="/portal/dashboard" element={<PortalDashboardPage />} />
          <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/portal/receipts" element={<PortalReceiptsPage />} />
          <Route path="/portal/family" element={<PortalFamilyPage />} />
          <Route path="/portal/announcements" element={<PortalAnnouncementsPage />} />
          <Route path="/portal/services" element={<PortalServicesPage />} />

          {/* Dashboard Routes (protected) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="households" element={<HouseholdsPage />} />
            <Route path="households/new" element={<HouseholdFormPage />} />
            <Route path="households/:id" element={<HouseholdDetailPage />} />
            <Route path="households/:id/edit" element={<HouseholdFormPage />} />

            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="reminders" element={<RemindersPage />} />

            <Route path="finance" element={<FinancePage />} />
            <Route path="finance/transactions" element={<TransactionsPage />} />
            <Route path="finance/voucher" element={<VoucherEntryPage />} />
            <Route path="finance/voucher/:id" element={<VoucherDetailPage />} />
            <Route path="finance/accounts" element={<ChartOfAccountsPage />} />
            <Route path="finance/reports" element={<ReportsPage />} />

            <Route path="surveys" element={<SurveysPage />} />
            <Route path="surveys/builder" element={<SurveyBuilderPage />} />

            <Route path="welfare" element={<WelfarePage />} />

            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/activity" element={<ActivityLogPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="basira" element={<BasiraPage />} />
            <Route path="profile" element={<ProfilePage />} />


          </Route>

          {/* Tenant Home Page */}
          <Route path="/m/:id" element={<PublicMasjidPage />} />
          <Route path="/masjid/:id" element={<PublicMasjidPage />} />
          <Route path="/start" element={<TenantHomePage />} />
          <Route path="/" element={<TenantHomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App
