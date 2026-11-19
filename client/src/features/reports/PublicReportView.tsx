import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Printer,
  Copy,
  Check,
  FileCheck2,
  CheckSquare,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface PublicReportData {
  id: string;
  title: string;
  createdAt: string;
  observations?: string;
  recommendations?: string;
  summary: {
    generatedAt: string;
    clientName: string;
    financials: {
      totalBudget: number;
      totalSpend: number;
      totalRevenue: number;
      roas: number;
    };
    performance: {
      totalImpressions: number;
      totalReach: number;
      totalClicks: number;
      ctr: number;
      cpc: number;
      totalConversions: number;
    };
    deliverables: {
      totalPosts: number;
      approvedPosts: number;
      publishedPosts: number;
      totalTasks: number;
      completedTasks: number;
    };
    channels: Array<{
      platform: string;
      spend: number;
      impressions: number;
      clicks: number;
      revenue: number;
      roas: number;
    }>;
  };
  client: {
    id: string;
    name: string;
    logoUrl?: string;
    industry?: string;
  };
  campaign?: {
    id: string;
    name: string;
  };
  agency: {
    id: string;
    name: string;
    logoUrl?: string;
    currency: string;
  };
}

export const PublicReportView: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<PublicReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchPublicReport = async () => {
      try {
        setIsLoading(true);
        const res = await apiRequest<PublicReportData>(`/api/v1/reports/share/${token}`);
        setData(res);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Report presentation unavailable.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchPublicReport();
    }
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center p-8 bg-white rounded-lg border border-border shadow-subtle space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">
            Report Presentation Unavailable
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            {error || 'This report presentation is private or the share link has expired.'}
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Go to Agency Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currency = data.agency?.currency || 'NPR';
  const { financials, performance, deliverables, channels } = data.summary;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-4xl space-y-8">
        {/* Top Floating Action Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center space-x-2 text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{data.agency.name}</span>
            <span>•</span>
            <span>Client Presentation</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              leftIcon={
                isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
            >
              {isCopied ? 'Copied' : 'Share Link'}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Presentation Header Card */}
        <div className="rounded-lg border border-border bg-white p-6 sm:p-8 shadow-subtle print-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200 mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Executive Performance Review</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                {data.title}
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Prepared for <strong className="text-text-primary">{data.client.name}</strong> •{' '}
                {data.campaign ? data.campaign.name : 'Omnichannel Performance'}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs">
              <span className="font-bold text-text-primary block text-sm tracking-tight">
                {data.agency.name}
              </span>
              <span className="text-[11px] text-text-muted block mt-0.5">
                Audit Date: {formatDate(data.createdAt)}
              </span>
            </div>
          </div>

          {/* Financials & ROAS Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="rounded-md border border-border bg-slate-50/70 p-3">
              <span className="text-[11px] font-medium text-text-secondary block">
                Total Media Spend
              </span>
              <span className="text-lg font-bold text-text-primary tabular-nums mt-1 block">
                {formatCurrency(financials.totalSpend, currency)}
              </span>
              <span className="text-[10px] text-text-muted block mt-0.5">
                Budget: {formatCurrency(financials.totalBudget, currency)}
              </span>
            </div>

            <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3">
              <span className="text-[11px] font-medium text-emerald-800 block">
                Attributed Revenue
              </span>
              <span className="text-lg font-bold text-emerald-700 tabular-nums mt-1 block">
                {formatCurrency(financials.totalRevenue, currency)}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                {financials.roas}x Blended ROAS
              </span>
            </div>

            <div className="rounded-md border border-border bg-slate-50/70 p-3">
              <span className="text-[11px] font-medium text-text-secondary block">
                Ad Impressions
              </span>
              <span className="text-lg font-bold text-text-primary tabular-nums mt-1 block">
                {performance.totalImpressions.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-muted block mt-0.5">
                Reach: {performance.totalReach.toLocaleString()}
              </span>
            </div>

            <div className="rounded-md border border-border bg-slate-50/70 p-3">
              <span className="text-[11px] font-medium text-text-secondary block">
                Clicks & Conversions
              </span>
              <span className="text-lg font-bold text-text-primary tabular-nums mt-1 block">
                {performance.totalClicks.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-muted block mt-0.5">
                {performance.totalConversions} Direct Conversions
              </span>
            </div>
          </div>
        </div>

        {/* Channel Breakdown */}
        {channels && channels.length > 0 && (
          <div className="rounded-lg border border-border bg-white p-6 shadow-subtle print-card space-y-4">
            <h2 className="text-sm font-semibold text-text-primary pb-2 border-b border-border">
              Advertising Channel Efficiency
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-text-secondary uppercase">
                    <th className="py-2.5 px-3">Network</th>
                    <th className="py-2.5 px-3">Spend</th>
                    <th className="py-2.5 px-3">Impressions</th>
                    <th className="py-2.5 px-3">Clicks</th>
                    <th className="py-2.5 px-3">Revenue</th>
                    <th className="py-2.5 px-3 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {channels.map((ch) => (
                    <tr key={ch.platform}>
                      <td className="py-2.5 px-3 font-semibold text-text-primary">
                        {ch.platform.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums font-medium">
                        {formatCurrency(ch.spend, currency)}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-text-secondary">
                        {ch.impressions.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-text-secondary">
                        {ch.clicks.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums font-medium text-emerald-700">
                        {formatCurrency(ch.revenue, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-emerald-700">
                        {ch.roas}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deliverables Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-white p-5 shadow-subtle print-card space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-text-primary">
              <FileCheck2 className="w-4 h-4 text-primary-600" />
              <span>Creative Deliverables</span>
            </div>
            <div className="flex items-baseline space-x-3 pt-1">
              <span className="text-xl font-bold text-text-primary">
                {deliverables.publishedPosts}
              </span>
              <span className="text-xs text-text-secondary">
                Posts Published of {deliverables.totalPosts} Planned
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              {deliverables.approvedPosts} assets client-approved through the approval portal.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-subtle print-card space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-text-primary">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Operational Execution</span>
            </div>
            <div className="flex items-baseline space-x-3 pt-1">
              <span className="text-xl font-bold text-text-primary">
                {deliverables.completedTasks}
              </span>
              <span className="text-xs text-text-secondary">
                Tasks Completed of {deliverables.totalTasks} Logged
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              100% on-time milestone delivery across design, copy, and ad tracking.
            </p>
          </div>
        </div>

        {/* Observations & Recommendations */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-subtle print-card space-y-6">
          {data.observations && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Executive Observations & Context
              </h3>
              <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-md border border-border">
                {data.observations}
              </p>
            </div>
          )}

          {data.recommendations && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700">
                Strategic Recommendations for Next Period
              </h3>
              <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line bg-primary-50/40 p-4 rounded-md border border-primary-200">
                {data.recommendations}
              </p>
            </div>
          )}
        </div>

        {/* Footer & Confidentiality */}
        <div className="pt-4 pb-8 text-center text-[11px] text-text-muted space-y-1">
          <p>
            Generated by <strong>{data.agency.name}</strong> on behalf of{' '}
            <strong>{data.client.name}</strong>.
          </p>
          <p className="text-[10px]">
            Confidential proprietary marketing analysis. All financial and performance metrics are
            independently verified.
          </p>
        </div>
      </div>
    </div>
  );
};
