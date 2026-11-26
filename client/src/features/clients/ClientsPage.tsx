import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Users2,
  Plus,
  Search,
  Building,
  Mail,
  Phone,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';

interface ClientItem {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'PAUSED' | 'INACTIVE';
  assignedManager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  _count: {
    campaigns: number;
    tasks: number;
    contentPosts: number;
    members: number;
  };
}

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAgency } = useAuth();
  const { success, error: toastError } = useToast();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    status: 'ACTIVE',
    internalNotes: '',
  });

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const data = await apiRequest<ClientItem[]>(
        `/api/v1/clients?${params.toString()}`
      );
      setClients(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch agency clients.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchClients();
    }
  }, [currentAgency?.id, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/clients', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setIsModalOpen(false);
      success('Client created', `${formData.name} was added to agency CRM.`);
      setFormData({
        name: '',
        industry: '',
        contactPerson: '',
        email: '',
        phone: '',
        website: '',
        status: 'ACTIVE',
        internalNotes: '',
      });
      await fetchClients();
    } catch (err: any) {
      toastError(err.message || 'Failed to create client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'ONBOARDING':
        return <Badge variant="warning" size="sm">Onboarding</Badge>;
      case 'PAUSED':
        return <Badge variant="neutral" size="sm">Paused</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Client Management (CRM)
            </h1>
            <Badge variant="outline" size="sm">
              {clients.length} Clients
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Maintain client organizations, account managers, and dedicated client portal workspaces.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Client
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 border border-border bg-white rounded-md p-1 shadow-subtle w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'ONBOARDING', 'PAUSED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === status
                  ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
              }`}
            >
              {status === 'ALL' ? 'All Clients' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search clients by name, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-white pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-primary-500 shadow-subtle"
          />
        </form>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-lg" />
          <Skeleton className="h-44 rounded-lg" />
          <Skeleton className="h-44 rounded-lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-danger-100 bg-danger-50 p-6 text-center">
          <p className="text-xs text-danger-700 font-medium">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={fetchClients}>
            Retry
          </Button>
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users2 className="w-6 h-6 text-primary-600" />}
          title="No clients found"
          description={
            searchQuery
              ? `No client matched "${searchQuery}". Try adjusting your filters.`
              : 'Add your first client brand to start launching marketing campaigns and creative reviews.'
          }
          actionLabel="Add Client"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              hoverable
              onClick={() => navigate(`/clients/${client.id}`)}
              className="flex flex-col justify-between border border-border bg-white p-5 shadow-subtle group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-slate-50 font-bold text-xs text-primary-700 shadow-xs">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-1">
                        {client.name}
                      </h3>
                      <p className="text-[11px] text-text-secondary flex items-center mt-0.5">
                        <Building className="w-3 h-3 mr-1 text-text-muted shrink-0" />
                        <span className="truncate">{client.industry || 'General Industry'}</span>
                      </p>
                    </div>
                  </div>
                  <div>{getStatusBadge(client.status)}</div>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-text-secondary">
                  {client.contactPerson && (
                    <div className="flex items-center text-[11px] truncate">
                      <UserCheck className="w-3.5 h-3.5 mr-2 text-text-muted shrink-0" />
                      <span className="font-medium text-text-primary mr-1">
                        {client.contactPerson}
                      </span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center text-[11px] truncate">
                      <Mail className="w-3.5 h-3.5 mr-2 text-text-muted shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-[11px] truncate">
                      <Phone className="w-3.5 h-3.5 mr-2 text-text-muted shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3 text-[11px] text-text-secondary">
                  <span>
                    <strong className="text-text-primary tabular-nums">
                      {client._count.campaigns}
                    </strong>{' '}
                    Campaigns
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-text-primary tabular-nums">
                      {client._count.contentPosts}
                    </strong>{' '}
                    Posts
                  </span>
                </div>
                <span className="inline-flex items-center text-primary-600 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                  Open <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Client Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Client Brand"
        description="Provision a client workspace with contact coordinates and account ownership."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <Input
            label="Client / Business Name *"
            placeholder="e.g. Acme Corporation"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Industry"
              placeholder="e.g. Retail, FinTech, Hospitality"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
            <Input
              label="Contact Person"
              placeholder="Primary representative name"
              value={formData.contactPerson}
              onChange={(e) =>
                setFormData({ ...formData, contactPerson: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Email"
              type="email"
              placeholder="client@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+977-..."
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Website URL"
              placeholder="https://clientwebsite.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Client Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none focus-visible:border-primary-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="PAUSED">Paused</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-primary">
              Internal Agency Notes
            </label>
            <textarea
              rows={2}
              placeholder="Client tone, brand guidelines, key objectives..."
              value={formData.internalNotes}
              onChange={(e) =>
                setFormData({ ...formData, internalNotes: e.target.value })
              }
              className="w-full rounded-md border border-border p-2 text-xs text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-primary-500 shadow-subtle"
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
              Create Client
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
