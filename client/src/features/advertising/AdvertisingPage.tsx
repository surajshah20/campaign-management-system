import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  BarChart3,
  Plus,
  Search,
  Upload,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
} from 'lucide-react';

interface AdAccountItem {
  id: string;
  platform: string;
  accountName: string;
  externalId?: string;
  currency: string;
  _count: {
    campaigns: number;
  };
}

interface AdMetricItem {
  id: string;
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
}

interface AdCampaignItem {
  id: string;
  name: string;
  platform: string;
  budgetAmount: number;
  spendAmount: number;
  status: string;
  startDate?: string;
  endDate?: string;
  campaign: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  };
  adAccount?: {
    id: string;
    accountName: string;
    platform: string;
  };
  metrics: AdMetricItem[];
}

interface CampaignSimple {
  id: string;
  name: string;
  client: {
    name: string;
  };
}

const PLATFORM_COLORS: Record<string, { label: string; badge: string; border: string }> = {
  META_ADS: {
    label: 'Meta Ads',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    border: 'border-blue-500',
  },
  GOOGLE_ADS: {
    label: 'Google Ads',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-500',
  },
  TIKTOK_ADS: {
    label: 'TikTok Ads',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-rose-500',
  },
  LINKEDIN_ADS: {
    label: 'LinkedIn Ads',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    border: 'border-sky-500',
  },
};

export const AdvertisingPage: React.FC = () => {
  const { currentAgency } = useAuth();
  const currency = currentAgency?.currency || 'NPR';

  const [adCampaigns, setAdCampaigns] = useState<AdCampaignItem[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccountItem[]>([]);
  const [campaignsList, setCampaignsList] = useState<CampaignSimple[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [campaignFilter, setCampaignFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
  const [isConnectAccountModalOpen, setIsConnectAccountModalOpen] = useState(false);
  const [isLogMetricModalOpen, setIsLogMetricModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedAdCampaign, setSelectedAdCampaign] = useState<AdCampaignItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [campaignForm, setCampaignForm] = useState({
    campaignId: '',
    adAccountId: '',
    name: '',
    platform: 'META_ADS',
    budgetAmount: 50000,
    spendAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [accountForm, setAccountForm] = useState({
    platform: 'META_ADS',
    accountName: '',
    externalId: '',
    currency: 'NPR',
  });

  const [metricForm, setMetricForm] = useState({
    date: new Date().toISOString().split('T')[0],
    impressions: 12000,
    reach: 9500,
    clicks: 420,
    spend: 3500,
    conversions: 18,
    revenue: 15400,
  });

  const [csvText, setCsvText] = useState(
    `date,impressions,reach,clicks,spend,conversions,revenue\n${new Date().toISOString().split('T')[0]},15000,11200,540,4200,24,19800`
  );

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [campsRes, accsRes, masterCampsRes] = await Promise.all([
        apiRequest<AdCampaignItem[]>('/api/v1/advertising/campaigns'),
        apiRequest<AdAccountItem[]>('/api/v1/advertising/accounts'),
        apiRequest<any[]>('/api/v1/campaigns'),
      ]);

      setAdCampaigns(campsRes || []);
      setAdAccounts(accsRes || []);
      setCampaignsList(
        (masterCampsRes || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          client: { name: c.client?.name || 'Unassigned' },
        }))
      );
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load paid advertising resources.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchData();
    }
  }, [currentAgency?.id]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.campaignId || !campaignForm.name.trim()) {
      alert('Please select a parent campaign and provide a name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/advertising/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          ...campaignForm,
          budgetAmount: Number(campaignForm.budgetAmount),
          spendAmount: Number(campaignForm.spendAmount),
          adAccountId: campaignForm.adAccountId || undefined,
          endDate: campaignForm.endDate || undefined,
        }),
      });

      setSuccessMsg('Ad campaign launched successfully.');
      setIsCreateCampaignModalOpen(false);
      setCampaignForm({
        campaignId: '',
        adAccountId: '',
        name: '',
        platform: 'META_ADS',
        budgetAmount: 50000,
        spendAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create ad campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.accountName.trim()) {
      alert('Please enter an account name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/advertising/accounts', {
        method: 'POST',
        body: JSON.stringify(accountForm),
      });

      setSuccessMsg('Ad account connected successfully.');
      setIsConnectAccountModalOpen(false);
      setAccountForm({
        platform: 'META_ADS',
        accountName: '',
        externalId: '',
        currency: 'NPR',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to connect ad account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdCampaign) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/advertising/metrics', {
        method: 'POST',
        body: JSON.stringify({
          adCampaignId: selectedAdCampaign.id,
          date: metricForm.date,
          impressions: Number(metricForm.impressions),
          reach: Number(metricForm.reach),
          clicks: Number(metricForm.clicks),
          spend: Number(metricForm.spend),
          conversions: Number(metricForm.conversions),
          revenue: Number(metricForm.revenue),
        }),
      });

      setSuccessMsg(`Daily performance metric logged for ${selectedAdCampaign.name}`);
      setIsLogMetricModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to log daily metric');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdCampaign) return;

    try {
      setIsSubmitting(true);
      const res = await apiRequest<{ recordsCreated: number; totalSpendAdded: number }>(
        '/api/v1/advertising/metrics/csv',
        {
          method: 'POST',
          body: JSON.stringify({
            adCampaignId: selectedAdCampaign.id,
            csvRows: csvText,
          }),
        }
      );

      setSuccessMsg(
        `Imported ${res.recordsCreated} metric rows. Added ${formatCurrency(
          res.totalSpendAdded,
          currency
        )} to spend.`
      );
      setIsCsvModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to import CSV metrics');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rollups & filtering
  const filteredCampaigns = adCampaigns.filter((item) => {
    if (platformFilter !== 'ALL' && item.platform !== platformFilter) return false;
    if (campaignFilter !== 'ALL' && item.campaign.id !== campaignFilter) return false;
    if (
      searchQuery &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.campaign.client.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalSpend = adCampaigns.reduce((acc, c) => acc + c.spendAmount, 0);
  const totalBudget = adCampaigns.reduce((acc, c) => acc + c.budgetAmount, 0);
  const totalRevenue = adCampaigns.reduce(
    (acc, c) => acc + c.metrics.reduce((mAcc, m) => mAcc + m.revenue, 0),
    0
  );
  const blendedRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00';
  const totalClicks = adCampaigns.reduce(
    (acc, c) => acc + c.metrics.reduce((mAcc, m) => mAcc + m.clicks, 0),
    0
  );
  const totalImpressions = adCampaigns.reduce(
    (acc, c) => acc + c.metrics.reduce((mAcc, m) => mAcc + m.impressions, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-text-muted mb-1">
            <span>PAID MEDIA</span>
            <span>/</span>
            <span className="text-text-primary">ADVERTISING MANAGEMENT</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Paid Advertising Management
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Cross-platform ad operations across Meta Ads, Google Ads, TikTok Ads, and LinkedIn Ads.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConnectAccountModalOpen(true)}
            leftIcon={<Globe className="w-3.5 h-3.5" />}
          >
            Connect Ad Account
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateCampaignModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Ad Campaign
          </Button>
        </div>
      </div>

      {/* Error Notification */}
      {errorMsg && (
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50/70 p-3 text-xs text-red-800">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs font-medium text-red-600 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Connected Ad Accounts Quick Tray */}
      <div className="flex items-center justify-between overflow-x-auto rounded-lg border border-border bg-slate-50/70 px-4 py-2.5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Connected Accounts:
          </span>
          {adAccounts.length === 0 ? (
            <span className="text-xs text-text-muted">No external ad accounts connected yet.</span>
          ) : (
            adAccounts.map((acc) => (
              <span
                key={acc.id}
                className="inline-flex items-center space-x-1.5 rounded bg-white px-2.5 py-1 text-xs font-medium border border-border text-text-primary shadow-2xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{acc.accountName}</span>
                <span className="text-[10px] text-text-muted">
                  ({acc.platform.replace('_', ' ')})
                </span>
              </span>
            ))
          )}
        </div>
        <span className="text-xs text-text-secondary font-mono">
          {adCampaigns.length} Active Campaigns
        </span>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Total Paid Ad Spend</span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold tracking-tight text-text-primary tabular-nums">
              {formatCurrency(totalSpend, currency)}
            </span>
            <span className="text-xs font-medium text-text-muted">
              of {formatCurrency(totalBudget, currency)}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary-600 h-full rounded-full"
              style={{
                width: `${totalBudget > 0 ? Math.min((totalSpend / totalBudget) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Blended ROAS</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold tracking-tight text-emerald-600 tabular-nums">
              {blendedRoas}x
            </span>
            <span className="text-xs text-text-muted">
              {formatCurrency(totalRevenue, currency)} rev
            </span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary truncate">
            Across Meta, Google & programmatic channels
          </p>
        </Card>

        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Ad Impressions</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-700">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold tracking-tight text-text-primary tabular-nums">
              {totalImpressions.toLocaleString()}
            </span>
            <span className="text-xs text-text-muted">Views</span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary truncate">
            Total verified cross-network impressions
          </p>
        </Card>

        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Total Link Clicks</span>
            <div className="p-1.5 rounded-md bg-purple-50 text-purple-700">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold tracking-tight text-text-primary tabular-nums">
              {totalClicks.toLocaleString()}
            </span>
            <span className="text-xs text-text-muted">
              {totalImpressions > 0
                ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}% CTR`
                : '0% CTR'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary truncate">
            Avg CPC: {totalClicks > 0 ? formatCurrency(totalSpend / totalClicks, currency) : '—'}
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Filters */}
          <div className="inline-flex rounded-md border border-border bg-white p-0.5 text-xs font-medium shadow-2xs">
            {['ALL', 'META_ADS', 'GOOGLE_ADS', 'TIKTOK_ADS', 'LINKEDIN_ADS'].map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  platformFilter === p
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {p === 'ALL' ? 'All Platforms' : PLATFORM_COLORS[p]?.label || p}
              </button>
            ))}
          </div>

          {/* Master Campaign Filter */}
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="rounded-md border border-border bg-white px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-2xs"
          >
            <option value="ALL">All Parent Campaigns</option>
            {campaignsList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.client.name})
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search ad campaigns or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-border bg-white pl-8 pr-3 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Main Ad Campaigns Table */}
      {isLoading ? (
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <EmptyState
          title="No paid ad campaigns found"
          description={
            searchQuery || platformFilter !== 'ALL'
              ? 'No advertising sets match the selected criteria.'
              : 'Launch your first paid campaign to track spend, impressions, conversions, and ROAS.'
          }
          icon={<BarChart3 className="w-6 h-6 text-text-muted" />}
          actionLabel="Launch Ad Campaign"
          onAction={() => setIsCreateCampaignModalOpen(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-subtle">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/75 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Ad Campaign</th>
                <th className="py-3 px-4">Platform & Account</th>
                <th className="py-3 px-4">Client & Master Campaign</th>
                <th className="py-3 px-4">Spend / Budget</th>
                <th className="py-3 px-4">Impressions / Clicks</th>
                <th className="py-3 px-4">ROAS</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCampaigns.map((ad) => {
                const recentMetrics = ad.metrics || [];
                const campImpressions = recentMetrics.reduce((s, m) => s + m.impressions, 0);
                const campClicks = recentMetrics.reduce((s, m) => s + m.clicks, 0);
                const campRevenue = recentMetrics.reduce((s, m) => s + m.revenue, 0);
                const campSpend = ad.spendAmount;
                const campRoas = campSpend > 0 ? (campRevenue / campSpend).toFixed(2) : '0.00';
                const percentSpent =
                  ad.budgetAmount > 0
                    ? Math.min(Math.round((ad.spendAmount / ad.budgetAmount) * 100), 100)
                    : 0;

                const platformInfo = PLATFORM_COLORS[ad.platform] || {
                  label: ad.platform,
                  badge: 'bg-slate-100 text-slate-700 border-slate-200',
                  border: 'border-slate-400',
                };

                return (
                  <tr key={ad.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary">{ad.name}</div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {ad.startDate ? `Started ${formatDate(ad.startDate)}` : 'Continuous run'}
                      </div>
                    </td>

                    {/* Platform & Account */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border w-max ${platformInfo.badge}`}
                        >
                          {platformInfo.label}
                        </span>
                        {ad.adAccount && (
                          <span className="text-[10px] text-text-muted">
                            {ad.adAccount.accountName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Client & Master Campaign */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-text-primary">{ad.campaign.client.name}</div>
                      <div className="text-[11px] text-text-secondary">{ad.campaign.name}</div>
                    </td>

                    {/* Spend / Budget */}
                    <td className="py-3 px-4 min-w-[150px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-text-primary tabular-nums">
                          {formatCurrency(ad.spendAmount, currency)}
                        </span>
                        <span className="text-text-muted">
                          {formatCurrency(ad.budgetAmount, currency)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentSpent > 90 ? 'bg-rose-500' : 'bg-primary-600'
                          }`}
                          style={{ width: `${percentSpent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 text-right tabular-nums">
                        {percentSpent}% utilized
                      </div>
                    </td>

                    {/* Impressions / Clicks */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-text-primary tabular-nums">
                        {campImpressions.toLocaleString()}{' '}
                        <span className="text-[11px] text-text-muted font-normal">views</span>
                      </div>
                      <div className="text-[11px] text-text-secondary tabular-nums">
                        {campClicks.toLocaleString()} clicks{' '}
                        {campImpressions > 0 && (
                          <span className="text-text-muted">
                            ({((campClicks / campImpressions) * 100).toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ROAS Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tabular-nums ${
                          Number(campRoas) >= 3.0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : Number(campRoas) >= 1.5
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {campRoas}x ROAS
                      </span>
                      <div className="text-[10px] text-text-muted mt-0.5 tabular-nums">
                        {formatCurrency(campRevenue, currency)} rev
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          ad.status === 'ACTIVE'
                            ? 'success'
                            : ad.status === 'PAUSED'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {ad.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2"
                          onClick={() => {
                            setSelectedAdCampaign(ad);
                            setIsLogMetricModalOpen(true);
                          }}
                        >
                          Log Daily
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => {
                            setSelectedAdCampaign(ad);
                            setIsCsvModalOpen(true);
                          }}
                          leftIcon={<Upload className="w-3 h-3" />}
                        >
                          CSV
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: Create Ad Campaign */}
      <Dialog
        isOpen={isCreateCampaignModalOpen}
        onClose={() => setIsCreateCampaignModalOpen(false)}
        title="Launch Paid Ad Campaign"
        description="Bind paid advertising activities to a strategic marketing campaign with allocated budget."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Parent Marketing Campaign <span className="text-red-500">*</span>
            </label>
            <select
              value={campaignForm.campaignId}
              onChange={(e) => setCampaignForm({ ...campaignForm, campaignId: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
              required
            >
              <option value="">Select a marketing campaign...</option>
              {campaignsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Advertising Platform <span className="text-red-500">*</span>
              </label>
              <select
                value={campaignForm.platform}
                onChange={(e) => setCampaignForm({ ...campaignForm, platform: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="META_ADS">Meta Ads (Facebook & Instagram)</option>
                <option value="GOOGLE_ADS">Google Ads (Search & Performance Max)</option>
                <option value="TIKTOK_ADS">TikTok Ads Manager</option>
                <option value="LINKEDIN_ADS">LinkedIn Campaign Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Connected Ad Account (Optional)
              </label>
              <select
                value={campaignForm.adAccountId}
                onChange={(e) => setCampaignForm({ ...campaignForm, adAccountId: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">No linked account (Manual / Standalone)</option>
                {adAccounts
                  .filter((a) => a.platform === campaignForm.platform)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({a.platform})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Ad Campaign Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Meta Conversions - Himalayan Roast Q4"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Allocated Budget ({currency}) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={campaignForm.budgetAmount}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, budgetAmount: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Initial / Historical Spend ({currency})
              </label>
              <Input
                type="number"
                min="0"
                value={campaignForm.spendAmount}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, spendAmount: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={campaignForm.startDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                End Date (Optional)
              </label>
              <Input
                type="date"
                value={campaignForm.endDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateCampaignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Launch Campaign
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Connect Ad Account */}
      <Dialog
        isOpen={isConnectAccountModalOpen}
        onClose={() => setIsConnectAccountModalOpen(false)}
        title="Connect Advertising Account"
        description="Link your agency's Meta Business Manager, Google Ads or TikTok accounts for metric mapping."
        maxWidth="md"
      >
        <form onSubmit={handleConnectAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Platform <span className="text-red-500">*</span>
            </label>
            <select
              value={accountForm.platform}
              onChange={(e) => setAccountForm({ ...accountForm, platform: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="META_ADS">Meta Ads Manager</option>
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="TIKTOK_ADS">TikTok Ads Manager</option>
              <option value="LINKEDIN_ADS">LinkedIn Campaign Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Account Display Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Apex Digital Meta Business Account"
              value={accountForm.accountName}
              onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              External Ad Account ID (Optional)
            </label>
            <Input
              placeholder="e.g. act_192837465 or 982-123-4567"
              value={accountForm.externalId}
              onChange={(e) => setAccountForm({ ...accountForm, externalId: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Currency</label>
            <Input
              value={accountForm.currency}
              onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConnectAccountModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Connect Account
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 3: Log Daily Performance Metric */}
      <Dialog
        isOpen={isLogMetricModalOpen}
        onClose={() => setIsLogMetricModalOpen(false)}
        title={`Log Daily Performance — ${selectedAdCampaign?.name || ''}`}
        description="Record verified ad impressions, spend, clicks, and revenue. ROAS is automatically derived."
        maxWidth="lg"
      >
        <form onSubmit={handleLogMetric} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Performance Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={metricForm.date}
              onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Impressions
              </label>
              <Input
                type="number"
                min="0"
                value={metricForm.impressions}
                onChange={(e) =>
                  setMetricForm({ ...metricForm, impressions: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Reach</label>
              <Input
                type="number"
                min="0"
                value={metricForm.reach}
                onChange={(e) => setMetricForm({ ...metricForm, reach: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Link Clicks
              </label>
              <Input
                type="number"
                min="0"
                value={metricForm.clicks}
                onChange={(e) => setMetricForm({ ...metricForm, clicks: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Conversions / Leads
              </label>
              <Input
                type="number"
                min="0"
                value={metricForm.conversions}
                onChange={(e) =>
                  setMetricForm({ ...metricForm, conversions: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Spend Amount ({currency}) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={metricForm.spend}
                onChange={(e) => setMetricForm({ ...metricForm, spend: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Attributed Revenue ({currency})
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={metricForm.revenue}
                onChange={(e) => setMetricForm({ ...metricForm, revenue: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Derived ROAS Indicator */}
          <div className="rounded border border-border bg-slate-50 p-3 flex items-center justify-between text-xs">
            <span className="text-text-secondary">Estimated Daily ROAS:</span>
            <span className="font-bold text-text-primary">
              {metricForm.spend > 0
                ? `${(metricForm.revenue / metricForm.spend).toFixed(2)}x`
                : '0.00x'}
            </span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLogMetricModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Daily Metric
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 4: CSV Batch Import */}
      <Dialog
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title={`Batch Ingest Ad Metrics (CSV) — ${selectedAdCampaign?.name || ''}`}
        description="Paste raw CSV exported from Meta Ads Manager, Google Ads or TikTok Ads."
        maxWidth="lg"
      >
        <form onSubmit={handleImportCsv} className="space-y-4">
          <div className="rounded border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-800">
            <div className="font-semibold mb-1 flex items-center space-x-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Required CSV Header Format:</span>
            </div>
            <code className="block bg-white p-2 rounded border border-blue-200 text-[11px] font-mono select-all">
              date,impressions,reach,clicks,spend,conversions,revenue
            </code>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              CSV Content
            </label>
            <textarea
              rows={7}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full font-mono text-xs rounded-md border border-border p-3 focus:outline-none focus:ring-1 focus:ring-primary-500"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCsvModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Ingest CSV Records
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
