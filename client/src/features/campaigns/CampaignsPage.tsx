import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Megaphone,
  Plus,
  Search,
  Building,
  ArrowUpRight,
} from 'lucide-react';

interface CampaignItem {
  id: string;
  name: string;
  description?: string;
  objective?: string;
  campaignType: string;
  status: string;
  allocatedBudget: number;
  targetAudience?: string;
  platformsJson?: string;
  startDate?: string;
  endDate?: string;
  client: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  _count: {
    tasks: number;
    contentPosts: number;
    adCampaigns: number;
  };
}

export const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAgency } = useAuth();

  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    objective: '',
    campaignType: 'SOCIAL_MEDIA_MARKETING',
    status: 'PLANNING',
    allocatedBudget: 100000,
    targetAudience: '',
    platforms: ['INSTAGRAM', 'FACEBOOK'],
    startDate: '',
    endDate: '',
  });

  const currency = currentAgency?.currency || 'NPR';

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (clientFilter !== 'ALL') params.set('clientId', clientFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const [campsData, clientsData] = await Promise.all([
        apiRequest<CampaignItem[]>(`/api/v1/campaigns?${params.toString()}`),
        apiRequest<any[]>('/api/v1/clients'),
      ]);

      setCampaigns(campsData);
      setClients(clientsData);
      if (clientsData.length > 0 && !formData.clientId) {
        setFormData((prev) => ({ ...prev, clientId: clientsData[0].id }));
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch campaigns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchCampaigns();
    }
  }, [currentAgency?.id, statusFilter, clientFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCampaigns();
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => {
      const exists = prev.platforms.includes(platform);
      return {
        ...prev,
        platforms: exists
          ? prev.platforms.filter((p) => p !== platform)
          : [...prev.platforms, platform],
      };
    });
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.clientId) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/campaigns', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setIsModalOpen(false);
      setFormData({
        clientId: clients[0]?.id || '',
        name: '',
        description: '',
        objective: '',
        campaignType: 'SOCIAL_MEDIA_MARKETING',
        status: 'PLANNING',
        allocatedBudget: 100000,
        targetAudience: '',
        platforms: ['INSTAGRAM', 'FACEBOOK'],
        startDate: '',
        endDate: '',
      });
      await fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'PLANNING':
        return <Badge variant="default" size="sm">Planning</Badge>;
      case 'PAUSED':
        return <Badge variant="warning" size="sm">Paused</Badge>;
      case 'COMPLETED':
        return <Badge variant="neutral" size="sm">Completed</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  const availablePlatforms = [
    'INSTAGRAM',
    'FACEBOOK',
    'TIKTOK',
    'YOUTUBE',
    'LINKEDIN',
    'GOOGLE_ADS',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Campaign Management
            </h1>
            <Badge variant="outline" size="sm">
              {campaigns.length} Campaigns
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Orchestrate multi-platform digital marketing campaigns, deadlines, and allocated budgets.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Campaign
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 border border-border bg-white rounded-md p-1 shadow-subtle">
            {['ALL', 'ACTIVE', 'PLANNING', 'PAUSED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter === st
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Client Filter */}
          {clients.length > 0 && (
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-white px-2.5 text-xs text-text-primary shadow-subtle focus-visible:outline-none"
            >
              <option value="ALL">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search campaigns by name, objective..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-white pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-primary-500 shadow-subtle"
          />
        </form>
      </div>

      {/* Main Campaign List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-52 rounded-lg" />
          <Skeleton className="h-52 rounded-lg" />
          <Skeleton className="h-52 rounded-lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-danger-100 bg-danger-50 p-6 text-center">
          <p className="text-xs text-danger-700 font-medium">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={fetchCampaigns}>
            Retry
          </Button>
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-6 h-6 text-primary-600" />}
          title="No campaigns found"
          description={
            searchQuery
              ? `No campaigns matched "${searchQuery}".`
              : 'Launch your first campaign to organize tasks, schedule content, and track client advertising budgets.'
          }
          actionLabel="Create Campaign"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((camp) => {
            const platforms = camp.platformsJson
              ? (JSON.parse(camp.platformsJson) as string[])
              : [];

            return (
              <Card
                key={camp.id}
                hoverable
                onClick={() => navigate(`/campaigns/${camp.id}`)}
                className="flex flex-col justify-between border border-border bg-white p-5 shadow-subtle group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-text-muted flex items-center mb-1">
                        <Building className="w-3 h-3 mr-1" />
                        {camp.client.name}
                      </span>
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-1">
                        {camp.name}
                      </h3>
                    </div>
                    <div>{getStatusBadge(camp.status)}</div>
                  </div>

                  <p className="mt-2 text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {camp.objective || camp.description || 'Omnichannel awareness & conversions.'}
                  </p>

                  {/* Platforms Tags */}
                  {platforms.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {platforms.map((p) => (
                        <span
                          key={p}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary uppercase"
                        >
                          {p.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-text-muted block">Budget</span>
                      <span className="font-bold text-text-primary tabular-nums">
                        {formatCurrency(camp.allocatedBudget, currency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-text-muted block">Timeline</span>
                      <span className="font-medium text-text-secondary text-[11px]">
                        {camp.startDate ? formatDate(camp.startDate) : 'Immediate'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-text-secondary">
                    <span>
                      <strong>{camp._count.tasks}</strong> tasks •{' '}
                      <strong>{camp._count.contentPosts}</strong> posts
                    </span>
                    <span className="inline-flex items-center text-primary-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Workspace <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Marketing Campaign"
        description="Set strategic objectives, select advertising platforms, and assign client budget."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Client Brand *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Campaign Type
              </label>
              <select
                value={formData.campaignType}
                onChange={(e) =>
                  setFormData({ ...formData, campaignType: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none"
              >
                <option value="SOCIAL_MEDIA_MARKETING">Social Media Marketing</option>
                <option value="PAID_ADVERTISING">Paid Advertising</option>
                <option value="BRAND_AWARENESS">Brand Awareness</option>
                <option value="LEAD_GENERATION">Lead Generation</option>
                <option value="PRODUCT_PROMOTION">Product Promotion</option>
                <option value="EVENT_PROMOTION">Event Promotion</option>
                <option value="EMAIL_MARKETING">Email Marketing</option>
                <option value="CONTENT_MARKETING">Content Marketing</option>
              </select>
            </div>
          </div>

          <Input
            label="Campaign Name *"
            placeholder="e.g. Summer Omnichannel Launch 2026"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />

          <Input
            label="Primary Objective"
            placeholder="e.g. Generate 500+ direct sign-ups and drive retail foot traffic"
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`Allocated Budget (${currency})`}
              type="number"
              min="0"
              value={formData.allocatedBudget}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allocatedBudget: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Target Audience"
              placeholder="e.g. Ages 22-45 in metropolitan areas"
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData({ ...formData, targetAudience: e.target.value })
              }
            />
          </div>

          {/* Platform selection chips */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-primary">
              Target Marketing Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {availablePlatforms.map((platform) => {
                const selected = formData.platforms.includes(platform);
                return (
                  <button
                    type="button"
                    key={platform}
                    onClick={() => handlePlatformToggle(platform)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                        : 'bg-white border-border text-text-secondary hover:bg-slate-50'
                    }`}
                  >
                    {platform.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Launch Campaign
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
