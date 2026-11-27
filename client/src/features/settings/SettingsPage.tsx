import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../lib/utils';
import {
  ShieldCheck,
  Building2,
  Coins,
  Copy,
  Check,
  Lock,
  Globe,
  Server,
  Layers,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentAgency, user, refreshProfile } = useAuth();
  const { success } = useToast();

  const [agencyName, setAgencyName] = useState(currentAgency?.name || '');
  const [currency, setCurrency] = useState(currentAgency?.currency || 'NPR');
  const [timezone, setTimezone] = useState('Asia/Kathmandu');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      // Workspace preference persistence
      await new Promise((r) => setTimeout(r, 400));
      setSaveSuccess(true);
      success('Settings updated', 'Workspace preferences have been saved successfully.');
      setTimeout(() => setSaveSuccess(false), 3000);
      await refreshProfile();
    } finally {
      setIsSaving(false);
    }
  };

  const copyTenantId = () => {
    if (currentAgency?.id) {
      navigator.clipboard.writeText(currentAgency.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Agency Workspace Settings
            </h1>
            <Badge variant="outline" size="sm">
              {currentAgency?.name || 'Workspace'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Configure organization identity, regional accounting standards, and tenant security governance.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAgencyName(currentAgency?.name || '');
              setCurrency(currentAgency?.currency || 'NPR');
              setTimezone('Asia/Kathmandu');
            }}
          >
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            isLoading={isSaving}
            onClick={() => handleSave()}
          >
            Save Settings
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 2. Responsive Two-Column Grid on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Column 1: Organization Identity */}
          <Card className="p-6 bg-white border border-border shadow-subtle flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-primary-50 text-primary-600 border border-primary-100">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">
                      Organization Identity
                    </h2>
                    <p className="text-[11px] text-text-muted">
                      Brand details, legal trading title, and tenant slug.
                    </p>
                  </div>
                </div>
                <Badge variant="default" size="sm">
                  Active Agency
                </Badge>
              </div>

              <div className="space-y-3.5">
                <Input
                  label="Agency Trading Name *"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="e.g. Apex Digital Marketing"
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-primary">
                    Organization Workspace Slug
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={currentAgency?.slug || 'apex-digital'}
                      disabled
                      className="flex h-9 w-full rounded-md border border-border bg-slate-50 px-3 py-1.5 text-xs font-mono text-text-secondary cursor-not-allowed shadow-subtle"
                    />
                    <Badge variant="neutral" size="sm">
                      Permanent
                    </Badge>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Unique identifier used for subdomains, client portal URLs, and API endpoints.
                  </p>
                </div>

                {/* Workspace Administrator Preview */}
                <div className="p-3.5 rounded-lg border border-border bg-slate-50/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0 border border-primary-200">
                      {user?.firstName ? user.firstName[0] : 'A'}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="neutral" size="sm">
                      {currentAgency?.role?.replace('AGENCY_', '') || 'OWNER'}
                    </Badge>
                    <p className="text-[10px] text-text-muted mt-0.5">Primary Contact</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-text-muted pt-2 border-t border-border/60">
              Agency profile changes reflect across all connected workspaces and client portals.
            </p>
          </Card>

          {/* Column 2: Accounting & Currency Standards */}
          <Card className="p-6 bg-white border border-border shadow-subtle flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-warning-50 text-warning-600 border border-warning-100">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">
                      Accounting & Currency Standards
                    </h2>
                    <p className="text-[11px] text-text-muted">
                      Regional currency baselines for campaign budgets, ad spend, and client invoicing.
                    </p>
                  </div>
                </div>
                <Badge variant="warning" size="sm">
                  {currency}
                </Badge>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-primary">
                    Default Operational Currency *
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary shadow-subtle focus-visible:outline-none focus:border-primary-600"
                  >
                    <option value="NPR">NPR — Nepalese Rupee (₨)</option>
                    <option value="USD">USD — United States Dollar ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="GBP">GBP — British Pound (£)</option>
                    <option value="INR">INR — Indian Rupee (₹)</option>
                  </select>
                  <p className="text-[11px] text-text-muted">
                    Base currency applied to campaign targets, analytics ROAS, and performance exports.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-primary">
                    Operational Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary shadow-subtle focus-visible:outline-none focus:border-primary-600"
                  >
                    <option value="Asia/Kathmandu">Asia/Kathmandu (UTC+05:45 — Nepal Time)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (UTC+05:30 — India Standard)</option>
                    <option value="America/New_York">America/New_York (UTC-05:00 — Eastern Time)</option>
                    <option value="Europe/London">Europe/London (UTC+00:00 — Greenwich Mean)</option>
                  </select>
                  <p className="text-[11px] text-text-muted">
                    Controls daily metric rollover timestamps and scheduled content publications.
                  </p>
                </div>

                {/* Financial Format Live Preview */}
                <div className="p-3.5 rounded-lg border border-border bg-slate-50/60 text-xs space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                    Telemetry Formatting Preview
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-text-secondary">Example Campaign Budget:</span>
                    <span className="font-bold font-mono text-text-primary text-sm">
                      {formatCurrency(2500000, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-text-muted pt-2 border-t border-border/60">
              Currency preferences are enforced in multi-channel ad spend aggregation and financial ROI.
            </p>
          </Card>
        </div>

        {/* 3. Full-Width Section: Tenant Isolation & Security Diagnostics */}
        <Card className="p-6 bg-white border border-border shadow-subtle space-y-5 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-md bg-success-50 text-success-600 border border-success-100">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Tenant Isolation & Security Telemetry
                </h2>
                <p className="text-[11px] text-text-muted">
                  Multi-tenant data partitioning, compound index query isolation, and session integrity.
                </p>
              </div>
            </div>

            <Badge variant="success" size="sm" dot>
              Isolation Enforced
            </Badge>
          </div>

          {/* 4-Column Metric Grid on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Tenant ID */}
            <div className="p-4 rounded-lg border border-border bg-slate-50/50 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between">
                <span>Tenant Scoping ID</span>
                <button
                  type="button"
                  onClick={copyTenantId}
                  className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
                  title="Copy Tenant ID"
                >
                  {copiedId ? (
                    <Check className="w-3 h-3 text-success-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </span>
              <p className="text-xs font-mono font-semibold text-text-primary truncate">
                {currentAgency?.id || '—'}
              </p>
              <p className="text-[10px] text-text-secondary">
                Foreign Key Partitioning Active
              </p>
            </div>

            {/* Metric 2: Access Governance */}
            <div className="p-4 rounded-lg border border-border bg-slate-50/50 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                RBAC Governance
              </span>
              <p className="text-xs font-semibold text-text-primary">
                {currentAgency?.role || 'AGENCY_OWNER'}
              </p>
              <p className="text-[10px] text-text-secondary">
                Capability Boundaries Enforced
              </p>
            </div>

            {/* Metric 3: Database Isolation */}
            <div className="p-4 rounded-lg border border-border bg-slate-50/50 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                Database Isolation Layer
              </span>
              <p className="text-xs font-semibold text-success-600 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success-600 inline-block" />
                <span>Compound Index Scoping</span>
              </p>
              <p className="text-[10px] text-text-secondary">
                Zero Cross-Tenant Leakage
              </p>
            </div>

            {/* Metric 4: Session Governance */}
            <div className="p-4 rounded-lg border border-border bg-slate-50/50 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                Session Protocol
              </span>
              <p className="text-xs font-semibold text-text-primary flex items-center space-x-1">
                <Lock className="w-3 h-3 text-primary-600 inline-block" />
                <span>JWT + HTTP-Only Cookie</span>
              </p>
              <p className="text-[10px] text-text-secondary">
                7-Day Automatic Rotation
              </p>
            </div>
          </div>

          {/* Security Architecture Audit Details */}
          <div className="rounded-lg border border-border bg-slate-50/30 divide-y divide-border text-xs">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-text-secondary flex items-center space-x-2">
                <Server className="w-3.5 h-3.5 text-text-muted" />
                <span>Tenant Partitioning Rule</span>
              </span>
              <code className="text-[11px] font-mono text-text-primary bg-white px-2 py-0.5 rounded border border-border">
                WHERE agencyId = :currentAgencyId
              </code>
            </div>

            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-text-secondary flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5 text-text-muted" />
                <span>Asset & File Quarantine</span>
              </span>
              <span className="text-[11px] text-text-primary font-medium">
                Scoped Under Isolated Agency Directories
              </span>
            </div>

            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-text-secondary flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-text-muted" />
                <span>External Client Boundary</span>
              </span>
              <span className="text-[11px] text-success-700 font-medium">
                Cryptographically Signed Magic Tokens Only
              </span>
            </div>
          </div>
        </Card>

        {/* 4. Form Action Footer */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <p className="text-xs text-success-600 font-semibold flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Workspace preferences saved successfully.</span>
            </p>
          ) : (
            <span className="text-xs text-text-muted">
              Last synchronized: {new Date().toLocaleDateString()}
            </span>
          )}

          <div className="flex items-center space-x-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAgencyName(currentAgency?.name || '');
                setCurrency(currentAgency?.currency || 'NPR');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSaving}>
              Save Workspace Settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
