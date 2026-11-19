import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { OverviewPage } from './features/dashboard/OverviewPage';
import { FeaturePlaceholder } from './features/placeholder/FeaturePlaceholder';
import {
  Users2,
  Megaphone,
  CalendarDays,
  CheckSquare,
  BarChart3,
  LineChart,
  FileSpreadsheet,
  Users,
  Settings,
} from 'lucide-react';

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
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route
              path="clients"
              element={
                <FeaturePlaceholder
                  title="Client Management (CRM)"
                  moduleName="Module 3"
                  targetPhase="Phase 2"
                  description="Manage client organizations, assigned account managers, brand assets, contact details, and dedicated client portal workspaces."
                  icon={Users2}
                />
              }
            />
            <Route
              path="campaigns"
              element={
                <FeaturePlaceholder
                  title="Campaign Management"
                  moduleName="Module 4"
                  targetPhase="Phase 3"
                  description="Multi-platform campaign orchestration across Facebook, Instagram, TikTok, and Meta Ads with lifecycle management."
                  icon={Megaphone}
                />
              }
            />
            <Route
              path="content"
              element={
                <FeaturePlaceholder
                  title="Content Studio & Social Calendar"
                  moduleName="Module 6"
                  targetPhase="Phase 4"
                  description="Interactive monthly/weekly content calendar, multi-version creative editor, caption drafting, and automated approval pipeline."
                  icon={CalendarDays}
                />
              }
            />
            <Route
              path="tasks"
              element={
                <FeaturePlaceholder
                  title="Task Management"
                  moduleName="Module 5"
                  targetPhase="Phase 3"
                  description="Task tracking across Kanban boards, lists, and calendar deadlines linked directly to campaigns and clients."
                  icon={CheckSquare}
                />
              }
            />
            <Route
              path="advertising"
              element={
                <FeaturePlaceholder
                  title="Paid Advertising Management"
                  moduleName="Module 8"
                  targetPhase="Phase 5"
                  description="Track ad campaigns across Meta Ads, Google Ads, TikTok Ads, and LinkedIn Ads with spend metrics and creative tracking."
                  icon={BarChart3}
                />
              }
            />
            <Route
              path="analytics"
              element={
                <FeaturePlaceholder
                  title="Advertising & Campaign Analytics"
                  moduleName="Module 9 & 10"
                  targetPhase="Phase 5"
                  description="Comprehensive trend analysis for ROAS, impressions, reach, conversion rate, CPC, and platform performance comparisons."
                  icon={LineChart}
                />
              }
            />
            <Route
              path="reports"
              element={
                <FeaturePlaceholder
                  title="Client Reports & Presentations"
                  moduleName="Module 12"
                  targetPhase="Phase 6"
                  description="Generate professional agency-branded PDF campaign reports with shareable restricted client links."
                  icon={FileSpreadsheet}
                />
              }
            />
            <Route
              path="team"
              element={
                <FeaturePlaceholder
                  title="Team & Member Invitations"
                  moduleName="Module 1"
                  targetPhase="Phase 2"
                  description="Invite agency team members, manage RBAC roles (Owner, Admin, Campaign Manager, Designer, Writer, Marketing Exec)."
                  icon={Users}
                />
              }
            />
            <Route
              path="settings"
              element={
                <FeaturePlaceholder
                  title="Agency Workspace Settings"
                  moduleName="Module 1"
                  targetPhase="Phase 2"
                  description="Configure workspace currency (NPR supported), brand logos, timezone, client portal domain, and subscription plan."
                  icon={Settings}
                />
              }
            />
          </Route>

          {/* Catch-all redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
