import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Clock,
  Plus,
  ArrowUpRight,
  Activity,
  Layers,
  AlertTriangle,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
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
  const navigate = useNavigate();
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
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
      <div className="rounded-lg border border-danger-200/80 bg-danger-50/50 p-8 text-center max-w-lg mx-auto my-12">
        <div className="w-10 h-10 rounded-full bg-danger-100 text-danger-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-text-primary">
          Unable to synchronize operations overview
        </p>
        <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">{error}</p>
        <Button size="sm" variant="outline" className="mt-4" onClick={fetchOverview}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const { metrics, recentCampaigns, recentActivities, approvalQueue } = data;
  const currency = currentAgency?.currency || 'NPR';

  const budgetUtilization =
    metrics.totalAllocatedBudget > 0
      ? Math.round((metrics.totalAdSpend / metrics.totalAllocatedBudget) * 100)
      : 0;

  const financialData = [
    {
      name: 'Allocated Budget',
      amount: metrics.totalAllocatedBudget,
      color: '#5145E8',
    },
    {
      name: 'Real Ad Spend',
      amount: metrics.totalAdSpend,
      color: '#16835D',
    },
    {
      name: 'Production Costs',
      amount: metrics.totalProductionCost,
      color: '#B7791F',
    },
    {
      name: 'Remaining Balance',
      amount: Math.max(0, metrics.remainingBudget),
      color: '#667085',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Natural Messaging */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              {greeting}, {user?.firstName || 'there'}
            </h1>
            <Badge variant="outline" size="sm" dot>
              {currentAgency?.name || 'Workspace'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Here's what's happening across your agency operations today.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-text-secondary" />}
            onClick={() => fetchOverview()}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/campaigns')}
          >
            New Campaign
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Clients */}
        <Card
          hoverable
          onClick={() => navigate('/clients')}
          className="p-4 bg-white border border-border shadow-subtle group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Active Clients
            </span>
            <div className="rounded-md p-1.5 bg-surface-subtle text-text-secondary group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {metrics.activeClients}
            </span>
            <span className="text-xs text-text-muted">
              of {metrics.totalClients} accounts
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-text-secondary pt-2 border-t border-border/60">
            <span className="text-success-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success-600 inline-block" />
              100% operational
            </span>
            <span className="text-primary-600 group-hover:underline text-[10px] font-medium flex items-center">
              View CRM <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </Card>

        {/* Active Campaigns */}
        <Card
          hoverable
          onClick={() => navigate('/campaigns')}
          className="p-4 bg-white border border-border shadow-subtle group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Active Campaigns
            </span>
            <div className="rounded-md p-1.5 bg-surface-subtle text-text-secondary group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {metrics.activeCampaigns}
            </span>
            <span className="text-xs text-text-muted">
              running now
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-text-secondary pt-2 border-t border-border/60">
            <span>{metrics.completedCampaigns} completed campaigns</span>
            <span className="text-primary-600 group-hover:underline text-[10px] font-medium flex items-center">
              Campaigns <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </Card>

        {/* Pending Client Approvals */}
        <Card
          hoverable
          onClick={() => navigate('/portal')}
          className="p-4 bg-white border border-border shadow-subtle group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Client Approvals
            </span>
            <div className="rounded-md p-1.5 bg-surface-subtle text-text-secondary group-hover:bg-warning-50 group-hover:text-warning-600 transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {metrics.pendingApprovalsCount}
            </span>
            <span className="text-xs text-warning-600 font-medium">
              awaiting sign-off
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-text-secondary pt-2 border-t border-border/60">
            <span className="text-text-muted">Client portal queue</span>
            <span className="text-primary-600 group-hover:underline text-[10px] font-medium flex items-center">
              Review queue <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </Card>

        {/* Advertising Spend & Budget */}
        <Card
          hoverable
          onClick={() => navigate('/advertising')}
          className="p-4 bg-white border border-border shadow-subtle group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Advertising Spend
            </span>
            <div className="rounded-md p-1.5 bg-surface-subtle text-text-secondary group-hover:bg-success-50 group-hover:text-success-600 transition-colors">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-xl font-bold tracking-tight text-text-primary tabular-nums">
              {formatCurrency(metrics.totalAdSpend, currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-text-secondary pt-2 border-t border-border/60">
            <span>{budgetUtilization}% of budget</span>
            <span className="font-semibold text-text-primary tabular-nums">
              Bal: {formatCurrency(metrics.remainingBudget, currency)}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Charts & Operational Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Distribution Chart */}
        <Card className="p-5 lg:col-span-2 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Campaign Budget vs. Actual Spend
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Financial monitoring across all active marketing initiatives ({currency})
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              Live Aggregation
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financialData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#667085' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E4E7EC' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#667085' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : `${val}`)}
                />
                <Tooltip
                  formatter={(val: number) => [
                    formatCurrency(val, currency),
                    'Capital',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E4E7EC',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px -2px rgba(16, 24, 40, 0.08)',
                  }}
                />
                <Bar
                  dataKey="amount"
                  radius={[4, 4, 0, 0]}
                  barSize={44}
                >
                  {financialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Financial Summary Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 mt-2 border-t border-border text-xs">
            <div className="p-2 rounded bg-surface-subtle">
              <span className="text-[10px] text-text-secondary uppercase font-semibold">
                Total Allocated
              </span>
              <p className="font-bold text-text-primary tabular-nums mt-0.5">
                {formatCurrency(metrics.totalAllocatedBudget, currency)}
              </p>
            </div>
            <div className="p-2 rounded bg-surface-subtle">
              <span className="text-[10px] text-text-secondary uppercase font-semibold">
                Total Ad Spend
              </span>
              <p className="font-bold text-success-600 tabular-nums mt-0.5">
                {formatCurrency(metrics.totalAdSpend, currency)}
              </p>
            </div>
            <div className="p-2 rounded bg-surface-subtle">
              <span className="text-[10px] text-text-secondary uppercase font-semibold">
                Production Cost
              </span>
              <p className="font-bold text-warning-600 tabular-nums mt-0.5">
                {formatCurrency(metrics.totalProductionCost, currency)}
              </p>
            </div>
            <div className="p-2 rounded bg-surface-subtle">
              <span className="text-[10px] text-text-secondary uppercase font-semibold">
                Net Remaining
              </span>
              <p className="font-bold text-primary-600 tabular-nums mt-0.5">
                {formatCurrency(metrics.remainingBudget, currency)}
              </p>
            </div>
          </div>
        </Card>

        {/* Task Velocity & Execution Health Card */}
        <Card className="p-5 bg-white border border-border shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">
                Task Execution Health
              </h2>
              <Badge variant="default" size="sm">
                {metrics.completedTasks} / {metrics.totalTasks} Done
              </Badge>
            </div>

            <div className="space-y-4 my-2">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-secondary font-medium">In Progress</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {metrics.inProgressTasks} tasks
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-300"
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
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-secondary font-medium">Completed</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {metrics.completedTasks} tasks
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-success-600 rounded-full transition-all duration-300"
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
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-secondary font-medium">Overdue Tasks</span>
                  <span className="font-semibold text-danger-600 tabular-nums">
                    {metrics.overdueTasks} urgent
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-danger-600 rounded-full transition-all duration-300"
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

          <div className="pt-4 border-t border-border mt-4">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => navigate('/tasks')}
            >
              Open Kanban Board
            </Button>
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
              size="xs"
              variant="ghost"
              className="text-xs"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/campaigns')}
            >
              View all
            </Button>
          </div>

          <div className="space-y-2.5">
            {recentCampaigns.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">
                No active campaigns found in this workspace.
              </p>
            ) : (
              recentCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  onClick={() => navigate(`/campaigns/${camp.id}`)}
                  className="flex items-start justify-between rounded-md border border-border p-3 hover:bg-surface-subtle hover:border-slate-300 transition-all cursor-pointer"
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
                      {camp.objective || 'Omnichannel awareness & performance'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 pl-3">
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

        {/* Client Approval Queue */}
        <Card className="p-5 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
              <Clock className="w-4 h-4 text-warning-600" />
              <span>Pending Client Approvals</span>
            </h2>
            <Badge variant="warning" size="sm">
              {approvalQueue.length} Pending
            </Badge>
          </div>

          <div className="space-y-2.5">
            {approvalQueue.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">
                No pending creative approvals in queue.
              </p>
            ) : (
              approvalQueue.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/portal')}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-surface-subtle hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    {item.version?.mediaUrl ? (
                      <img
                        src={item.version.mediaUrl}
                        alt="Creative preview"
                        className="h-9 w-9 rounded object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded bg-slate-100 flex items-center justify-center border border-border text-text-muted text-xs shrink-0">
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
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
            <Activity className="w-4 h-4 text-text-secondary" />
            <span>Workspace Activity & Audit Trail</span>
          </h2>
          <span className="text-[11px] text-text-muted">Tenant Isolated</span>
        </div>

        <div className="divide-y divide-border">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-text-secondary py-3 text-center">
              No recent activity recorded.
            </p>
          ) : (
            recentActivities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 truncate pr-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-600 shrink-0" />
                  <span className="font-semibold text-text-primary shrink-0">
                    {act.user ? `${act.user.firstName} ${act.user.lastName}` : 'System'}
                  </span>
                  <span className="text-text-secondary font-normal truncate">
                    executed action{' '}
                    <code className="text-[10px] bg-surface-subtle border border-border px-1.5 py-0.5 rounded text-text-primary font-mono">
                      {act.action}
                    </code>
                  </span>
                </div>
                <span className="text-[10px] text-text-muted tabular-nums shrink-0">
                  {formatDate(act.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};