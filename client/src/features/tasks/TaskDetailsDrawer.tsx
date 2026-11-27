import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../lib/utils';
import {
  X,
  Calendar,
  Building,
  User,
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  FolderGit2,
} from 'lucide-react';

export interface TaskDetail {
  id: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  clientId?: string | null;
  campaignId?: string | null;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  } | null;
  client?: { id: string; name: string; industry?: string } | null;
  campaign?: { id: string; name: string } | null;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  }>;
}

interface TaskDetailsDrawerProps {
  task: TaskDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: TaskDetail['status']) => Promise<void>;
  onUpdateTask: (taskId: string, data: Partial<TaskDetail>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<void>;
  clients: any[];
  campaigns: any[];
  members: any[];
}

export const TaskDetailsDrawer: React.FC<TaskDetailsDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onStatusChange,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  clients,
  campaigns,
  members,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskDetail['priority'],
    status: 'TODO' as TaskDetail['status'],
    dueDate: '',
    clientId: '',
    campaignId: '',
    assigneeId: '',
  });

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        status: task.status || 'TODO',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        clientId: task.clientId || task.client?.id || '',
        campaignId: task.campaignId || task.campaign?.id || '',
        assigneeId: task.assigneeId || task.assignee?.id || '',
      });
      setIsEditing(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'COMPLETED';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

    try {
      setIsSaving(true);
      await onUpdateTask(task.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        priority: editForm.priority,
        status: editForm.status,
        dueDate: editForm.dueDate || undefined,
        clientId: editForm.clientId || undefined,
        campaignId: editForm.campaignId || undefined,
        assigneeId: editForm.assigneeId || undefined,
      });
      setIsEditing(false);
    } catch {
      // Handled in parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsCommentSubmitting(true);
      await onAddComment(task.id, newComment.trim());
      setNewComment('');
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete task "${task.title}"?`)) {
      try {
        setIsDeleting(true);
        await onDeleteTask(task.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getPriorityBadge = (p: TaskDetail['priority']) => {
    switch (p) {
      case 'URGENT':
        return <Badge variant="danger" size="sm">Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="neutral" size="sm">Medium</Badge>;
      case 'LOW':
        return <Badge variant="outline" size="sm">Low</Badge>;
      default:
        return <Badge size="sm">{p}</Badge>;
    }
  };

  const getStatusBadge = (s: TaskDetail['status']) => {
    switch (s) {
      case 'TODO':
        return <Badge variant="neutral" size="sm" dot>To Do</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="default" size="sm" dot>In Progress</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="warning" size="sm" dot>In Review</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" size="sm" dot>Completed</Badge>;
      case 'BLOCKED':
        return <Badge variant="danger" size="sm" dot>Blocked</Badge>;
      default:
        return <Badge size="sm">{s}</Badge>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-border flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-border bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center space-x-2">
              {getPriorityBadge(task.priority)}
              {getStatusBadge(task.status)}
            </div>

            <div className="flex items-center space-x-2">
              {!isEditing && (
                <Button
                  size="xs"
                  variant="outline"
                  leftIcon={<Edit2 className="w-3 h-3 text-text-secondary" />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Task
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white border border-transparent hover:border-border transition-colors"
                title="Close drawer (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Full Task Title - Never Truncated */}
          {isEditing ? (
            <div className="mt-1">
              <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-primary focus:outline-none focus:border-primary-500 shadow-subtle"
                required
              />
            </div>
          ) : (
            <h2 className="text-base font-bold text-text-primary leading-snug break-words">
              {task.title}
            </h2>
          )}
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
          {/* Quick Status Bar */}
          <div className="p-3 rounded-lg border border-border bg-slate-50/50 flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-xs font-medium text-text-secondary">Quick Status:</span>
            <div className="inline-flex rounded-md border border-border bg-white p-0.5 text-xs shadow-subtle">
              {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(task.id, st)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    task.status === st
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
                  }`}
                >
                  {st === 'TODO'
                    ? 'To Do'
                    : st === 'IN_PROGRESS'
                    ? 'In Progress'
                    : st === 'IN_REVIEW'
                    ? 'In Review'
                    : st === 'COMPLETED'
                    ? 'Completed'
                    : 'Blocked'}
                </button>
              ))}
            </div>
          </div>

          {isEditing ? (
            /* Edit Form View */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-primary">
                    Client Brand
                  </label>
                  <select
                    value={editForm.clientId}
                    onChange={(e) => setEditForm({ ...editForm, clientId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-border bg-white px-2.5 py-1 text-xs text-text-primary shadow-subtle focus-visible:outline-none"
                  >
                    <option value="">None / Internal</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-primary">
                    Campaign Link
                  </label>
                  <select
                    value={editForm.campaignId}
                    onChange={(e) => setEditForm({ ...editForm, campaignId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-border bg-white px-2.5 py-1 text-xs text-text-primary shadow-subtle focus-visible:outline-none"
                  >
                    <option value="">None</option>
                    {campaigns.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-primary">
                    Assignee
                  </label>
                  <select
                    value={editForm.assigneeId}
                    onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-border bg-white px-2 py-1 text-xs text-text-primary shadow-subtle focus-visible:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.firstName} {m.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-primary">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        priority: e.target.value as TaskDetail['priority'],
                      })
                    }
                    className="flex h-9 w-full rounded-md border border-border bg-white px-2 py-1 text-xs text-text-primary shadow-subtle focus-visible:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <Input
                  label="Due Date"
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Description & Instructions
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Task specifications, deliverable criteria, links..."
                  className="w-full rounded-md border border-border bg-white p-2.5 text-xs text-text-primary focus-visible:outline-none focus-visible:border-primary-500 shadow-subtle"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isSaving}>
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            /* Standard View */
            <>
              {/* Properties Matrix */}
              <div>
                <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
                  Task Properties
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Client */}
                  <div className="p-3 rounded-lg border border-border bg-white shadow-subtle">
                    <span className="text-[10px] text-text-muted uppercase font-semibold flex items-center space-x-1">
                      <Building className="w-3 h-3 text-text-muted" />
                      <span>Client Brand</span>
                    </span>
                    <p className="font-semibold text-text-primary mt-1 truncate">
                      {task.client?.name || 'Internal / Non-Client'}
                    </p>
                    {task.client?.industry && (
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {task.client.industry}
                      </p>
                    )}
                  </div>

                  {/* Campaign */}
                  <div className="p-3 rounded-lg border border-border bg-white shadow-subtle">
                    <span className="text-[10px] text-text-muted uppercase font-semibold flex items-center space-x-1">
                      <FolderGit2 className="w-3 h-3 text-text-muted" />
                      <span>Associated Campaign</span>
                    </span>
                    <p className="font-semibold text-text-primary mt-1 truncate">
                      {task.campaign?.name || 'No campaign linked'}
                    </p>
                  </div>

                  {/* Assignee */}
                  <div className="p-3 rounded-lg border border-border bg-white shadow-subtle">
                    <span className="text-[10px] text-text-muted uppercase font-semibold flex items-center space-x-1">
                      <User className="w-3 h-3 text-text-muted" />
                      <span>Assigned Member</span>
                    </span>
                    {task.assignee ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="h-6 w-6 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center border border-primary-200">
                          {task.assignee.firstName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary leading-tight">
                            {task.assignee.firstName} {task.assignee.lastName}
                          </p>
                          <p className="text-[10px] text-text-secondary">
                            {task.assignee.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium text-text-muted italic mt-1">
                        Unassigned
                      </p>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="p-3 rounded-lg border border-border bg-white shadow-subtle">
                    <span className="text-[10px] text-text-muted uppercase font-semibold flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-text-muted" />
                      <span>Deadline</span>
                    </span>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <p
                        className={`font-semibold tabular-nums ${
                          isOverdue ? 'text-danger-600' : 'text-text-primary'
                        }`}
                      >
                        {task.dueDate ? formatDate(task.dueDate) : 'No due date set'}
                      </p>
                      {isOverdue && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-danger-50 text-danger-700 px-1.5 py-0.5 rounded border border-danger-200">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Description */}
              <div>
                <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Scope & Description
                </h3>
                <div className="rounded-lg border border-border bg-slate-50/60 p-3.5 text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                  {task.description ? (
                    task.description
                  ) : (
                    <span className="text-text-muted italic">
                      No description provided for this task. Click "Edit Task" above to add brief specifications.
                    </span>
                  )}
                </div>
              </div>

              {/* Discussion & Comments */}
              <div className="pt-2 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                    <span>Discussion ({task.comments?.length || 0})</span>
                  </h3>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {!task.comments || task.comments.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-border bg-slate-50/50 text-center text-xs text-text-muted">
                      No comments yet. Post an update or ask a question below.
                    </div>
                  ) : (
                    task.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg border border-border bg-white shadow-subtle text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-text-primary flex items-center space-x-1.5">
                            <span className="h-4 w-4 rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold flex items-center justify-center">
                              {c.user?.firstName ? c.user.firstName[0] : 'U'}
                            </span>
                            <span>
                              {c.user?.firstName} {c.user?.lastName}
                            </span>
                          </span>
                          <span className="text-[10px] text-text-muted tabular-nums">
                            {formatDate(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-text-secondary leading-normal pl-5">
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    placeholder="Type a team update or comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 h-9 rounded-md border border-border px-3 text-xs text-text-primary focus:outline-none focus:border-primary-500 shadow-subtle"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isCommentSubmitting}
                    disabled={!newComment.trim()}
                    rightIcon={<Send className="w-3 h-3" />}
                  >
                    Send
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Button
              size="xs"
              variant="ghost"
              className="text-danger-600 hover:bg-danger-50"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete Task
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
