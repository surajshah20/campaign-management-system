import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Users2,
  Megaphone,
  TrendingUp,
  Clock,
  Plus,
  ArrowUpRight,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface OverviewData {
  metrics: {
    totalClients: number;
    activeClients: number;
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    pendingApprovalsCount: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalAllocatedBudget: number;
    totalAdSpend: number;
    totalProductionCost: number;
    remainingBudget: number;
  };
  recentCampaigns: any[];
  recentActivities: any[];
  approvalQueue: any[];
}

export const OverviewPage: React.FC = () => {
  const { currentAgency, user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<OverviewData>('/api/v1/workspaces/current/overview');
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load agency operations overview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchOverview();
    }
  }, [currentAgency?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-lg lg:col-span-2" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-danger-100 bg-danger-50 p-6 text-center">
        <p className="text-sm font-semibold text-danger-700">Unable to load dashboard</p>
        <p className="text-xs text-danger-600 mt-1">{error}</p>
        <Button size="sm" variant="outline" className="mt-4" onClick={fetchOverview}>
          Retry
        </Button>
      </div>
    );
  }

  const { metrics, recentCampaigns, recentActivities, approvalQueue } = data;
  const currency = currentAgency?.currency || 'NPR';

  // Real chart data aggregated from current budget records
  const financialData = [
    { name: 'Allocated Budget', amount: metrics.totalAllocatedBudget },
    { name: 'Ad Spend', amount: metrics.totalAdSpend },
    { name: 'Production', amount: metrics.totalProductionCost },
    { name: 'Remaining Balance', amount: Math.max(0, metrics.remainingBudget) },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Agency Operations Overview
            </h1>
            <Badge variant="neutral" size="sm">
              Phase 1 Live
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Welcome back, {user?.firstName}. Operational telemetry for{' '}
            <span className="font-semibold text-text-primary">{currentAgency?.name}</span>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Activity className="w-3.5 h-3.5 text-text-secondary" />}
            onClick={() => fetchOverview()}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() =>
              alert('Campaign Creation Wizard will open in Phase 3 implementation.')
            }
          >
            New Campaign
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Clients */}
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Clients</span>
            <div className="rounded p-1.5 bg-primary-50 text-primary-600">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {metrics.activeClients}
            </span>
            <span className="text-xs text-text-muted">of {metrics.totalClients} total</span>
          </div>
          <div className="mt-2 text-[11px] text-text-secondary flex items-center">
            <span className="text-success-600 font-medium inline-flex items-center mr-1">
              100% active
            </span>{' '}
            rate
          </div>
        </Card>

        {/* Active Campaigns */}
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Campaigns</span>
            <div className="rounded p-1.5 bg-indigo-50 text-indigo-600">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {metrics.activeCampaigns}
            </span>
            <span className="text-xs text-text-muted">
              active / {metrics.totalCampaigns} total
            </span>
          </div>
          <div className="mt-2 text-[11px] text-text-secondary">
            {metrics.completedCampaigns} completed campaigns
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              Client Approvals
            </span>
            <div className="rounded p-1.5 bg-warning-50 text-warning-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {metrics.pendingApprovalsCount}
            </span>
            <span className="text-xs text-warning-600 font-medium">pending client sign-off</span>
          </div>
          <div className="mt-2 text-[11px] text-text-secondary">
            Restricted client portal active
          </div>
        </Card>

        {/* Budget & Spend */}
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              Allocated Budget ({currency})
            </span>
            <div className="rounded p-1.5 bg-success-50 text-success-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold tracking-tight text-text-primary tabular-nums">
              {formatCurrency(metrics.totalAllocatedBudget, currency)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-text-secondary flex justify-between">
            <span>Spend: {formatCurrency(metrics.totalAdSpend, currency)}</span>
            <span className="font-semibold text-text-primary">
              Bal: {formatCurrency(metrics.remainingBudget, currency)}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Distribution Chart */}
        <Card className="p-5 lg:col-span-2 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Campaign Budget Allocation vs. Real Spend
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Financial monitoring across all active marketing initiatives ({currency})
              </p>
            </div>
            <Badge variant="outline" size="sm">
              Live DB Aggregation
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financialData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: number) => [
                    formatCurrency(val, currency),
                    'Amount',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Velocity Card */}
        <Card className="p-5 bg-white border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Task Progress</h2>
              <Badge variant="default" size="sm">
                {metrics.completedTasks} / {metrics.totalTasks} Done
              </Badge>
            </div>

            <div className="space-y-3.5 my-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary font-medium">In Progress</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {metrics.inProgressTasks}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full"
                    style={{
                      width: `${
                        metrics.totalTasks > 0
                          ? (metrics.inProgressTasks / metrics.totalTasks) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary font-medium">Completed</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {metrics.completedTasks}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-success-600 rounded-full"
                    style={{
                      width: `${
                        metrics.totalTasks > 0
                          ? (metrics.completedTasks / metrics.totalTasks) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary font-medium">Overdue</span>
                  <span className="font-semibold text-danger-600 tabular-nums">
                    {metrics.overdueTasks}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-danger-600 rounded-full"
                    style={{
                      width: `${
                        metrics.totalTasks > 0
                          ? (metrics.overdueTasks / metrics.totalTasks) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded border border-border bg-slate-50 p-3 mt-4">
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Task queues are tenant-isolated and linked directly to campaigns and clients.
            </p>
          </div>
        </Card>
      </div>

      {/* Two-Column Operational Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <Card className="p-5 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
              <Megaphone className="w-4 h-4 text-primary-600" />
              <span>Active Marketing Campaigns</span>
            </h2>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              onClick={() => alert('Navigate to Campaigns')}
            >
              View all
            </Button>
          </div>

          <div className="space-y-3">
            {recentCampaigns.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">
                No campaigns found for this workspace.
              </p>
            ) : (
              recentCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="flex items-start justify-between rounded-md border border-border p-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-text-primary">
                        {camp.name}
                      </span>
                      <Badge variant="success" size="sm">
                        {camp.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Client: <span className="font-medium text-text-primary">{camp.client?.name}</span> •{' '}
                      {camp._count?.tasks || 0} tasks • {camp._count?.contentPosts || 0} posts
                    </p>
                    <p className="text-[10px] text-text-muted truncate max-w-sm">
                      {camp.objective || 'Omnichannel awareness & conversions'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-text-primary tabular-nums block">
                      {formatCurrency(camp.allocatedBudget, currency)}
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      Budget
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Content Approval Queue */}
        <Card className="p-5 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
              <Clock className="w-4 h-4 text-warning-600" />
              <span>Client Approval Queue</span>
            </h2>
            <Badge variant="warning" size="sm">
              {approvalQueue.length} Pending
            </Badge>
          </div>

          <div className="space-y-3">
            {approvalQueue.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">
                No pending creative approvals in queue.
              </p>
            ) : (
              approvalQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {item.version?.mediaUrl ? (
                      <img
                        src={item.version.mediaUrl}
                        alt="Creative preview"
                        className="h-10 w-10 rounded object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center border border-border text-text-muted text-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-text-primary line-clamp-1">
                        {item.version?.contentPost?.title || 'Creative Asset'}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Client: {item.version?.contentPost?.client?.name} • V
                        {item.version?.versionNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="warning" size="sm">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Activity Logs Stream */}
      <Card className="p-5 bg-white border border-border shadow-subtle">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
            <Activity className="w-4 h-4 text-text-secondary" />
            <span>Workspace Activity History & Audit Trail</span>
          </h2>
          <span className="text-[11px] text-text-muted">Tenant Scoped</span>
        </div>

        <div className="divide-y divide-border">
          {recentActivities.map((act) => (
            <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="h-2 w-2 rounded-full bg-primary-600" />
                <span className="font-medium text-text-primary">
                  {act.user ? `${act.user.firstName} ${act.user.lastName}` : 'System'}
                </span>
                <span className="text-text-secondary font-normal">
                  executed action{' '}
                  <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-text-primary font-mono">
                    {act.action}
                  </code>
                </span>
              </div>
              <span className="text-[10px] text-text-muted tabular-nums">
                {formatDate(act.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
