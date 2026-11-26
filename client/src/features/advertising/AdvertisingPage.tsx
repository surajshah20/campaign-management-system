import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
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
  Globe,
  X,
  FileSpreadsheet,
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

const PLATFORM_CONFIG: Record<string, { label: string; badgeVariant: 'default' | 'neutral' | 'success' | 'warning' }> = {
  META_ADS: { label: 'Meta', badgeVariant: 'default' },
  GOOGLE_ADS: { label: 'Google', badgeVariant: 'success' },
  TIKTOK_ADS: { label: 'TikTok', badgeVariant: 'warning' },
  LINKEDIN_ADS: { label: 'LinkedIn', badgeVariant: 'neutral' },
};

export const AdvertisingPage: React.FC = () => {
  const { currentAgency } = useAuth();
  const { success, error: toastError } = useToast();
  const currency = currentAgency?.currency || 'NPR';

  const [adCampaigns, setAdCampaigns] = useState<AdCampaignItem[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccountItem[]>([]);
  const [campaignsList, setCampaignsList] = useState<CampaignSimple[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [campaignFilter, setCampaignFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountsDetail, setShowAccountsDetail] = useState(false);

  // Progressive Disclosure: Selected Campaign for Side Drawer
  const [drawerCampaign, setDrawerCampaign] = useState<AdCampaignItem | null>(null);

  // Modals
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
  const [isConnectAccountModalOpen, setIsConnectAccountModalOpen] = useState(false);
  const [isLogMetricModalOpen, setIsLogMetricModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [activeModalCampaign, setActiveModalCampaign] = useState<AdCampaignItem | null>(null);
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

      // Refresh drawer campaign if open
      if (drawerCampaign) {
        const updated = (campsRes || []).find((c) => c.id === drawerCampaign.id);
        if (updated) setDrawerCampaign(updated);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load paid advertising resources.');
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
      toastError('Please select a parent campaign and provide a name.');
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

      success('Campaign launched', `${campaignForm.name} is now active.`);
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
      toastError(err.message || 'Failed to create ad campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.accountName.trim()) {
      toastError('Please enter an account name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/advertising/accounts', {
        method: 'POST',
        body: JSON.stringify(accountForm),
      });

      success('Account connected', `${accountForm.accountName} linked successfully.`);
      setIsConnectAccountModalOpen(false);
      setAccountForm({
        platform: 'META_ADS',
        accountName: '',
        externalId: '',
        currency: 'NPR',
      });
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Failed to connect ad account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalCampaign) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/advertising/metrics', {
        method: 'POST',
        body: JSON.stringify({
          adCampaignId: activeModalCampaign.id,
          date: metricForm.date,
          impressions: Number(metricForm.impressions),
          reach: Number(metricForm.reach),
          clicks: Number(metricForm.clicks),
          spend: Number(metricForm.spend),
          conversions: Number(metricForm.conversions),
          revenue: Number(metricForm.revenue),
        }),
      });

      success('Metric recorded', `Daily performance logged for ${activeModalCampaign.name}`);
      setIsLogMetricModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Failed to log daily metric');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalCampaign) return;

    try {
      setIsSubmitting(true);
      const res = await apiRequest<{ recordsCreated: number; totalSpendAdded: number }>(
        '/api/v1/advertising/metrics/csv',
        {
          method: 'POST',
          body: JSON.stringify({
            adCampaignId: activeModalCampaign.id,
            csvRows: csvText,
          }),
        }
      );

      success(
        'CSV Ingested',
        `Imported ${res.recordsCreated} rows (+${formatCurrency(res.totalSpendAdded, currency)} spend).`
      );
      setIsCsvModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Failed to import CSV metrics');
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
  const avgCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* 1. Header: Clean & Spacious */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Advertising Management
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Cross-platform campaign operations, budget pacing, and ROAS performance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConnectAccountModalOpen(true)}
            leftIcon={<Globe className="w-3.5 h-3.5" />}
          >
            Connect Account
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

      {/* 2. Compact Connected Accounts Indicator (Expandable) */}
      <div className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-xs shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2 w-2 rounded-full bg-success-600 shrink-0" />
            <span className="font-semibold text-text-primary">
              {adAccounts.length} Connected Ad Accounts
            </span>
            <span className="text-text-muted">•</span>
            <span className="text-text-secondary text-[11px] truncate max-w-md hidden sm:inline">
              {adAccounts.length > 0
                ? adAccounts.map((a) => a.accountName).join(', ')
                : 'No external accounts connected yet.'}
            </span>
          </div>
          <button
            onClick={() => setShowAccountsDetail(!showAccountsDetail)}
            className="text-[11px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {showAccountsDetail ? 'Hide Accounts' : 'View Accounts'}
          </button>
        </div>

        {showAccountsDetail && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 animate-in fade-in duration-150">
            {adAccounts.length === 0 ? (
              <p className="text-[11px] text-text-muted col-span-full py-1">
                Link Meta Ads Manager, Google Ads, or TikTok accounts to auto-map campaign metrics.
              </p>
            ) : (
              adAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-2 rounded border border-border bg-surface-subtle flex items-center justify-between text-xs"
                >
                  <div className="truncate">
                    <p className="font-medium text-text-primary truncate">{acc.accountName}</p>
                    <p className="text-[10px] text-text-muted capitalize">
                      {acc.platform.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {acc.currency}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Simplified Consistent KPI Cards (Only title, value, and one supporting detail) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ad Spend */}
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
            Total Ad Spend
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
            {formatCurrency(totalSpend, currency)}
          </div>
          <p className="mt-2 text-xs text-text-secondary pt-2 border-t border-border/60">
            Budget: <span className="font-semibold text-text-primary">{formatCurrency(totalBudget, currency)}</span>
          </p>
        </Card>

        {/* Blended ROAS */}
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
            Blended ROAS
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-success-600 tabular-nums">
            {blendedRoas}x
          </div>
          <p className="mt-2 text-xs text-text-secondary pt-2 border-t border-border/60">
            Revenue: <span className="font-semibold text-text-primary">{formatCurrency(totalRevenue, currency)}</span>
          </p>
        </Card>

        {/* Impressions */}
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
            Verified Impressions
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
            {totalImpressions.toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-text-secondary pt-2 border-t border-border/60">
            Average CTR: <span className="font-semibold text-text-primary">{avgCtr}%</span>
          </p>
        </Card>

        {/* Link Clicks */}
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
            Total Link Clicks
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
            {totalClicks.toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-text-secondary pt-2 border-t border-border/60">
            Avg CPC: <span className="font-semibold text-text-primary">{totalClicks > 0 ? formatCurrency(totalSpend / totalClicks, currency) : '—'}</span>
          </p>
        </Card>
      </div>

      {/* 4. Unified Clean Toolbar (Platform filters, campaign dropdown, search) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Segmented Tabs */}
          <div className="inline-flex rounded-md border border-border bg-white p-0.5 text-xs font-medium shadow-subtle">
            {['ALL', 'META_ADS', 'GOOGLE_ADS', 'TIKTOK_ADS'].map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-2.5 py-1 rounded transition-colors text-xs ${
                  platformFilter === p
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {p === 'ALL' ? 'All Platforms' : PLATFORM_CONFIG[p]?.label || p}
              </button>
            ))}
          </div>

          {/* Master Campaign Filter */}
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-white px-2.5 text-xs text-text-primary shadow-subtle focus:outline-none focus:border-primary-600"
          >
            <option value="ALL">All Parent Campaigns</option>
            {campaignsList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.client.name})
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-white pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted shadow-subtle focus:outline-none focus:border-primary-600"
          />
        </div>
      </div>

      {/* 5. Simplified Advertising Campaign Table */}
      {isLoading ? (
        <Card className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <EmptyState
          title="No ad campaigns found"
          description={
            searchQuery || platformFilter !== 'ALL'
              ? 'No advertising sets match the selected criteria.'
              : 'Launch your first paid campaign to monitor spend, impressions, and ROAS.'
          }
          icon={<BarChart3 className="w-6 h-6 text-text-muted" />}
          actionLabel="Launch Ad Campaign"
          onAction={() => setIsCreateCampaignModalOpen(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-subtle">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/70 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Spend / Budget</th>
                <th className="py-3 px-4">ROAS</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCampaigns.map((ad) => {
                const recentMetrics = ad.metrics || [];
                const campRevenue = recentMetrics.reduce((s, m) => s + m.revenue, 0);
                const campSpend = ad.spendAmount;
                const campRoas = campSpend > 0 ? (campRevenue / campSpend).toFixed(2) : '0.00';
                const percentSpent =
                  ad.budgetAmount > 0
                    ? Math.round((ad.spendAmount / ad.budgetAmount) * 100)
                    : 0;

                const platformInfo = PLATFORM_CONFIG[ad.platform] || {
                  label: ad.platform,
                  badgeVariant: 'neutral' as const,
                };

                return (
                  <tr
                    key={ad.id}
                    onClick={() => setDrawerCampaign(ad)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Campaign Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                        {ad.name}
                      </div>
                      <div className="text-[11px] text-text-muted truncate max-w-xs">
                        {ad.campaign.name}
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="py-3 px-4">
                      <Badge variant={platformInfo.badgeVariant} size="sm">
                        {platformInfo.label}
                      </Badge>
                    </td>

                    {/* Client */}
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {ad.campaign.client.name}
                    </td>

                    {/* Spend / Budget */}
                    <td className="py-3 px-4 tabular-nums">
                      <span className="font-semibold text-text-primary">
                        {formatCurrency(ad.spendAmount, currency)}
                      </span>
                      <span className="text-text-muted text-[11px] ml-1">
                        / {formatCurrency(ad.budgetAmount, currency)}
                      </span>
                      <span className="text-[10px] text-text-muted ml-1.5 font-mono">
                        ({percentSpent}%)
                      </span>
                    </td>

                    {/* ROAS */}
                    <td className="py-3 px-4 tabular-nums font-semibold">
                      <span
                        className={
                          Number(campRoas) >= 3.0
                            ? 'text-success-600'
                            : Number(campRoas) >= 1.5
                            ? 'text-warning-600'
                            : 'text-text-secondary'
                        }
                      >
                        {campRoas}x
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge
                        variant={ad.status === 'ACTIVE' ? 'success' : 'neutral'}
                        size="sm"
                        dot
                      >
                        {ad.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center space-x-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setDrawerCampaign(ad)}
                        >
                          Details
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setActiveModalCampaign(ad);
                            setIsLogMetricModalOpen(true);
                          }}
                        >
                          Log Daily
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

      {/* 6. Progressive Disclosure: Side Drawer for Deep Campaign Telemetry */}
      {drawerCampaign && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white h-full shadow-modal border-l border-border flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-start justify-between bg-surface-subtle">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Badge
                    variant={
                      PLATFORM_CONFIG[drawerCampaign.platform]?.badgeVariant || 'neutral'
                    }
                    size="sm"
                  >
                    {PLATFORM_CONFIG[drawerCampaign.platform]?.label || drawerCampaign.platform}
                  </Badge>
                  <Badge
                    variant={drawerCampaign.status === 'ACTIVE' ? 'success' : 'neutral'}
                    size="sm"
                    dot
                  >
                    {drawerCampaign.status}
                  </Badge>
                </div>
                <h2 className="text-base font-bold text-text-primary">
                  {drawerCampaign.name}
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Client: {drawerCampaign.campaign.client.name} • {drawerCampaign.campaign.name}
                </p>
              </div>
              <button
                onClick={() => setDrawerCampaign(null)}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Primary Financial Overview */}
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
                  Financial & Return Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border bg-surface-subtle">
                    <span className="text-[10px] text-text-muted uppercase font-semibold">
                      Spend / Budget
                    </span>
                    <p className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
                      {formatCurrency(drawerCampaign.spendAmount, currency)}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      of {formatCurrency(drawerCampaign.budgetAmount, currency)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-surface-subtle">
                    <span className="text-[10px] text-text-muted uppercase font-semibold">
                      ROAS & Attributed Revenue
                    </span>
                    {(() => {
                      const totalRev = drawerCampaign.metrics.reduce((s, m) => s + m.revenue, 0);
                      const roasVal =
                        drawerCampaign.spendAmount > 0
                          ? (totalRev / drawerCampaign.spendAmount).toFixed(2)
                          : '0.00';
                      return (
                        <>
                          <p className="text-sm font-bold text-success-600 tabular-nums mt-0.5">
                            {roasVal}x ROAS
                          </p>
                          <p className="text-[11px] text-text-secondary mt-0.5">
                            {formatCurrency(totalRev, currency)} total revenue
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Engagement & Audience Telemetry */}
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
                  Audience & Engagement
                </h3>
                {(() => {
                  const impressions = drawerCampaign.metrics.reduce((s, m) => s + m.impressions, 0);
                  const clicks = drawerCampaign.metrics.reduce((s, m) => s + m.clicks, 0);
                  const conversions = drawerCampaign.metrics.reduce((s, m) => s + m.conversions, 0);
                  const ctr =
                    impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
                  const cpc =
                    clicks > 0
                      ? formatCurrency(drawerCampaign.spendAmount / clicks, currency)
                      : '—';

                  return (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded border border-border bg-white text-center">
                        <span className="text-[10px] text-text-muted block">Impressions</span>
                        <span className="font-bold text-text-primary tabular-nums">
                          {impressions.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded border border-border bg-white text-center">
                        <span className="text-[10px] text-text-muted block">Link Clicks</span>
                        <span className="font-bold text-text-primary tabular-nums">
                          {clicks.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded border border-border bg-white text-center">
                        <span className="text-[10px] text-text-muted block">CTR</span>
                        <span className="font-bold text-primary-600 tabular-nums">
                          {ctr}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded border border-border bg-white text-center">
                        <span className="text-[10px] text-text-muted block">Avg CPC</span>
                        <span className="font-bold text-text-primary tabular-nums">
                          {cpc}
                        </span>
                      </div>
                      <div className="p-2.5 rounded border border-border bg-white text-center">
                        <span className="text-[10px] text-text-muted block">Conversions</span>
                        <span className="font-bold text-success-600 tabular-nums">
                          {conversions}
                        </span>
                      </div>
                      <div className="p-2.5 rounded border border-border bg-white text-center">
                        <span className="text-[10px] text-text-muted block">Account</span>
                        <span className="font-medium text-text-primary truncate block text-[11px]">
                          {drawerCampaign.adAccount?.accountName || 'Manual'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Historical Daily Logs */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Daily Metric Logs ({drawerCampaign.metrics.length})
                  </h3>
                  <div className="flex items-center space-x-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      leftIcon={<Plus className="w-3 h-3" />}
                      onClick={() => {
                        setActiveModalCampaign(drawerCampaign);
                        setIsLogMetricModalOpen(true);
                      }}
                    >
                      Log
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      leftIcon={<Upload className="w-3 h-3" />}
                      onClick={() => {
                        setActiveModalCampaign(drawerCampaign);
                        setIsCsvModalOpen(true);
                      }}
                    >
                      CSV
                    </Button>
                  </div>
                </div>

                {drawerCampaign.metrics.length === 0 ? (
                  <p className="text-xs text-text-muted p-4 text-center rounded border border-dashed border-border">
                    No daily telemetry logged yet. Click "Log" or "CSV" above.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-border text-[10px] font-semibold text-text-muted uppercase">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Spend</th>
                          <th className="py-2 px-3">Clicks</th>
                          <th className="py-2 px-3">Revenue</th>
                          <th className="py-2 px-3">ROAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {drawerCampaign.metrics.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50 text-[11px] tabular-nums">
                            <td className="py-2 px-3 font-medium text-text-primary">
                              {formatDate(m.date)}
                            </td>
                            <td className="py-2 px-3 text-text-primary">
                              {formatCurrency(m.spend, currency)}
                            </td>
                            <td className="py-2 px-3 text-text-secondary">
                              {m.clicks.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-success-600 font-medium">
                              {formatCurrency(m.revenue, currency)}
                            </td>
                            <td className="py-2 px-3 font-semibold text-text-primary">
                              {m.spend > 0 ? (m.revenue / m.spend).toFixed(2) : '0.00'}x
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border bg-surface-subtle flex items-center justify-between">
              <span className="text-[11px] text-text-muted font-mono">
                ID: {drawerCampaign.id.slice(0, 12)}
              </span>
              <Button size="sm" variant="outline" onClick={() => setDrawerCampaign(null)}>
                Close Drawer
              </Button>
            </div>
          </div>
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
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-tight mb-1">
              Parent Marketing Campaign <span className="text-danger-600">*</span>
            </label>
            <select
              value={campaignForm.campaignId}
              onChange={(e) => setCampaignForm({ ...campaignForm, campaignId: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-600"
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
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-tight mb-1">
                Advertising Platform <span className="text-danger-600">*</span>
              </label>
              <select
                value={campaignForm.platform}
                onChange={(e) => setCampaignForm({ ...campaignForm, platform: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-600"
              >
                <option value="META_ADS">Meta Ads (Facebook & Instagram)</option>
                <option value="GOOGLE_ADS">Google Ads (Search & PMax)</option>
                <option value="TIKTOK_ADS">TikTok Ads Manager</option>
                <option value="LINKEDIN_ADS">LinkedIn Campaign Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-tight mb-1">
                Connected Ad Account (Optional)
              </label>
              <select
                value={campaignForm.adAccountId}
                onChange={(e) => setCampaignForm({ ...campaignForm, adAccountId: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-600"
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

          <Input
            label="Ad Campaign Name"
            placeholder="e.g. Meta Conversions - Himalayan Roast Q4"
            value={campaignForm.name}
            onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`Allocated Budget (${currency})`}
              type="number"
              min="0"
              value={campaignForm.budgetAmount}
              onChange={(e) =>
                setCampaignForm({ ...campaignForm, budgetAmount: Number(e.target.value) })
              }
              required
            />
            <Input
              label={`Initial / Historical Spend (${currency})`}
              type="number"
              min="0"
              value={campaignForm.spendAmount}
              onChange={(e) =>
                setCampaignForm({ ...campaignForm, spendAmount: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={campaignForm.startDate}
              onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={campaignForm.endDate}
              onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
            />
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
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-tight mb-1">
              Platform <span className="text-danger-600">*</span>
            </label>
            <select
              value={accountForm.platform}
              onChange={(e) => setAccountForm({ ...accountForm, platform: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-600"
            >
              <option value="META_ADS">Meta Ads Manager</option>
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="TIKTOK_ADS">TikTok Ads Manager</option>
              <option value="LINKEDIN_ADS">LinkedIn Campaign Manager</option>
            </select>
          </div>

          <Input
            label="Account Display Name"
            placeholder="e.g. Apex Digital Meta Business Account"
            value={accountForm.accountName}
            onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
            required
          />

          <Input
            label="External Ad Account ID (Optional)"
            placeholder="e.g. act_192837465 or 982-123-4567"
            value={accountForm.externalId}
            onChange={(e) => setAccountForm({ ...accountForm, externalId: e.target.value })}
          />

          <Input
            label="Currency"
            value={accountForm.currency}
            onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })}
          />

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
        title={`Log Daily Performance — ${activeModalCampaign?.name || ''}`}
        description="Record verified ad impressions, spend, clicks, and revenue. ROAS is automatically derived."
        maxWidth="lg"
      >
        <form onSubmit={handleLogMetric} className="space-y-4">
          <Input
            label="Performance Date"
            type="date"
            value={metricForm.date}
            onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Impressions"
              type="number"
              min="0"
              value={metricForm.impressions}
              onChange={(e) =>
                setMetricForm({ ...metricForm, impressions: Number(e.target.value) })
              }
            />
            <Input
              label="Reach"
              type="number"
              min="0"
              value={metricForm.reach}
              onChange={(e) => setMetricForm({ ...metricForm, reach: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Link Clicks"
              type="number"
              min="0"
              value={metricForm.clicks}
              onChange={(e) => setMetricForm({ ...metricForm, clicks: Number(e.target.value) })}
            />
            <Input
              label="Conversions / Leads"
              type="number"
              min="0"
              value={metricForm.conversions}
              onChange={(e) =>
                setMetricForm({ ...metricForm, conversions: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`Spend Amount (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={metricForm.spend}
              onChange={(e) => setMetricForm({ ...metricForm, spend: Number(e.target.value) })}
              required
            />
            <Input
              label={`Attributed Revenue (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={metricForm.revenue}
              onChange={(e) => setMetricForm({ ...metricForm, revenue: Number(e.target.value) })}
            />
          </div>

          <div className="rounded border border-border bg-surface-subtle p-3 flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">Estimated Daily ROAS:</span>
            <span className="font-bold text-success-600">
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
        title={`Batch Ingest Ad Metrics (CSV) — ${activeModalCampaign?.name || ''}`}
        description="Paste raw CSV exported from Meta Ads Manager, Google Ads or TikTok Ads."
        maxWidth="lg"
      >
        <form onSubmit={handleImportCsv} className="space-y-4">
          <div className="rounded border border-primary-200 bg-primary-50/50 p-3 text-xs text-primary-900">
            <div className="font-semibold mb-1 flex items-center space-x-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary-600" />
              <span>Required CSV Header Format:</span>
            </div>
            <code className="block bg-white p-2 rounded border border-primary-200/80 text-[11px] font-mono select-all text-text-primary">
              date,impressions,reach,clicks,spend,conversions,revenue
            </code>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-tight mb-1">
              CSV Content
            </label>
            <textarea
              rows={7}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full font-mono text-xs rounded-md border border-border p-3 focus:outline-none focus:border-primary-600"
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