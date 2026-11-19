import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import {
  ShieldCheck,
  CheckCircle,
  MessageSquare,
  Layers,
} from 'lucide-react';

interface PortalApprovalItem {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  decisionNote?: string;
  decidedAt?: string;
  version: {
    id: string;
    versionNumber: number;
    mediaUrl?: string;
    mediaType?: string;
    captionCopy?: string;
    contentPost: {
      id: string;
      title: string;
      platform: string;
      campaign?: { id: string; name: string };
    };
    createdBy?: { firstName: string; lastName: string };
  };
  comments: any[];
}

export const ClientPortalPage: React.FC = () => {
  const [approvals, setApprovals] = useState<PortalApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review Modal State
  const [selectedApproval, setSelectedApproval] = useState<PortalApprovalItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'>('APPROVED');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPortalData = async () => {
    try {
      setIsLoading(true);
      const approvalsData = await apiRequest<PortalApprovalItem[]>('/api/v1/portal/approvals').catch(() => []);
      setApprovals(approvalsData);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;

    try {
      setIsSubmitting(true);
      await apiRequest(`/api/v1/portal/approvals/${selectedApproval.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          status: actionType,
          feedbackText: feedbackText.trim() || undefined,
        }),
      });

      setSelectedApproval(null);
      setFeedbackText('');
      await fetchPortalData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit approval decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = (
    approval: PortalApprovalItem,
    action: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'
  ) => {
    setSelectedApproval(approval);
    setActionType(action);
    setFeedbackText('');
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const decidedApprovals = approvals.filter((a) => a.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-lg border border-border bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-300 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Restricted Client Review Portal</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Creative Sign-off & Content Review
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Review media drafts, inspect captions, and request revisions before campaigns go live.
            </p>
          </div>

          <div className="rounded-md bg-white/10 backdrop-blur-sm px-3.5 py-2 text-right">
            <span className="text-[11px] text-indigo-200 block">Pending Sign-off</span>
            <span className="text-xl font-bold text-white tabular-nums">
              {pendingApprovals.length} Items
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Reviews Queue */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-warning-500" />
              <span>Awaiting Your Review ({pendingApprovals.length})</span>
            </h2>

            {pendingApprovals.length === 0 ? (
              <Card className="p-8 bg-white border border-border text-center">
                <CheckCircle className="w-8 h-8 text-success-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-text-primary">All caught up!</h3>
                <p className="text-xs text-text-secondary mt-1">
                  There are no pending creative assets waiting for your sign-off at this time.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApprovals.map((item) => (
                  <Card
                    key={item.id}
                    className="p-5 bg-white border border-border shadow-subtle flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <Badge variant="default" size="sm">
                          {item.version.contentPost.platform}
                        </Badge>
                        <Badge variant="warning" size="sm">
                          Version {item.version.versionNumber}
                        </Badge>
                      </div>

                      {/* Visual Preview */}
                      {item.version.mediaUrl ? (
                        <div className="h-52 w-full rounded-md border border-border overflow-hidden bg-slate-100">
                          <img
                            src={item.version.mediaUrl}
                            alt="Draft Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-32 w-full rounded-md border border-border bg-slate-50 flex items-center justify-center text-xs text-text-muted">
                          <Layers className="w-5 h-5 mr-1" /> Visual draft attached
                        </div>
                      )}

                      <h3 className="text-sm font-bold text-text-primary">
                        {item.version.contentPost.title}
                      </h3>

                      <div className="rounded border border-border bg-slate-50/70 p-3 text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                        {item.version.captionCopy || 'No caption text provided.'}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-700 border-amber-300 hover:bg-amber-50"
                        leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                        onClick={() => openReviewModal(item, 'CHANGES_REQUESTED')}
                      >
                        Request Changes
                      </Button>

                      <Button
                        size="sm"
                        className="bg-success-600 hover:bg-success-700 text-white"
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                        onClick={() => openReviewModal(item, 'APPROVED')}
                      >
                        Approve Asset
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Decisions History */}
          {decidedApprovals.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h2 className="text-sm font-semibold text-text-primary">
                Review History & Sign-off Audit Trail
              </h2>

              <div className="space-y-2">
                {decidedApprovals.map((item) => (
                  <Card
                    key={item.id}
                    className="p-3.5 bg-white border border-border shadow-subtle flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-text-primary">
                          {item.version.contentPost.title}
                        </span>
                        <Badge variant="outline" size="sm">
                          V{item.version.versionNumber}
                        </Badge>
                        <Badge
                          variant={item.status === 'APPROVED' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </div>
                      {item.decisionNote && (
                        <p className="text-[11px] text-text-secondary">
                          "{item.decisionNote}"
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] text-text-muted tabular-nums">
                      {item.decidedAt ? formatDate(item.decidedAt) : 'Reviewed'}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Feedback Dialog */}
      {selectedApproval && (
        <Dialog
          isOpen={Boolean(selectedApproval)}
          onClose={() => setSelectedApproval(null)}
          title={
            actionType === 'APPROVED'
              ? 'Approve Creative for Publishing'
              : 'Request Creative Changes'
          }
          description={`Submitting decision for ${selectedApproval.version.contentPost.title} (V${selectedApproval.version.versionNumber})`}
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            {actionType === 'APPROVED' ? (
              <div className="rounded-md border border-success-200 bg-success-50 p-3 text-xs text-success-800">
                You are approving this creative asset for scheduled publication. The agency team will be notified immediately.
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Explain the specific modifications required (e.g. typography changes, color adjustment, copy edits). This preserves version history and prompts the creative team for Version {selectedApproval.version.versionNumber + 1}.
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                {actionType === 'APPROVED' ? 'Approval Note (Optional)' : 'Detailed Change Requests *'}
              </label>
              <textarea
                rows={3}
                required={actionType !== 'APPROVED'}
                placeholder={
                  actionType === 'APPROVED'
                    ? 'Looks great, approved for scheduled launch!'
                    : 'Please increase brand logo contrast on the lower right and adjust call to action...'
                }
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full rounded-md border border-border p-2.5 text-xs text-text-primary focus-visible:outline-none shadow-subtle"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedApproval(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={isSubmitting}
                className={
                  actionType === 'APPROVED'
                    ? 'bg-success-600 hover:bg-success-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }
              >
                {actionType === 'APPROVED' ? 'Confirm Approval' : 'Submit Change Request'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
