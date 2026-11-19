import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  ArrowLeft,
  CheckSquare,
  CalendarDays,
  Coins,
  Building,
  Target,
  Trash2,
} from 'lucide-react';

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentAgency } = useAuth();

  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'content' | 'budget'>('overview');

  const currency = currentAgency?.currency || 'NPR';

  const fetchCampaign = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest(`/api/v1/campaigns/${id}`);
      setCampaign(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCampaign();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiRequest(`/api/v1/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchCampaign();
    } catch (err: any) {
      alert(err.message || 'Failed to update campaign status.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete campaign "${campaign?.name}"?`)) {
      return;
    }
    try {
      await apiRequest(`/api/v1/campaigns/${id}`, { method: 'DELETE' });
      navigate('/campaigns');
    } catch (err: any) {
      alert(err.message || 'Failed to delete campaign.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="rounded-lg border border-danger-100 bg-danger-50 p-6 text-center">
        <p className="text-xs text-danger-700 font-medium">{error || 'Campaign not found.'}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('/campaigns')}>
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const platforms = campaign.platformsJson ? JSON.parse(campaign.platformsJson) : [];
  const budget = campaign.budgets?.[0];

  return (
    <div className="space-y-6">
      <Link
        to="/campaigns"
        className="inline-flex items-center text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Campaigns
      </Link>

      {/* Header Banner */}
      <Card className="bg-white border border-border p-6 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-medium text-text-muted mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>{campaign.client?.name}</span>
              <span>•</span>
              <span className="uppercase text-[10px] font-semibold tracking-wider">
                {campaign.campaignType.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold tracking-tight text-text-primary">
                {campaign.name}
              </h1>
              <select
                value={campaign.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-7 rounded border border-border bg-white px-2 text-xs font-semibold text-text-primary shadow-xs focus-visible:outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Timeline: {campaign.startDate ? formatDate(campaign.startDate) : 'Immediate'} →{' '}
              {campaign.endDate ? formatDate(campaign.endDate) : 'Open-ended'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-right mr-3">
              <span className="text-[10px] text-text-muted block">Budget Allocation</span>
              <span className="text-base font-bold text-text-primary tabular-nums">
                {formatCurrency(campaign.allocatedBudget, currency)}
              </span>
            </div>
            <Button
              size="sm"
              variant="danger"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Workspace Sub-tabs */}
        <div className="mt-6 flex border-b border-border space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Overview & Strategy
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'tasks'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks ({campaign.tasks?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'content'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Content & Posts ({campaign.contentPosts?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'budget'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Budget & Expenses</span>
          </button>
        </div>
      </Card>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 bg-white border border-border shadow-subtle md:col-span-2 space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                Strategic Objective
              </h2>
              <p className="text-xs text-text-primary leading-relaxed bg-slate-50 p-3 rounded-md border border-border">
                {campaign.objective || 'No strategic objective documented yet.'}
              </p>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                Campaign Description
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                {campaign.description || 'No detailed campaign notes available.'}
              </p>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Active Marketing Platforms
              </h2>
              <div className="flex flex-wrap gap-2">
                {platforms.map((p: string) => (
                  <Badge key={p} variant="default" size="md">
                    {p.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-border shadow-subtle space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Target Audience
            </h2>
            <div className="rounded-md border border-border bg-slate-50 p-3 text-xs text-text-primary">
              <Target className="w-4 h-4 text-primary-600 mb-1" />
              <p className="mt-1">{campaign.targetAudience || 'Broad general audience'}</p>
            </div>

            <div className="border-t border-border pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Assigned Client:</span>
                <span className="font-semibold text-text-primary">
                  {campaign.client?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Created:</span>
                <span className="text-text-secondary tabular-nums">
                  {formatDate(campaign.createdAt)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <Card className="p-5 bg-white border border-border shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">
              Campaign Execution Tasks
            </h2>
            <Button
              size="sm"
              onClick={() => navigate('/tasks')}
            >
              Open Task Board
            </Button>
          </div>

          <div className="space-y-2">
            {campaign.tasks?.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">
                No tasks linked to this campaign.
              </p>
            ) : (
              campaign.tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-text-primary">{task.title}</span>
                    <div className="flex items-center space-x-2 text-[11px] text-text-muted">
                      <Badge variant="outline" size="sm">
                        {task.priority}
                      </Badge>
                      <span>Due: {task.dueDate ? formatDate(task.dueDate) : 'No deadline'}</span>
                    </div>
                  </div>
                  <Badge variant={task.status === 'COMPLETED' ? 'success' : 'neutral'} size="sm">
                    {task.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <Card className="p-5 bg-white border border-border shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">
              Scheduled Posts & Creatives
            </h2>
            <Button
              size="sm"
              onClick={() => navigate('/content')}
            >
              Open Content Studio
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campaign.contentPosts?.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center col-span-2">
                No content items drafted for this campaign.
              </p>
            ) : (
              campaign.contentPosts.map((post: any) => (
                <div
                  key={post.id}
                  className="rounded-md border border-border p-3 space-y-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="default" size="sm">
                      {post.platform}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {post.status}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-text-primary">{post.title}</h4>
                  <p className="text-[11px] text-text-secondary line-clamp-2">
                    {post.caption}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Budget & Expenses Tab */}
      {activeTab === 'budget' && (
        <Card className="p-5 bg-white border border-border shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">
              Budget & Expense Ledger ({currency})
            </h2>
          </div>

          {budget ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded border border-border bg-slate-50 p-3">
                  <span className="text-[10px] text-text-muted block">Allocated Budget</span>
                  <span className="text-base font-bold text-text-primary tabular-nums">
                    {formatCurrency(budget.allocatedAmount, currency)}
                  </span>
                </div>
                <div className="rounded border border-border bg-slate-50 p-3">
                  <span className="text-[10px] text-text-muted block">Ad Spend</span>
                  <span className="text-base font-bold text-text-primary tabular-nums">
                    {formatCurrency(budget.advertisingSpend, currency)}
                  </span>
                </div>
                <div className="rounded border border-border bg-slate-50 p-3">
                  <span className="text-[10px] text-text-muted block">Production Cost</span>
                  <span className="text-base font-bold text-text-primary tabular-nums">
                    {formatCurrency(budget.productionCost, currency)}
                  </span>
                </div>
                <div className="rounded border border-border bg-slate-50 p-3">
                  <span className="text-[10px] text-text-muted block">Remaining Balance</span>
                  <span className="text-base font-bold text-success-600 tabular-nums">
                    {formatCurrency(
                      budget.allocatedAmount -
                        (budget.advertisingSpend + budget.productionCost),
                      currency
                    )}
                  </span>
                </div>
              </div>

              {/* Expense Table */}
              <div className="border border-border rounded-md overflow-hidden mt-4">
                <div className="bg-slate-50 px-3 py-2 border-b border-border text-[10px] font-semibold text-text-muted uppercase">
                  Logged Campaign Expenses
                </div>
                <div className="divide-y divide-border text-xs">
                  {budget.expenses?.length === 0 ? (
                    <p className="p-4 text-center text-text-secondary">
                      No expenses logged yet.
                    </p>
                  ) : (
                    budget.expenses.map((exp: any) => (
                      <div
                        key={exp.id}
                        className="px-3 py-2.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-text-primary">{exp.description}</p>
                          <p className="text-[10px] text-text-muted">
                            {exp.category} • {formatDate(exp.date)}
                          </p>
                        </div>
                        <span className="font-bold text-text-primary tabular-nums">
                          {formatCurrency(exp.amount, currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-secondary py-4 text-center">
              No financial budget allocated yet.
            </p>
          )}
        </Card>
      )}
    </div>
  );
};
