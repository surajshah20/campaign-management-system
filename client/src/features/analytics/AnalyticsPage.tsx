import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../lib/utils';
import {
  LineChart as LineChartIcon,
  TrendingUp,
  DollarSign,
  Eye,
  Target,
  Layers,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AnalyticsOverview {
  summary: {
    totalSpend: number;
    totalImpressions: number;
    totalReach: number;
    totalClicks: number;
    totalConversions: number;
    totalLeads: number;
    totalRevenue: number;
    overallRoas: number;
    overallCtr: number;
    overallCpc: number;
    overallCpm: number;
    costPerConversion: number;
  };
  timeseries: Array<{
    date: string;
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  platformComparison: Array<{
    platform: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roas: number;
    ctr: number;
  }>;
  campaignCount: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  META_ADS: 'Meta Ads',
  GOOGLE_ADS: 'Google Ads',
  TIKTOK_ADS: 'TikTok Ads',
  LINKEDIN_ADS: 'LinkedIn Ads',
};

export const AnalyticsPage: React.FC = () => {
  const { currentAgency } = useAuth();
  const currency = currentAgency?.currency || 'NPR';

  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [days, setDays] = useState<number>(30);
  const [platform, setPlatform] = useState<string>('ALL');

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        days: days.toString(),
        platform,
      });

      const res = await apiRequest<AnalyticsOverview>(
        `/api/v1/analytics/overview?${queryParams.toString()}`
      );
      setData(res);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to aggregate analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchAnalytics();
    }
  }, [currentAgency?.id, days, platform]);

  const summary = data?.summary || {
    totalSpend: 0,
    totalImpressions: 0,
    totalReach: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalLeads: 0,
    totalRevenue: 0,
    overallRoas: 0,
    overallCtr: 0,
    overallCpc: 0,
    overallCpm: 0,
    costPerConversion: 0,
  };

  // Format timeseries dates for charts
  const formattedTimeseries = (data?.timeseries || []).map((t) => {
    const parts = t.date.split('-');
    const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : t.date;
    return {
      ...t,
      dateLabel: label,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-text-muted mb-1">
            <span>PERFORMANCE INTELLIGENCE</span>
            <span>/</span>
            <span className="text-text-primary">CROSS-PLATFORM ANALYTICS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Advertising & Campaign Analytics
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Full-funnel attribution, ROAS tracking, and cross-channel efficiency matrix.
          </p>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Filter */}
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-md border border-border bg-white px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-2xs"
          >
            <option value="ALL">All Platforms</option>
            <option value="META_ADS">Meta Ads</option>
            <option value="GOOGLE_ADS">Google Ads</option>
            <option value="TIKTOK_ADS">TikTok Ads</option>
            <option value="LINKEDIN_ADS">LinkedIn Ads</option>
          </select>

          {/* Time Window Buttons */}
          <div className="inline-flex rounded-md border border-border bg-white p-0.5 text-xs font-medium shadow-2xs">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  days === d
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={fetchAnalytics}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Refresh
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

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <>
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Spend */}
            <Card className="p-4 bg-white border border-border shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">Total Media Spend</span>
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
                  {formatCurrency(summary.totalSpend, currency)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                <span>In past {days} days</span>
                <span className="font-medium text-text-secondary">
                  CPM: {formatCurrency(summary.overallCpm, currency)}
                </span>
              </div>
            </Card>

            {/* Attributed Revenue & ROAS */}
            <Card className="p-4 bg-white border border-border shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">Attributed Revenue</span>
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
                  {formatCurrency(summary.totalRevenue, currency)}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {summary.overallRoas}x ROAS
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                <span>Gross Return on Ad Spend</span>
                <span className="font-semibold text-emerald-700">Verified</span>
              </div>
            </Card>

            {/* Total Impressions & Reach */}
            <Card className="p-4 bg-white border border-border shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">Impressions & Reach</span>
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-700">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
                  {summary.totalImpressions.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                <span>Unique Reach: {summary.totalReach.toLocaleString()}</span>
                <span className="font-medium text-text-secondary">
                  Freq:{' '}
                  {summary.totalReach > 0
                    ? (summary.totalImpressions / summary.totalReach).toFixed(1)
                    : '1.0'}
                  x
                </span>
              </div>
            </Card>

            {/* Clicks & Conversions */}
            <Card className="p-4 bg-white border border-border shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">
                  Clicks & Conversions
                </span>
                <div className="p-1.5 rounded-md bg-purple-50 text-purple-700">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
                  {summary.totalClicks.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-text-secondary">
                  {summary.overallCtr}% CTR
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                <span>{summary.totalConversions} Conversions</span>
                <span className="font-medium text-text-secondary">
                  CPA: {formatCurrency(summary.costPerConversion, currency)}
                </span>
              </div>
            </Card>
          </div>

          {/* Visualization 1: Spend vs Revenue Trend AreaChart */}
          <Card className="p-5 bg-white border border-border shadow-subtle">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                  <LineChartIcon className="w-4 h-4 text-primary-600" />
                  <span>Revenue & Spend Trajectory</span>
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Daily financial performance and return velocity over the selected window.
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Revenue ({currency})</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />
                  <span>Ad Spend ({currency})</span>
                </span>
              </div>
            </div>

            {formattedTimeseries.length === 0 ? (
              <div className="py-16 text-center text-xs text-text-secondary">
                No timeseries records found in this window. Log ad metrics or import CSV records in
                Advertising Management.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={formattedTimeseries}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      tickFormatter={(val) =>
                        val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.375rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: any, name: any) => [
                        formatCurrency(Number(value), currency),
                        name === 'revenue' ? 'Revenue' : 'Ad Spend',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="spend"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#spendGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Visualization 2 & Platform Matrix Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Impressions & Clicks BarChart */}
            <Card className="p-5 bg-white border border-border shadow-subtle">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-primary-600" />
                  <span>Impressions vs. Link Clicks</span>
                </h3>
                <span className="text-xs text-text-muted">Daily volume</span>
              </div>

              {formattedTimeseries.length === 0 ? (
                <div className="py-16 text-center text-xs text-text-secondary">
                  No impression data recorded.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formattedTimeseries}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        tickFormatter={(val) =>
                          val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.375rem',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="impressions"
                        name="Impressions"
                        fill="#93c5fd"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar dataKey="clicks" name="Clicks" fill="#4f46e5" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Platform Comparison Matrix */}
            <Card className="p-5 bg-white border border-border shadow-subtle">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-primary-600" />
                  <span>Channel Efficiency Breakdown</span>
                </h3>
                <span className="text-xs text-text-muted">Meta vs Google vs TikTok</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-text-secondary uppercase">
                      <th className="py-2.5 px-3">Network</th>
                      <th className="py-2.5 px-3">Spend</th>
                      <th className="py-2.5 px-3">Clicks / CTR</th>
                      <th className="py-2.5 px-3">Revenue</th>
                      <th className="py-2.5 px-3 text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(data?.platformComparison || []).map((row) => (
                      <tr key={row.platform} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-text-primary">
                          {PLATFORM_LABELS[row.platform] || row.platform}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums font-medium">
                          {formatCurrency(row.spend, currency)}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-text-secondary">
                          {row.clicks.toLocaleString()}{' '}
                          <span className="text-[10px] text-text-muted">({row.ctr}%)</span>
                        </td>
                        <td className="py-2.5 px-3 tabular-nums font-medium text-emerald-700">
                          {formatCurrency(row.revenue, currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              row.roas >= 3.0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : row.roas >= 1.5
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {row.roas}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-md border border-border bg-slate-50/75 p-3 text-[11px] text-text-secondary leading-relaxed">
                ROAS metrics are derived from verified client purchase value / platform media spend.
                Target benchmark is <strong>&gt; 3.0x</strong> for high-converting funnels.
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
