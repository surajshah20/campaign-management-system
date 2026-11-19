import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../lib/utils';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Globe,
  UserCheck,
  Megaphone,
  FileText,
  Lock,
  Edit2,
  Trash2,
} from 'lucide-react';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'portal'>('overview');

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClientDetails = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest(`/api/v1/clients/${id}`);
      setClient(data);
      setEditFormData({
        name: data.name,
        industry: data.industry || '',
        contactPerson: data.contactPerson || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        status: data.status,
        internalNotes: data.internalNotes || '',
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load client workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchClientDetails();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await apiRequest(`/api/v1/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(editFormData),
      });
      setIsEditOpen(false);
      await fetchClientDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${client?.name}" and all associated data? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiRequest(`/api/v1/clients/${id}`, { method: 'DELETE' });
      navigate('/clients');
    } catch (err: any) {
      alert(err.message || 'Failed to delete client.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="rounded-lg border border-danger-100 bg-danger-50 p-6 text-center">
        <p className="text-xs text-danger-700 font-medium">{error || 'Client not found.'}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/clients"
        className="inline-flex items-center text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Clients Directory
      </Link>

      {/* Header Banner Card */}
      <Card className="bg-white border border-border p-6 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-50 font-bold text-lg text-primary-700 shadow-xs">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold tracking-tight text-text-primary">
                  {client.name}
                </h1>
                <Badge
                  variant={client.status === 'ACTIVE' ? 'success' : 'warning'}
                  size="sm"
                >
                  {client.status}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary flex items-center mt-1">
                <Building className="w-3.5 h-3.5 mr-1 text-text-muted" />
                <span>{client.industry || 'General Industry'}</span>
                <span className="mx-2">•</span>
                <span>Created on {formatDate(client.createdAt)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Details
            </Button>
            <Button
              size="sm"
              variant="danger"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex border-b border-border space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Overview & Coordinates
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'campaigns'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>Marketing Campaigns</span>
            <Badge variant="neutral" size="sm">
              {client.campaigns?.length || 0}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('portal')}
            className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'portal'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Lock className="w-3 h-3 text-text-muted" />
            <span>Client Portal Access</span>
            <Badge variant="neutral" size="sm">
              {client.members?.length || 0}
            </Badge>
          </button>
        </div>
      </Card>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Details */}
          <Card className="p-5 bg-white border border-border shadow-subtle space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Contact Coordinates
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-text-muted block">Contact Person</span>
                <span className="font-medium text-text-primary flex items-center mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                  {client.contactPerson || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-text-muted block">Email Address</span>
                <span className="font-medium text-text-primary flex items-center mt-0.5">
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="hover:underline">
                      {client.email}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-text-muted block">Phone</span>
                <span className="font-medium text-text-primary flex items-center mt-0.5">
                  <Phone className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
                  {client.phone || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-text-muted block">Website</span>
                <span className="font-medium text-primary-600 flex items-center mt-0.5">
                  <Globe className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
                  {client.website ? (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline truncate"
                    >
                      {client.website}
                    </a>
                  ) : (
                    <span className="text-text-secondary">Not provided</span>
                  )}
                </span>
              </div>
            </div>
          </Card>

          {/* Internal Notes & Telemetry */}
          <div className="md:col-span-2 space-y-4">
            <Card className="p-5 bg-white border border-border shadow-subtle space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Internal Agency Notes & Guidelines</span>
              </h2>
              <div className="rounded-md border border-border bg-slate-50 p-4 text-xs text-text-primary leading-relaxed whitespace-pre-wrap font-sans">
                {client.internalNotes || 'No internal notes recorded for this client yet.'}
              </div>
            </Card>

            <Card className="p-5 bg-white border border-border shadow-subtle">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Assigned Account Manager
              </h2>
              {client.assignedManager ? (
                <div className="flex items-center space-x-3 rounded-md border border-border p-3 bg-white">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-xs text-primary-700">
                    {client.assignedManager.firstName[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      {client.assignedManager.firstName} {client.assignedManager.lastName}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {client.assignedManager.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary">
                  No dedicated account manager assigned.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <Card className="p-5 bg-white border border-border shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
              <Megaphone className="w-4 h-4 text-primary-600" />
              <span>Client Campaigns</span>
            </h2>
            <Button
              size="sm"
              onClick={() => alert('New Campaign creation wizard will launch in Phase 3.')}
            >
              + Create Campaign
            </Button>
          </div>

          <div className="space-y-3">
            {client.campaigns?.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">
                No marketing campaigns have been set up for this client yet.
              </p>
            ) : (
              client.campaigns.map((camp: any) => (
                <div
                  key={camp.id}
                  className="flex items-center justify-between rounded-md border border-border p-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-text-primary">
                        {camp.name}
                      </span>
                      <Badge variant="success" size="sm">
                        {camp.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      {camp.description || 'Omnichannel digital campaign'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-text-secondary">
                    <div className="text-right">
                      <span className="font-semibold text-text-primary tabular-nums block">
                        {camp._count?.tasks || 0} tasks
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {camp._count?.contentPosts || 0} posts
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Client Portal Access Tab */}
      {activeTab === 'portal' && (
        <Card className="p-5 bg-white border border-border shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                <Lock className="w-4 h-4 text-primary-600" />
                <span>Restricted Client Portal Members</span>
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Authorized client contacts who can review and approve creative drafts in the client portal.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => alert('Client user invitation modal is available in Phase 4.')}
            >
              + Authorize Client Contact
            </Button>
          </div>

          <div className="space-y-2">
            {client.members?.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">
                No client portal logins assigned yet.
              </p>
            ) : (
              client.members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      {member.user.firstName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    Can Approve Creatives
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Edit Client Modal */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Client Organization"
        description="Update corporate details, account ownership, and internal guidelines."
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Client Name"
            value={editFormData.name || ''}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Industry"
              value={editFormData.industry || ''}
              onChange={(e) =>
                setEditFormData({ ...editFormData, industry: e.target.value })
              }
            />
            <Input
              label="Contact Person"
              value={editFormData.contactPerson || ''}
              onChange={(e) =>
                setEditFormData({ ...editFormData, contactPerson: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={editFormData.email || ''}
              onChange={(e) =>
                setEditFormData({ ...editFormData, email: e.target.value })
              }
            />
            <Input
              label="Phone"
              value={editFormData.phone || ''}
              onChange={(e) =>
                setEditFormData({ ...editFormData, phone: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Website"
              value={editFormData.website || ''}
              onChange={(e) =>
                setEditFormData({ ...editFormData, website: e.target.value })
              }
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Status
              </label>
              <select
                value={editFormData.status || 'ACTIVE'}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, status: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none"
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
              Internal Notes
            </label>
            <textarea
              rows={3}
              value={editFormData.internalNotes || ''}
              onChange={(e) =>
                setEditFormData({ ...editFormData, internalNotes: e.target.value })
              }
              className="w-full rounded-md border border-border p-2 text-xs text-text-primary focus-visible:outline-none shadow-subtle"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
