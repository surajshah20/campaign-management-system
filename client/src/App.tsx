import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { OverviewPage } from './features/dashboard/OverviewPage';
import { ClientsPage } from './features/clients/ClientsPage';
import { ClientDetailPage } from './features/clients/ClientDetailPage';
import { TeamPage } from './features/team/TeamPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { FeaturePlaceholder } from './features/placeholder/FeaturePlaceholder';
import {
  Megaphone,
  CalendarDays,
  CheckSquare,
  BarChart3,
  LineChart,
  FileSpreadsheet,
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
            
            {/* Phase 2: Agency Operations & CRM */}
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Upcoming Roadmap Phases */}
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
          </Route>

          {/* Catch-all redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
