import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
  Download,
  Receipt,
  Layers,
  Users2,
  HardDrive,
  Building,
} from 'lucide-react';

interface PlanLimit {
  maxClients: number;
  maxTeamMembers: number;
  maxCampaigns: number;
  storageGb: number;
  customBranding: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

interface PlanDef {
  id: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  name: string;
  tagline: string;
  monthlyPriceNpr: number;
  annualPriceNpr: number;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  limits: PlanLimit;
  features: string[];
}

interface SubscriptionData {
  subscription: {
    id: string;
    plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
    billingCycle: 'MONTHLY' | 'ANNUAL';
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    paymentMethodBrand?: string;
    paymentMethodLast4?: string;
    paymentMethodExp?: string;
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      amount: number;
      currency: string;
      status: string;
      billingReason: string;
      paidAt?: string;
      createdAt: string;
    }>;
  };
  plan: PlanDef;
  usage: {
    clients: { current: number; max: number; percentage: number };
    teamMembers: { current: number; max: number; percentage: number };
    campaigns: { current: number; max: number; percentage: number };
    storage: { currentGb: number; maxGb: number; percentage: number };
  };
}

export const BillingPage: React.FC = () => {
  const { currentAgency } = useAuth();
  const currency = currentAgency?.currency || 'NPR';

  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<PlanDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Billing interval toggle (MONTHLY vs ANNUAL)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  // Modals
  const [isUpdateCardModalOpen, setIsUpdateCardModalOpen] = useState(false);
  const [isConfirmPlanModalOpen, setIsConfirmPlanModalOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<PlanDef | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Card update form
  const [cardForm, setCardForm] = useState({
    brand: 'Visa',
    last4: '4242',
    expMonth: '12',
    expYear: '28',
  });

  const fetchBillingData = async () => {
    try {
      setIsLoading(true);
      const [subRes, plansRes] = await Promise.all([
        apiRequest<SubscriptionData>('/api/v1/billing/current'),
        apiRequest<PlanDef[]>('/api/v1/billing/plans'),
      ]);

      setSubData(subRes);
      setPlans(plansRes || []);
      if (subRes?.subscription?.billingCycle) {
        setBillingCycle(subRes.subscription.billingCycle);
      }
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load billing subscription data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchBillingData();
    }
  }, [currentAgency?.id]);

  const handleSelectPlan = (plan: PlanDef) => {
    if (subData?.subscription?.plan === plan.id && subData.subscription.billingCycle === billingCycle) {
      return;
    }
    setTargetPlan(plan);
    setIsConfirmPlanModalOpen(true);
  };

  const handleConfirmPlanChange = async () => {
    if (!targetPlan) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/billing/plan', {
        method: 'POST',
        body: JSON.stringify({
          plan: targetPlan.id,
          billingCycle,
        }),
      });

      setSuccessMsg(`Successfully updated agency subscription to ${targetPlan.name} plan.`);
      setIsConfirmPlanModalOpen(false);
      fetchBillingData();
    } catch (err: any) {
      alert(err.message || 'Failed to change subscription plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/billing/payment-method', {
        method: 'POST',
        body: JSON.stringify(cardForm),
      });

      setSuccessMsg('Payment method updated successfully.');
      setIsUpdateCardModalOpen(false);
      fetchBillingData();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!subData) return;
    const isCanceling = !subData.subscription.cancelAtPeriodEnd;
    const confirmText = isCanceling
      ? 'Are you sure you want to cancel auto-renewal at the end of the current period?'
      : 'Resume automatic subscription renewal?';

    if (!confirm(confirmText)) return;

    try {
      setIsSubmitting(true);
      const endpoint = isCanceling ? '/api/v1/billing/cancel' : '/api/v1/billing/resume';
      await apiRequest(endpoint, { method: 'POST' });

      setSuccessMsg(
        isCanceling
          ? 'Subscription set to cancel at end of billing cycle.'
          : 'Subscription auto-renew successfully resumed.'
      );
      fetchBillingData();
    } catch (err: any) {
      alert(err.message || 'Failed to update auto-renewal settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSub = subData?.subscription;
  const currentPlan = subData?.plan;
  const usage = subData?.usage;
  const invoices = currentSub?.invoices || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-text-muted mb-1">
            <span>COMMERCIAL SAAS</span>
            <span>/</span>
            <span className="text-text-primary">SUBSCRIPTION & BILLING</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Subscription & Usage Quotas
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage your agency workspace plan, resource allowances, payment details, and billing ledger.
          </p>
        </div>

        {/* Currency Pill */}
        <div className="inline-flex items-center space-x-1.5 rounded-md border border-border bg-slate-50 px-3 py-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Currency:</span>
          <span>{currency}</span>
        </div>
      </div>

      {/* Success Notification */}
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

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Active Plan Overview Banner */}
          <div className="rounded-lg border border-border bg-white p-6 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Current Workspace Plan
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
                  {currentPlan?.name} Plan
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                    currentSub?.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {currentSub?.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                {currentSub?.billingCycle === 'ANNUAL'
                  ? formatCurrency(currentPlan?.annualPriceNpr || 0, currency)
                  : formatCurrency(currentPlan?.monthlyPriceNpr || 0, currency)}
                <span className="text-xs font-normal text-text-secondary ml-1">
                  /{currentSub?.billingCycle === 'ANNUAL' ? 'year' : 'month'}
                </span>
              </h2>
              <p className="text-xs text-text-secondary">
                {currentSub?.cancelAtPeriodEnd ? (
                  <span className="text-rose-600 font-medium">
                    Auto-renew disabled. Access ends on {formatDate(currentSub?.currentPeriodEnd)}.
                  </span>
                ) : (
                  <span>
                    Renews automatically on{' '}
                    <strong className="text-text-primary">
                      {formatDate(currentSub?.currentPeriodEnd)}
                    </strong>
                    .
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAutoRenew}
                disabled={isSubmitting}
              >
                {currentSub?.cancelAtPeriodEnd ? 'Resume Auto-Renew' : 'Cancel Renewal'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const enterprise = plans.find((p) => p.id === 'ENTERPRISE');
                  if (enterprise) handleSelectPlan(enterprise);
                }}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Upgrade to Enterprise
              </Button>
            </div>
          </div>

          {/* Real-Time Resource Quota Gauges */}
          {usage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Clients Gauge */}
              <Card className="p-4 bg-white border border-border shadow-subtle">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-medium flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-primary-600" />
                    <span>Client Workspaces</span>
                  </span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {usage.clients.current} /{' '}
                    {usage.clients.max === -1 ? '∞' : usage.clients.max}
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      usage.clients.percentage > 85 ? 'bg-amber-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${usage.clients.percentage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                  <span>
                    {usage.clients.max === -1
                      ? 'Unlimited clients'
                      : `${usage.clients.max - usage.clients.current} slots remaining`}
                  </span>
                  <span className="font-medium">{usage.clients.percentage}%</span>
                </div>
              </Card>

              {/* Team Members Gauge */}
              <Card className="p-4 bg-white border border-border shadow-subtle">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-medium flex items-center space-x-1.5">
                    <Users2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Team Seats</span>
                  </span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {usage.teamMembers.current} /{' '}
                    {usage.teamMembers.max === -1 ? '∞' : usage.teamMembers.max}
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${usage.teamMembers.percentage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                  <span>
                    {usage.teamMembers.max === -1
                      ? 'Unlimited team seats'
                      : `${usage.teamMembers.max - usage.teamMembers.current} seats available`}
                  </span>
                  <span className="font-medium">{usage.teamMembers.percentage}%</span>
                </div>
              </Card>

              {/* Active Campaigns Gauge */}
              <Card className="p-4 bg-white border border-border shadow-subtle">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-medium flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Campaign Quota</span>
                  </span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {usage.campaigns.current} /{' '}
                    {usage.campaigns.max === -1 ? '∞' : usage.campaigns.max}
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${usage.campaigns.percentage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                  <span>
                    {usage.campaigns.max === -1
                      ? 'Unlimited campaigns'
                      : `${usage.campaigns.max - usage.campaigns.current} left`}
                  </span>
                  <span className="font-medium">{usage.campaigns.percentage}%</span>
                </div>
              </Card>

              {/* Storage Gauge */}
              <Card className="p-4 bg-white border border-border shadow-subtle">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-medium flex items-center space-x-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cloud Storage</span>
                  </span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {usage.storage.currentGb} GB / {usage.storage.maxGb} GB
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${usage.storage.percentage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                  <span>CDN media delivery</span>
                  <span className="font-medium">{usage.storage.percentage}%</span>
                </div>
              </Card>
            </div>
          )}

          {/* Pricing Tier Selector */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold tracking-tight text-text-primary">
                  Agency OS Commercial Plans
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Upgrade or switch your agency tier to expand client limits and unlock white-labeling.
                </p>
              </div>

              {/* Monthly vs Annual Toggle */}
              <div className="inline-flex items-center rounded-lg border border-border bg-slate-100 p-0.5 text-xs font-semibold shadow-2xs">
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    billingCycle === 'MONTHLY'
                      ? 'bg-white text-text-primary shadow-subtle'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle('ANNUAL')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1.5 ${
                    billingCycle === 'ANNUAL'
                      ? 'bg-white text-text-primary shadow-subtle'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => {
                const isCurrent = currentSub?.plan === p.id;
                const isGrowth = p.id === 'GROWTH';
                const price =
                  billingCycle === 'ANNUAL'
                    ? Math.round(p.annualPriceNpr / 12)
                    : p.monthlyPriceNpr;

                return (
                  <Card
                    key={p.id}
                    className={`relative p-6 bg-white border transition-all flex flex-col justify-between ${
                      isGrowth
                        ? 'border-primary-500 shadow-md ring-1 ring-primary-500/20'
                        : 'border-border shadow-subtle hover:border-slate-300'
                    }`}
                  >
                    {isGrowth && (
                      <span className="absolute -top-3 right-6 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white shadow-2xs uppercase tracking-wider">
                        <Zap className="w-3 h-3 fill-white" />
                        <span>Most Popular</span>
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-bold text-text-primary">{p.name}</h4>
                        <p className="text-xs text-text-secondary mt-1 min-h-[32px]">
                          {p.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">
                            {formatCurrency(price, currency)}
                          </span>
                          <span className="text-xs text-text-secondary">/ month</span>
                        </div>
                        {billingCycle === 'ANNUAL' && (
                          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                            Billed annually ({formatCurrency(p.annualPriceNpr, currency)}/yr)
                          </span>
                        )}
                      </div>

                      {/* Feature Checklist */}
                      <ul className="space-y-2 pt-2 border-t border-border text-xs text-text-secondary">
                        {p.features.map((f, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <Check className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      <Button
                        variant={isCurrent ? 'outline' : isGrowth ? 'primary' : 'outline'}
                        className="w-full text-xs"
                        disabled={isCurrent && currentSub?.billingCycle === billingCycle}
                        onClick={() => handleSelectPlan(p)}
                      >
                        {isCurrent && currentSub?.billingCycle === billingCycle
                          ? 'Current Active Plan'
                          : `Switch to ${p.name}`}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Payment Method & Invoices Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            {/* Payment Method Card */}
            <Card className="p-5 bg-white border border-border shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-primary-600" />
                  <h3 className="text-sm font-semibold text-text-primary">Payment Method</h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 px-2"
                  onClick={() => setIsUpdateCardModalOpen(true)}
                >
                  Edit Card
                </Button>
              </div>

              <div className="rounded-md border border-border bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    {currentSub?.paymentMethodBrand || 'Credit Card'}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-white border border-border px-2 py-0.5 rounded text-text-secondary">
                    Default
                  </span>
                </div>
                <div className="font-mono text-sm tracking-wider text-text-primary">
                  •••• •••• •••• {currentSub?.paymentMethodLast4 || '4242'}
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>Expires {currentSub?.paymentMethodExp || '12/28'}</span>
                  <span className="flex items-center text-emerald-600 space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Encrypted</span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-text-muted leading-relaxed">
                Invoices are billed automatically to this card at the beginning of each billing
                cycle.
              </p>
            </Card>

            {/* Invoices Ledger Table */}
            <Card className="lg:col-span-2 p-5 bg-white border border-border shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-primary-600" />
                  <h3 className="text-sm font-semibold text-text-primary">Billing Invoices</h3>
                </div>
                <span className="text-xs text-text-muted">{invoices.length} Invoices</span>
              </div>

              {invoices.length === 0 ? (
                <p className="text-xs text-text-secondary py-6 text-center">
                  No billing invoices issued yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-semibold text-text-secondary uppercase">
                        <th className="py-2.5 px-3">Invoice Number</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-text-primary">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary">
                            {formatDate(inv.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-text-primary tabular-nums">
                            {formatCurrency(inv.amount, inv.currency || currency)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 px-2"
                              onClick={() => window.print()}
                              leftIcon={<Download className="w-3 h-3" />}
                            >
                              PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* MODAL 1: Confirm Plan Change */}
      <Dialog
        isOpen={isConfirmPlanModalOpen}
        onClose={() => setIsConfirmPlanModalOpen(false)}
        title={`Confirm Plan Switch: ${targetPlan?.name || ''}`}
        description="Review your plan adjustment, new quotas, and effective billing schedule."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-slate-50 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Target Plan:</span>
              <span className="font-bold text-text-primary">{targetPlan?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Billing Schedule:</span>
              <span className="font-semibold text-text-primary capitalize">{billingCycle.toLowerCase()}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-text-secondary">Total Recurring Price:</span>
              <span className="font-bold text-base text-primary-700">
                {formatCurrency(
                  billingCycle === 'ANNUAL'
                    ? targetPlan?.annualPriceNpr || 0
                    : targetPlan?.monthlyPriceNpr || 0,
                  currency
                )}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-text-secondary leading-relaxed">
            Your new allowances will be applied immediately. If upgrading, prorated charges will be
            invoiced to your default card.
          </p>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmPlanModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmPlanChange}
            >
              Confirm Plan Switch
            </Button>
          </div>
        </div>
      </Dialog>

      {/* MODAL 2: Update Payment Method */}
      <Dialog
        isOpen={isUpdateCardModalOpen}
        onClose={() => setIsUpdateCardModalOpen(false)}
        title="Update Billing Card"
        description="Enter new card credentials for automated SaaS subscription renewal."
        maxWidth="md"
      >
        <form onSubmit={handleUpdatePaymentMethod} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Card Brand</label>
            <select
              value={cardForm.brand}
              onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="American Express">American Express</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Card Last 4 Digits
            </label>
            <Input
              maxLength={4}
              value={cardForm.last4}
              onChange={(e) => setCardForm({ ...cardForm, last4: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Exp Month (MM)
              </label>
              <Input
                maxLength={2}
                placeholder="12"
                value={cardForm.expMonth}
                onChange={(e) => setCardForm({ ...cardForm, expMonth: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Exp Year (YY)
              </label>
              <Input
                maxLength={4}
                placeholder="28"
                value={cardForm.expYear}
                onChange={(e) => setCardForm({ ...cardForm, expYear: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUpdateCardModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Payment Card
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
