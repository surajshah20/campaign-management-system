import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Clock,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react';

interface MemberItem {
  membershipId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export const TeamPage: React.FC = () => {
  const { currentAgency, user: currentUser } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CAMPAIGN_MANAGER');
  const [isInviting, setIsInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const [membersData, invitesData] = await Promise.all([
        apiRequest<MemberItem[]>('/api/v1/team/members'),
        apiRequest<InvitationItem[]>('/api/v1/team/invitations').catch(() => []),
      ]);
      setMembers(membersData);
      setInvitations(invitesData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load agency team.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchTeam();
    }
  }, [currentAgency?.id]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      const res = await apiRequest<{ inviteToken: string }>('/api/v1/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      setLastInviteUrl(
        `${window.location.origin}/join?token=${res.inviteToken}`
      );
      setInviteEmail('');
      success('Invitation generated', `Onboarding link ready for ${inviteEmail.trim()}`);
      await fetchTeam();
    } catch (err: any) {
      toastError(err.message || 'Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      await apiRequest(`/api/v1/team/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      info('Invitation revoked');
      await fetchTeam();
    } catch (err: any) {
      toastError(err.message || 'Failed to revoke invitation.');
    }
  };

  const handleCopyInviteLink = async (invitationId: string) => {
    try {
      const res = await apiRequest<{ inviteToken: string }>(
        `/api/v1/team/invitations/${invitationId}/token`
      );
      const joinUrl = `${window.location.origin}/join?token=${res.inviteToken}`;
      await navigator.clipboard.writeText(joinUrl);
      setCopiedInviteId(invitationId);
      success('Link copied', 'Invitation URL copied to clipboard.');
      setTimeout(() => setCopiedInviteId(null), 2500);
    } catch (err: any) {
      toastError(err.message || 'Failed to retrieve invitation link.');
    }
  };

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    try {
      await apiRequest(`/api/v1/team/members/${membershipId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      success('Role updated', 'Member permissions updated successfully.');
      await fetchTeam();
    } catch (err: any) {
      toastError(err.message || 'Failed to update role.');
    }
  };

  const handleRemoveMember = async (membershipId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this agency workspace?`)) {
      return;
    }
    try {
      await apiRequest(`/api/v1/team/members/${membershipId}`, {
        method: 'DELETE',
      });
      info('Member removed', `${name} has been removed from workspace.`);
      await fetchTeam();
    } catch (err: any) {
      toastError(err.message || 'Failed to remove team member.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'AGENCY_OWNER':
        return <Badge variant="default" size="sm">Owner</Badge>;
      case 'AGENCY_ADMIN':
        return <Badge variant="neutral" size="sm">Admin</Badge>;
      case 'CAMPAIGN_MANAGER':
        return <Badge variant="success" size="sm">Campaign Mgr</Badge>;
      case 'DESIGNER':
        return <Badge variant="warning" size="sm">Designer</Badge>;
      case 'CONTENT_WRITER':
        return <Badge variant="neutral" size="sm">Writer</Badge>;
      case 'MARKETING_EXECUTIVE':
        return <Badge variant="outline" size="sm">Marketing Exec</Badge>;
      default:
        return <Badge variant="outline" size="sm">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Team & Role Governance
            </h1>
            <Badge variant="outline" size="sm">
              {members.length} Members
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Manage workspace members, role permissions, and secure invitation links.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          onClick={() => {
            setLastInviteUrl(null);
            setIsInviteOpen(true);
          }}
        >
          Invite Member
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-danger-100 bg-danger-50 p-6 text-center">
          <p className="text-xs text-danger-700 font-medium">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={fetchTeam}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Members Table */}
          <Card className="p-0 bg-white border border-border shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary-600" />
                <span>Active Team Members</span>
              </h2>
              <span className="text-xs text-text-muted">
                {currentAgency?.name}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-border text-text-muted font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => {
                    const isSelf = m.user.id === currentUser?.id;
                    const isOwner = m.role === 'AGENCY_OWNER';

                    return (
                      <tr key={m.membershipId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {m.user.firstName[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary flex items-center">
                                {m.user.firstName} {m.user.lastName}
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] text-text-muted font-normal">
                                    (You)
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-text-secondary">
                                {m.user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            {getRoleBadge(m.role)}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-text-secondary tabular-nums">
                          {formatDate(m.joinedAt)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          {!isOwner && (
                            <div className="flex items-center justify-end space-x-2">
                              <select
                                value={m.role}
                                onChange={(e) =>
                                  handleRoleChange(m.membershipId, e.target.value)
                                }
                                className="h-7 rounded border border-border bg-white px-2 text-[11px] text-text-primary shadow-xs focus-visible:outline-none"
                              >
                                <option value="AGENCY_ADMIN">Admin</option>
                                <option value="CAMPAIGN_MANAGER">Campaign Mgr</option>
                                <option value="DESIGNER">Designer</option>
                                <option value="CONTENT_WRITER">Writer</option>
                                <option value="MARKETING_EXECUTIVE">Marketing Exec</option>
                              </select>

                              <button
                                onClick={() =>
                                  handleRemoveMember(
                                    m.membershipId,
                                    `${m.user.firstName} ${m.user.lastName}`
                                  )
                                }
                                className="p-1 text-text-muted hover:text-danger-600 rounded transition-colors"
                                title="Remove member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pending Invitations Section */}
          <Card className="p-5 bg-white border border-border shadow-subtle space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                <Clock className="w-4 h-4 text-warning-600" />
                <span>Pending Workspace Invitations</span>
              </h2>
              <Badge variant="neutral" size="sm">
                {invitations.length} Pending
              </Badge>
            </div>

            {invitations.length === 0 ? (
              <p className="text-xs text-text-secondary py-3 text-center">
                No active pending invitations.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="py-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-text-muted shrink-0" />
                      <div>
                        <p className="font-semibold text-text-primary">{inv.email}</p>
                        <p className="text-[10px] text-text-secondary">
                          Expires on {formatDate(inv.expiresAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getRoleBadge(inv.role)}
                      <Button
                        size="xs"
                        variant="outline"
                        leftIcon={
                          copiedInviteId === inv.id ? (
                            <Check className="w-3 h-3 text-success-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-text-secondary" />
                          )
                        }
                        onClick={() => handleCopyInviteLink(inv.id)}
                      >
                        {copiedInviteId === inv.id ? (
                          <span className="text-success-600 font-medium">Copied!</span>
                        ) : (
                          'Copy Link'
                        )}
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-danger-600 hover:bg-danger-50 text-[11px]"
                        onClick={() => handleCancelInvite(inv.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite New Agency Member"
        description="Deliver a secure invitation token allowing a team member to join your organization."
      >
        {lastInviteUrl ? (
          <div className="space-y-4">
            <div className="rounded-md border border-success-100 bg-success-50 p-3.5 text-xs text-success-800">
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle className="w-4 h-4 text-success-600" />
                <span>Invitation Generated Successfully</span>
              </div>
              <p className="mt-1 text-[11px] text-success-700">
                Share this secure onboarding link with your team member:
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                readOnly
                value={lastInviteUrl}
                className="h-9 w-full rounded border border-border bg-slate-50 px-2.5 text-xs font-mono text-text-primary"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(lastInviteUrl);
                  alert('Invitation link copied to clipboard!');
                }}
              >
                Copy
              </Button>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setIsInviteOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <Input
              label="Member Work Email *"
              type="email"
              placeholder="colleague@agency.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              autoFocus
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Assigned Role & Permissions *
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none"
              >
                <option value="CAMPAIGN_MANAGER">
                  Campaign Manager — Manage campaigns, tasks, calendars, reports
                </option>
                <option value="DESIGNER">
                  Designer — Upload creative drafts, version iterations
                </option>
                <option value="CONTENT_WRITER">
                  Content Writer — Social captions, copy drafts
                </option>
                <option value="MARKETING_EXECUTIVE">
                  Marketing Executive — Paid ads management & performance
                </option>
                <option value="AGENCY_ADMIN">
                  Agency Admin — Full workspace configuration & invitations
                </option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isInviting}>
                Send Invitation
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};
