import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import {
  CalendarDays,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';

interface ContentPostItem {
  id: string;
  title: string;
  caption?: string;
  platform: string;
  status: string;
  scheduledDate?: string;
  publishedAt?: string;
  client: { id: string; name: string };
  campaign?: { id: string; name: string } | null;
  creator?: { id: string; firstName: string; lastName: string } | null;
  versions: any[];
}

export const ContentCalendarPage: React.FC = () => {
  const { currentAgency } = useAuth();

  const [posts, setPosts] = useState<ContentPostItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    campaignId: '',
    title: '',
    caption: '',
    platform: 'INSTAGRAM',
    status: 'DRAFT',
    scheduledDate: '',
    mediaUrl: '',
    mediaType: 'image',
  });

  // Post Detail & Version History Modal
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (platformFilter !== 'ALL') params.set('platform', platformFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const [postsData, clientsData, campaignsData] = await Promise.all([
        apiRequest<ContentPostItem[]>(`/api/v1/content?${params.toString()}`),
        apiRequest<any[]>('/api/v1/clients'),
        apiRequest<any[]>('/api/v1/campaigns'),
      ]);

      setPosts(postsData);
      setClients(clientsData);
      setCampaigns(campaignsData);
      if (clientsData.length > 0 && !formData.clientId) {
        setFormData((prev) => ({ ...prev, clientId: clientsData[0].id }));
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch content posts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchPosts();
    }
  }, [currentAgency?.id, platformFilter, statusFilter]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.clientId) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/content', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setIsModalOpen(false);
      setFormData({
        clientId: clients[0]?.id || '',
        campaignId: '',
        title: '',
        caption: '',
        platform: 'INSTAGRAM',
        status: 'DRAFT',
        scheduledDate: '',
        mediaUrl: '',
        mediaType: 'image',
      });
      await fetchPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPostDetails = async (postId: string) => {
    try {
      const post = await apiRequest(`/api/v1/content/${postId}`);
      setSelectedPost(post);
    } catch (err: any) {
      alert(err.message || 'Failed to load post version history.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success" size="sm">Published</Badge>;
      case 'APPROVED':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'CLIENT_APPROVAL':
        return <Badge variant="warning" size="sm">In Client Review</Badge>;
      case 'INTERNAL_REVIEW':
        return <Badge variant="warning" size="sm">Internal Review</Badge>;
      case 'SCHEDULED':
        return <Badge variant="default" size="sm">Scheduled</Badge>;
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
              Content Studio & Social Calendar
            </h1>
            <Badge variant="outline" size="sm">
              {posts.length} Posts
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Plan, draft, iterate creative revisions, and manage client approval pipelines.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Filters */}
          <div className="flex items-center space-x-1 border border-border bg-white rounded-md p-1 shadow-subtle">
            {['ALL', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'LINKEDIN'].map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  platformFilter === p
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {p === 'ALL' ? 'All Platforms' : p}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center space-x-1 border border-border bg-white rounded-md p-1 shadow-subtle">
            {['ALL', 'CLIENT_APPROVAL', 'APPROVED', 'DRAFT'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter === s
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Post Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-danger-100 bg-danger-50 p-6 text-center">
          <p className="text-xs text-danger-700 font-medium">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={fetchPosts}>
            Retry
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-6 h-6 text-primary-600" />}
          title="No content posts drafted"
          description="Draft your first creative post, attach media assets, and submit for client sign-off."
          actionLabel="Create Post"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => {
            const latestVersion = post.versions?.[0];

            return (
              <Card
                key={post.id}
                hoverable
                onClick={() => openPostDetails(post.id)}
                className="flex flex-col justify-between border border-border bg-white p-4 shadow-subtle space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <Badge variant="default" size="sm">
                      {post.platform}
                    </Badge>
                    <div>{getStatusBadge(post.status)}</div>
                  </div>

                  {/* Media Preview Box */}
                  <div className="mt-3 relative h-40 w-full overflow-hidden rounded-md bg-slate-100 border border-border">
                    {latestVersion?.mediaUrl ? (
                      <img
                        src={latestVersion.mediaUrl}
                        alt="Creative thumbnail"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-text-muted">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      V{latestVersion?.versionNumber || 1}
                    </div>
                  </div>

                  <h3 className="mt-2.5 text-xs font-semibold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-1">
                    {post.title}
                  </h3>

                  <p className="mt-1 text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                    {post.caption || 'No copy drafted.'}
                  </p>
                </div>

                <div className="border-t border-border pt-2 flex items-center justify-between text-[11px] text-text-secondary">
                  <span className="truncate max-w-[140px]">
                    {post.client.name}
                  </span>
                  <span className="tabular-nums">
                    {post.scheduledDate ? formatDate(post.scheduledDate) : 'Unscheduled'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Post Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Draft Creative Post"
        description="Draft social copy, attach visual creative previews, and initiate the approval workflow."
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
                Campaign (Optional)
              </label>
              <select
                value={formData.campaignId}
                onChange={(e) =>
                  setFormData({ ...formData, campaignId: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none"
              >
                <option value="">None / Standalone</option>
                {campaigns.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Post Title *"
              placeholder="e.g. Summer Cold Brew Product Reel"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Social Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="TIKTOK">TikTok</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="TWITTER_X">X (Twitter)</option>
              </select>
            </div>
          </div>

          <Input
            label="Media Asset Preview URL"
            placeholder="https://images.unsplash.com/photo-..."
            value={formData.mediaUrl}
            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
            helperText="Direct image or video thumbnail URL for creative inspection"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-primary">
              Post Caption Copy & Hashtags
            </label>
            <textarea
              rows={3}
              placeholder="Write engaging caption copy, promotional details, and hashtags..."
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              className="w-full rounded-md border border-border p-2.5 text-xs text-text-primary focus-visible:outline-none shadow-subtle"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Scheduled Publish Date"
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
              }
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Initial Workflow Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="INTERNAL_REVIEW">Internal Review</option>
                <option value="CLIENT_APPROVAL">Submit for Client Approval</option>
              </select>
            </div>
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
              Save Post
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Post Details & Version History Modal */}
      {selectedPost && (
        <Dialog
          isOpen={Boolean(selectedPost)}
          onClose={() => setSelectedPost(null)}
          title={selectedPost.title}
          description={`Platform: ${selectedPost.platform} • Status: ${selectedPost.status}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
              <span className="text-text-secondary">
                Client: <strong className="text-text-primary">{selectedPost.client?.name}</strong>
              </span>
              <span className="text-text-muted">
                {selectedPost.versions?.length || 1} Version History Iterations
              </span>
            </div>

            {/* Version Carousel / Timeline */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedPost.versions?.map((ver: any) => {
                const approval = ver.approvals?.[0];

                return (
                  <div
                    key={ver.id}
                    className="rounded-lg border border-border bg-slate-50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="rounded bg-primary-600 px-2 py-0.5 text-xs font-bold text-white">
                          Version {ver.versionNumber}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          Created {formatDate(ver.createdAt)} by{' '}
                          {ver.createdBy
                            ? `${ver.createdBy.firstName} ${ver.createdBy.lastName}`
                            : 'Agency'}
                        </span>
                      </div>

                      {approval && (
                        <Badge
                          variant={
                            approval.status === 'APPROVED'
                              ? 'success'
                              : approval.status === 'CHANGES_REQUESTED'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {approval.status}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ver.mediaUrl ? (
                        <div className="h-44 w-full rounded border border-border overflow-hidden bg-black/5">
                          <img
                            src={ver.mediaUrl}
                            alt="Version preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-44 w-full rounded border border-border bg-white flex items-center justify-center text-text-muted text-xs">
                          No visual asset attached
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="rounded border border-border bg-white p-3 text-xs text-text-primary">
                          <p className="font-semibold text-text-muted text-[10px] uppercase mb-1">
                            Caption Copy
                          </p>
                          <p className="whitespace-pre-wrap">{ver.captionCopy || '—'}</p>
                        </div>

                        {approval?.decisionNote && (
                          <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                            <p className="font-semibold text-[10px] uppercase mb-0.5">
                              Client Feedback Note:
                            </p>
                            <p>{approval.decisionNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
