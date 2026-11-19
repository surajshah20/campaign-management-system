import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import {
  FileSpreadsheet,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Lock,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  shareToken: string;
  isPubliclyShared: boolean;
  observations?: string;
  recommendations?: string;
  summaryJson?: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  campaign?: {
    id: string;
    name: string;
  };
}

interface ClientOption {
  id: string;
  name: string;
}

interface CampaignOption {
  id: string;
  name: string;
  clientId: string;
}

export const ReportsPage: React.FC = () => {
  const { currentAgency } = useAuth();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Filters
  const [clientFilter, setClientFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    campaignId: '',
    title: '',
    observations: '',
    recommendations: '',
    isPubliclyShared: true,
  });

  const fetchReportsData = async () => {
    try {
      setIsLoading(true);
      const [reportsRes, clientsRes, campaignsRes] = await Promise.all([
        apiRequest<ReportItem[]>('/api/v1/reports'),
        apiRequest<any[]>('/api/v1/clients'),
        apiRequest<any[]>('/api/v1/campaigns'),
      ]);

      setReports(reportsRes || []);
      setClients(
        (clientsRes || []).map((c: any) => ({
          id: c.id,
          name: c.name,
        }))
      );
      setCampaigns(
        (campaignsRes || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          clientId: c.clientId || c.client?.id,
        }))
      );
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load client reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchReportsData();
    }
  }, [currentAgency?.id]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.title.trim()) {
      alert('Please select a client and provide a report title.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          campaignId: formData.campaignId || undefined,
        }),
      });

      setIsGenerateModalOpen(false);
      setFormData({
        clientId: '',
        campaignId: '',
        title: '',
        observations: '',
        recommendations: '',
        isPubliclyShared: true,
      });
      fetchReportsData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate client report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleShare = async (report: ReportItem) => {
    try {
      const updated = await apiRequest<ReportItem>(`/api/v1/reports/${report.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isPubliclyShared: !report.isPubliclyShared,
        }),
      });

      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, isPubliclyShared: updated.isPubliclyShared } : r))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update share settings');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This cannot be undone.')) return;

    try {
      await apiRequest(`/api/v1/reports/${reportId}`, {
        method: 'DELETE',
      });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  const handleCopyLink = (shareToken: string) => {
    const fullUrl = `${window.location.origin}/reports/share/${shareToken}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const filteredReports = reports.filter((r) => {
    if (clientFilter !== 'ALL' && r.client.id !== clientFilter) return false;
    if (
      searchQuery &&
      !r.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.client.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalPublic = reports.filter((r) => r.isPubliclyShared).length;
  const uniqueClientsCovered = new Set(reports.map((r) => r.client.id)).size;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-text-muted mb-1">
            <span>CLIENT REPORTING</span>
            <span>/</span>
            <span className="text-text-primary">PRESENTATIONS & AUDITS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Client Reports & Presentations
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Generate executive performance wrap-ups, budget audits, and shareable client presentation links.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsGenerateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Generate Report
        </Button>
      </div>

      {/* Error Banner */}
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Generated Reports</span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {reports.length}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">Total frozen client deliverables</p>
        </Card>

        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Publicly Shared</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
              {totalPublic}
            </span>
            <span className="text-xs text-text-muted">
              {reports.length > 0 ? Math.round((totalPublic / reports.length) * 100) : 0}% active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">Accessible via client share tokens</p>
        </Card>

        <Card className="p-4 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Clients Covered</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {uniqueClientsCovered}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">Brands receiving regular audit summaries</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-md border border-border bg-white px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-2xs"
          >
            <option value="ALL">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search reports or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-border bg-white pl-8 pr-3 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Reports Table */}
      {isLoading ? (
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : filteredReports.length === 0 ? (
        <EmptyState
          title="No client reports generated yet"
          description="Create your first client report to capture spend, ROAS, creative deliverables, and strategic recommendations."
          icon={<FileSpreadsheet className="w-6 h-6 text-text-muted" />}
          actionLabel="Generate Report"
          onAction={() => setIsGenerateModalOpen(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-subtle">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/75 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Report Title</th>
                <th className="py-3 px-4">Client & Scope</th>
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4">Share Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Title */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-text-primary">{report.title}</div>
                    <div className="text-[11px] text-text-muted mt-0.5 truncate max-w-md">
                      {report.observations ? report.observations.substring(0, 80) + '...' : 'Executive performance review'}
                    </div>
                  </td>

                  {/* Client & Scope */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-text-primary">{report.client.name}</div>
                    <div className="text-[11px] text-text-secondary">
                      {report.campaign ? report.campaign.name : 'All Client Campaigns'}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                    {formatDate(report.createdAt)}
                  </td>

                  {/* Share Status */}
                  <td className="py-3 px-4">
                    {report.isPubliclyShared ? (
                      <div className="flex items-center space-x-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe className="w-3 h-3 mr-1 text-emerald-600" />
                          Live Link
                        </span>
                        <button
                          onClick={() => handleCopyLink(report.shareToken)}
                          title="Copy presentation link"
                          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
                        >
                          {copiedToken === report.shareToken ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <Lock className="w-3 h-3 mr-1 text-slate-500" />
                        Internal Only
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center space-x-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => window.open(`/reports/share/${report.shareToken}`, '_blank')}
                        leftIcon={<ExternalLink className="w-3 h-3" />}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleToggleShare(report)}
                      >
                        {report.isPubliclyShared ? 'Make Private' : 'Share'}
                      </Button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-1.5 rounded text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Generate Client Report */}
      <Dialog
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Client Performance Report"
        description="Creates an immutable snapshot of advertising metrics, budget utilization, and campaign deliverables."
        maxWidth="lg"
      >
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Select Client <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value, campaignId: '' })}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
              required
            >
              <option value="">Choose a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Specific Campaign (Optional)
            </label>
            <select
              value={formData.campaignId}
              onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled={!formData.clientId}
            >
              <option value="">Aggregate All Client Campaigns</option>
              {campaigns
                .filter((c) => !formData.clientId || c.clientId === formData.clientId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Report Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Q4 Growth & ROAS Performance Wrap-up"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Executive Observations & Context
            </label>
            <textarea
              rows={3}
              placeholder="Highlight top performers, creative angles that drove the highest CTR, and audience conversion insights..."
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="w-full rounded-md border border-border bg-white p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Strategic Recommendations for Next Period
            </label>
            <textarea
              rows={3}
              placeholder="Actionable next steps, recommended budget reallocation, new channel testing..."
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              className="w-full rounded-md border border-border bg-white p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isPubliclyShared"
              checked={formData.isPubliclyShared}
              onChange={(e) => setFormData({ ...formData, isPubliclyShared: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isPubliclyShared" className="text-xs text-text-secondary select-none">
              Generate public presentation link for client stakeholder access
            </label>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Generate Report
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
