import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { AcceptInvitePage } from './features/auth/AcceptInvitePage';
import { OverviewPage } from './features/dashboard/OverviewPage';
import { ClientsPage } from './features/clients/ClientsPage';
import { ClientDetailPage } from './features/clients/ClientDetailPage';
import { TeamPage } from './features/team/TeamPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { CampaignsPage } from './features/campaigns/CampaignsPage';
import { CampaignDetailPage } from './features/campaigns/CampaignDetailPage';
import { TasksPage } from './features/tasks/TasksPage';
import { ContentCalendarPage } from './features/content/ContentCalendarPage';
import { ClientPortalPage } from './features/approvals/ClientPortalPage';
import { AdvertisingPage } from './features/advertising/AdvertisingPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { PublicReportView } from './features/reports/PublicReportView';
import { IntegrationsPage } from './features/integrations/IntegrationsPage';
import { BillingPage } from './features/billing/BillingPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="text-xs text-text-secondary font-medium">
            Loading Agency OS Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth & Presentation Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/join" element={<AcceptInvitePage />} />
          <Route path="/reports/share/:token" element={<PublicReportView />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Phase 1 & 2 */}
            <Route index element={<OverviewPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Phase 3: Campaign Operations & Task Management */}
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="campaigns/:id" element={<CampaignDetailPage />} />
            <Route path="tasks" element={<TasksPage />} />

            {/* Phase 4: Content Studio, Calendar & Client Portal */}
            <Route path="content" element={<ContentCalendarPage />} />
            <Route path="portal" element={<ClientPortalPage />} />

            {/* Phase 5: Paid Advertising Management & Cross-Platform Analytics */}
            <Route path="advertising" element={<AdvertisingPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />

            {/* Phase 6 & Phase 7: Client Reports, Presentations & Third-Party Integrations */}
            <Route path="reports" element={<ReportsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />

            {/* Phase 8: Commercial SaaS Subscriptions & Usage Quotas */}
            <Route path="billing" element={<BillingPage />} />
          </Route>

          {/* Catch-all redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
