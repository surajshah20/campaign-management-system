import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../lib/utils';
import { RefreshCw } from 'lucide-react';
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
      {/* 1. Header: Clean & Spacious */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Cross-Platform Analytics
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Performance attribution, ROAS tracking, and channel efficiency metrics.
          </p>
        </div>

        {/* Clean Unified Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-8 rounded-md border border-border bg-white px-2.5 text-xs text-text-primary focus:outline-none focus:border-primary-600 shadow-subtle"
          >
            <option value="ALL">All Platforms</option>
            <option value="META_ADS">Meta Ads</option>
            <option value="GOOGLE_ADS">Google Ads</option>
            <option value="TIKTOK_ADS">TikTok Ads</option>
            <option value="LINKEDIN_ADS">LinkedIn Ads</option>
          </select>

          <div className="inline-flex rounded-md border border-border bg-white p-0.5 text-xs font-medium shadow-subtle">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded transition-colors text-xs ${
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
            size="xs"
            variant="outline"
            onClick={fetchAnalytics}
            leftIcon={<RefreshCw className="w-3 h-3 text-text-muted" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-center justify-between rounded-md border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs font-medium text-danger-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          {/* 2. Simplified Consistent KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Media Spend */}
            <Card className="p-4 bg-white border border-border shadow-subtle">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Total Media Spend
              </span>
              <div className="mt-2 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
                {formatCurrency(summary.totalSpend, currency)}
              </div>
              <p className="mt-2 text-xs text-text-secondary pt-2 border-t border-border/60">
                Window: <span className="font-semibold text-text-primary">Past {days} days</span>
              </p>
            </Card>

            {/* Attributed Revenue & ROAS */}
            <Card className="p-4 bg-white border border-border shadow-subtle">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Attributed Revenue
              </span>
              <div className="mt-2 text-2xl font-bold tracking-tight text-success-600 tabular-nums">
                {formatCurrency(summary.totalRevenue, currency)}
              </div>
              <p className="mt-2 text-xs text-text-secondary pt-2 border-t border-border/60">
                Blended Return: <span className="font-semibold text-success-600">{summary.overallRoas}x ROAS</span>
              </p>
            </Card>

            {/* Total Impressions */}
            <Card className="p-4 bg-white border border-border shadow-subtle">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Total Impressions
              </span>
              <div className="mt-2 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
                {summary.totalImpressions.toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-text-secondary pt-2 border-t border-border/60">
                Unique Reach: <span className="font-semibold text-text-primary">{summary.totalReach.toLocaleString()}</span>
              </p>
            </Card>

            {/* Clicks & Conversions */}
            <Card className="p-4 bg-white border border-border shadow-subtle">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Link Clicks
              </span>
              <div className="mt-2 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
                {summary.totalClicks.toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-text-secondary pt-2 border-t border-border/60">
                CTR: <span className="font-semibold text-text-primary">{summary.overallCtr}%</span> • {summary.totalConversions} conv
              </p>
            </Card>
          </div>

          {/* 3. Spend vs Revenue Trajectory AreaChart */}
          <Card className="p-5 bg-white border border-border shadow-subtle">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Revenue & Spend Trajectory
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Daily financial performance and return velocity over the selected {days}-day window.
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-success-600" />
                  <span className="text-text-secondary">Revenue</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary-600" />
                  <span className="text-text-secondary">Spend</span>
                </span>
              </div>
            </div>

            {formattedTimeseries.length === 0 ? (
              <div className="py-16 text-center text-xs text-text-secondary">
                No timeseries telemetry recorded in this date range.
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
                        <stop offset="5%" stopColor="#5145E8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#5145E8" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16835D" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#16835D" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 11, fill: '#667085' }}
                      axisLine={{ stroke: '#E4E7EC' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#667085' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) =>
                        val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E4E7EC',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 16px -2px rgba(16, 24, 40, 0.08)',
                      }}
                      formatter={(value: any, name: any) => [
                        formatCurrency(Number(value), currency),
                        name === 'revenue' ? 'Revenue' : 'Ad Spend',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#16835D"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="spend"
                      stroke="#5145E8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#spendGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* 4. Second Row: Impressions & Platform Channel Efficiency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Volume BarChart */}
            <Card className="p-5 bg-white border border-border shadow-subtle">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Daily Traffic Volume
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Impressions and click distributions across dates.
                  </p>
                </div>
              </div>

              {formattedTimeseries.length === 0 ? (
                <div className="py-16 text-center text-xs text-text-secondary">
                  No impression data recorded.
                </div>
              ) : (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formattedTimeseries}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 11, fill: '#667085' }}
                        axisLine={{ stroke: '#E4E7EC' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#667085' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) =>
                          val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E4E7EC',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="impressions"
                        name="Impressions"
                        fill="#BDB4FE"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="clicks"
                        name="Clicks"
                        fill="#5145E8"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Platform Comparison Matrix */}
            <Card className="p-5 bg-white border border-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      Channel Efficiency Matrix
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Spend and ROAS performance by ad network.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-semibold text-text-muted uppercase">
                        <th className="py-2.5 px-3">Network</th>
                        <th className="py-2.5 px-3">Spend</th>
                        <th className="py-2.5 px-3">Clicks</th>
                        <th className="py-2.5 px-3">Revenue</th>
                        <th className="py-2.5 px-3 text-right">ROAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(data?.platformComparison || []).map((row) => (
                        <tr key={row.platform} className="hover:bg-slate-50 transition-colors">
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
                          <td className="py-2.5 px-3 tabular-nums font-medium text-success-600">
                            {formatCurrency(row.revenue, currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            <span
                              className={`font-semibold ${
                                row.roas >= 3.0
                                  ? 'text-success-600'
                                  : row.roas >= 1.5
                                  ? 'text-warning-600'
                                  : 'text-text-secondary'
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
              </div>

              <div className="mt-4 pt-3 border-t border-border text-[11px] text-text-muted">
                Calculated directly from verified media receipts and client transactions.
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};