import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import {
  Plus,
  Kanban,
  List,
  Calendar,
  Building,
  MessageSquare,
  Send,
} from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  dueDate?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  } | null;
  client?: { id: string; name: string } | null;
  campaign?: { id: string; name: string } | null;
  _count: { comments: number };
}

const KANBAN_COLUMNS: {
  id: TaskItem['status'];
  label: string;
  accent: string;
}[] = [
  { id: 'TODO', label: 'To Do', accent: 'border-slate-300' },
  { id: 'IN_PROGRESS', label: 'In Progress', accent: 'border-primary-500' },
  { id: 'IN_REVIEW', label: 'In Review', accent: 'border-warning-500' },
  { id: 'COMPLETED', label: 'Completed', accent: 'border-success-500' },
  { id: 'BLOCKED', label: 'Blocked', accent: 'border-danger-500' },
];

export const TasksPage: React.FC = () => {
  const { currentAgency } = useAuth();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // New Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    campaignId: '',
    assigneeId: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
  });

  // Task Details & Comment Modal
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);

      const [tasksData, clientsData, campaignsData, membersData] = await Promise.all([
        apiRequest<TaskItem[]>(`/api/v1/tasks?${params.toString()}`),
        apiRequest<any[]>('/api/v1/clients'),
        apiRequest<any[]>('/api/v1/campaigns'),
        apiRequest<any[]>('/api/v1/team/members'),
      ]);

      setTasks(tasksData);
      setClients(clientsData);
      setCampaigns(campaignsData);
      setMembers(membersData);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchTasks();
    }
  }, [currentAgency?.id, priorityFilter]);

  const handleStatusChange = async (taskId: string, newStatus: TaskItem['status']) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await apiRequest(`/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      await fetchTasks();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        clientId: '',
        campaignId: '',
        assigneeId: '',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: '',
      });
      await fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTaskDetails = async (taskId: string) => {
    try {
      const details = await apiRequest(`/api/v1/tasks/${taskId}`);
      setSelectedTask(details);
    } catch (err: any) {
      alert(err.message || 'Failed to load task details.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    try {
      setIsCommentSubmitting(true);
      const added = await apiRequest(`/api/v1/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() }),
      });

      setSelectedTask((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), added],
      }));
      setNewComment('');
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to add comment.');
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const getPriorityBadge = (p: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Task Management
            </h1>
            <Badge variant="outline" size="sm">
              {tasks.length} Tasks
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Organize task queues, set priorities, and collaborate across campaigns and client brands.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md border border-border bg-white p-0.5 shadow-subtle">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-text-muted font-medium">Priority:</span>
        {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`rounded px-2.5 py-1 text-xs font-medium border transition-colors ${
              priorityFilter === p
                ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                : 'bg-white border-border text-text-secondary hover:bg-slate-50'
            }`}
          >
            {p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Kanban Board View */}
      {isLoading ? (
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-96 rounded-lg" />
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col rounded-lg border border-border bg-slate-50/70 p-3 min-w-[220px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-text-primary">
                      {col.label}
                    </span>
                    <span className="rounded-full bg-white border border-border px-1.5 text-[10px] font-semibold text-text-secondary tabular-nums">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[70vh]">
                  {colTasks.map((task) => (
                    <Card
                      key={task.id}
                      hoverable
                      onClick={() => openTaskDetails(task.id)}
                      className="p-3 bg-white border border-border shadow-subtle space-y-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-2">
                          {task.title}
                        </span>
                        <div>{getPriorityBadge(task.priority)}</div>
                      </div>

                      {task.client && (
                        <div className="text-[10px] text-text-muted flex items-center truncate">
                          <Building className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">{task.client.name}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-text-secondary">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-text-muted" />
                          {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                        </span>

                        <div className="flex items-center space-x-2">
                          {task._count?.comments > 0 && (
                            <span className="flex items-center text-text-muted">
                              <MessageSquare className="w-3 h-3 mr-0.5" />
                              {task._count.comments}
                            </span>
                          )}

                          {task.assignee ? (
                            <div
                              className="h-5 w-5 rounded-full bg-primary-100 text-primary-700 font-bold text-[9px] flex items-center justify-center shrink-0"
                              title={`Assigned to ${task.assignee.firstName}`}
                            >
                              {task.assignee.firstName[0]}
                            </div>
                          ) : (
                            <span className="text-text-muted text-[9px]">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Fast Status Mover */}
                      <div
                        className="pt-1.5 flex justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(
                              task.id,
                              e.target.value as TaskItem['status']
                            )
                          }
                          className="h-5 rounded border border-border bg-white px-1 text-[10px] text-text-secondary focus-visible:outline-none"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card className="p-0 bg-white border border-border shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-border text-[10px] font-semibold text-text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Client / Campaign</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => openTaskDetails(task.id)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    {task.title}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {task.client?.name || '—'}{' '}
                    {task.campaign ? `• ${task.campaign.name}` : ''}
                  </td>
                  <td className="px-4 py-3">{getPriorityBadge(task.priority)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-text-primary">{task.status}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">
                    {task.dueDate ? formatDate(task.dueDate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {task.assignee
                      ? `${task.assignee.firstName} ${task.assignee.lastName}`
                      : 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Task Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Operational Task"
        description="Delegate deliverables with deadlines, campaign links, and urgency tags."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title *"
            placeholder="e.g. Design 3D packaging renders for cold brew bottle"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Client Brand
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none"
              >
                <option value="">None / Internal</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Campaign Link
              </label>
              <select
                value={formData.campaignId}
                onChange={(e) =>
                  setFormData({ ...formData, campaignId: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary shadow-subtle focus-visible:outline-none"
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
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Assignee
              </label>
              <select
                value={formData.assigneeId}
                onChange={(e) =>
                  setFormData({ ...formData, assigneeId: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs text-text-primary shadow-subtle focus-visible:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.firstName} {m.user.lastName} ({m.role.replace('AGENCY_', '')})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs text-text-primary shadow-subtle focus-visible:outline-none"
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
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-primary">
              Task Description & Brief
            </label>
            <textarea
              rows={2}
              placeholder="Scope, specifications, asset formats..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-md border border-border p-2 text-xs text-text-primary focus-visible:outline-none shadow-subtle"
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
              Create Task
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Task Details & Comments Modal */}
      {selectedTask && (
        <Dialog
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          description={`Status: ${selectedTask.status} • Priority: ${selectedTask.priority}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-slate-50 p-3 text-xs text-text-primary">
              <p className="font-semibold text-text-muted mb-1">Description</p>
              {selectedTask.description || 'No description provided.'}
            </div>

            {/* Task Comments Section */}
            <div className="border-t border-border pt-3 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion & Collaboration</span>
              </h3>

              <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-100">
                {selectedTask.comments?.length === 0 ? (
                  <p className="text-xs text-text-secondary py-2 text-center">
                    No comments yet. Start the conversation below.
                  </p>
                ) : (
                  selectedTask.comments?.map((c: any) => (
                    <div key={c.id} className="pt-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-text-primary">
                          {c.user?.firstName} {c.user?.lastName}
                        </span>
                        <span className="text-[10px] text-text-muted tabular-nums">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-text-secondary">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-border px-3 text-xs text-text-primary focus-visible:outline-none focus-visible:border-primary-500 shadow-subtle"
                />
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isCommentSubmitting}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
