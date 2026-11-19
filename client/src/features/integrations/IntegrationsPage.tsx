import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import {
  Puzzle,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Copy,
  Check,
  Unplug,
  Settings2,
  Cloud,
} from 'lucide-react';

interface IntegrationField {
  key: string;
  label: string;
  type: string;
  placeholder: string;
}

interface IntegrationCatalogItem {
  id: string | null;
  provider: string;
  name: string;
  description: string;
  category: string;
  status: string;
  lastSyncAt?: string | null;
  syncStatus?: string | null;
  syncError?: string | null;
  isConfigured: boolean;
  fields: IntegrationField[];
}

interface SyncLogItem {
  id: string;
  integrationId: string;
  status: string;
  recordsProcessed: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  integration: {
    id: string;
    name: string;
    provider: string;
  };
}

export const IntegrationsPage: React.FC = () => {
  const { currentAgency } = useAuth();

  const [integrations, setIntegrations] = useState<IntegrationCatalogItem[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  // Modals
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationCatalogItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsForm, setCredentialsForm] = useState<Record<string, string>>({});
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const [intRes, logsRes] = await Promise.all([
        apiRequest<IntegrationCatalogItem[]>('/api/v1/integrations'),
        apiRequest<SyncLogItem[]>('/api/v1/integrations/logs'),
      ]);

      setIntegrations(intRes || []);
      setSyncLogs(logsRes || []);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load third-party integrations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchIntegrations();
    }
  }, [currentAgency?.id]);

  const handleOpenConfig = (item: IntegrationCatalogItem) => {
    setSelectedIntegration(item);
    const initialValues: Record<string, string> = {};
    item.fields.forEach((f) => {
      initialValues[f.key] = '';
    });
    setCredentialsForm(initialValues);
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntegration) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/integrations/configure', {
        method: 'POST',
        body: JSON.stringify({
          provider: selectedIntegration.provider,
          name: selectedIntegration.name,
          credentials: credentialsForm,
        }),
      });

      setSuccessMsg(`${selectedIntegration.name} connected and verified.`);
      setIsConfigModalOpen(false);
      fetchIntegrations();
    } catch (err: any) {
      alert(err.message || 'Failed to configure integration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;

    try {
      await apiRequest(`/api/v1/integrations/disconnect/${provider}`, {
        method: 'DELETE',
      });
      setSuccessMsg(`Disconnected ${provider}.`);
      fetchIntegrations();
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect integration');
    }
  };

  const handleTriggerSync = async (provider: string) => {
    try {
      setSyncingProvider(provider);
      const res = await apiRequest<{ recordsProcessed: number; completedAt: string }>(
        '/api/v1/integrations/sync',
        {
          method: 'POST',
          body: JSON.stringify({ provider }),
        }
      );

      setSuccessMsg(
        `Synchronized ${provider}: Ingested ${res.recordsProcessed} campaign metric sets.`
      );
      fetchIntegrations();
    } catch (err: any) {
      alert(err.message || `Failed to sync ${provider}`);
    } finally {
      setSyncingProvider(null);
    }
  };

  const webhookBaseUrl = `${window.location.origin}/api/v1/integrations/webhooks/`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-text-muted mb-1">
            <span>PLATFORM CONNECTORS</span>
            <span>/</span>
            <span className="text-text-primary">INTEGRATIONS & STORAGE</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Third-Party Integrations & Storage
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Connect Meta Marketing API, Google Ads API, TikTok Ads, and cloud asset storage adapters.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchIntegrations}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Connectors
        </Button>
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

      {/* Integrations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((item) => {
            const isConnected = item.status === 'CONNECTED';
            const isSyncing = syncingProvider === item.provider;

            return (
              <Card
                key={item.provider}
                className="p-5 bg-white border border-border shadow-subtle flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-md bg-slate-100 text-slate-700">
                        {item.category === 'STORAGE' ? (
                          <HardDrive className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Puzzle className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">{item.name}</h3>
                        <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                          isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                    {item.description}
                  </p>

                  {isConnected && (
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                      <span>Last Synced:</span>
                      <span className="font-medium text-text-primary">
                        {item.lastSyncAt ? formatDate(item.lastSyncAt) : 'Never'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between space-x-2 border-t border-border">
                  {isConnected ? (
                    <>
                      {item.category === 'ADVERTISING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2.5"
                          disabled={isSyncing}
                          onClick={() => handleTriggerSync(item.provider)}
                          leftIcon={
                            <RefreshCw
                              className={`w-3 h-3 ${isSyncing ? 'animate-spin text-primary-600' : ''}`}
                            />
                          }
                        >
                          {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                      )}
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2 text-text-secondary hover:text-text-primary"
                          onClick={() => handleOpenConfig(item)}
                          title="Update Credentials"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDisconnect(item.provider)}
                          title="Disconnect"
                        >
                          <Unplug className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs h-8"
                      onClick={() => handleOpenConfig(item)}
                    >
                      Connect Integration
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sync Execution History */}
      <Card className="p-5 bg-white border border-border shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-text-primary">
              Recent Synchronization Events
            </h3>
          </div>
          <span className="text-xs text-text-muted">Live Platform Audit Logs</span>
        </div>

        {syncLogs.length === 0 ? (
          <p className="text-xs text-text-secondary py-4 text-center">
            No synchronization events logged yet. Trigger a sync on any connected provider.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-text-secondary uppercase">
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Records Ingested</th>
                  <th className="py-2.5 px-3">Started At</th>
                  <th className="py-2.5 px-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {syncLogs.slice(0, 8).map((log) => {
                  const durationMs = log.completedAt
                    ? new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()
                    : 0;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-text-primary">
                        {log.integration.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 tabular-nums font-medium text-text-secondary">
                        {log.recordsProcessed} campaigns updated
                      </td>
                      <td className="py-2.5 px-3 text-text-muted tabular-nums">
                        {formatDate(log.startedAt)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-text-muted">
                        {durationMs > 0 ? `${(durationMs / 1000).toFixed(1)}s` : '< 1s'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inbound Webhook Box */}
      <div className="rounded-lg border border-border bg-slate-50 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-primary flex items-center space-x-1.5">
            <Cloud className="w-3.5 h-3.5 text-primary-600" />
            <span>Inbound Platform Webhook Endpoint</span>
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(webhookBaseUrl);
              setCopiedWebhook(true);
              setTimeout(() => setCopiedWebhook(false), 2000);
            }}
            className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedWebhook ? 'Copied' : 'Copy Endpoint'}</span>
          </button>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Configure this URL in your Meta Graph API or Google Ads Webhook settings for automated real-time event streaming:
        </p>
        <code className="block bg-white p-2.5 rounded border border-border text-[11px] font-mono text-text-primary select-all">
          {webhookBaseUrl}:provider
        </code>
      </div>

      {/* MODAL: Configure Integration */}
      <Dialog
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={`Configure ${selectedIntegration?.name || ''}`}
        description="Enter your API credentials and account tokens. All sensitive tokens are securely masked."
        maxWidth="md"
      >
        <form onSubmit={handleSaveConfig} className="space-y-4">
          {selectedIntegration?.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-text-primary mb-1">
                {field.label} <span className="text-red-500">*</span>
              </label>
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={credentialsForm[field.key] || ''}
                onChange={(e) =>
                  setCredentialsForm({ ...credentialsForm, [field.key]: e.target.value })
                }
                required
              />
            </div>
          ))}

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfigModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Verify & Connect
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
