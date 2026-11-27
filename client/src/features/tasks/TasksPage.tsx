import React, { useEffect, useState, useMemo } from 'react';
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
import { TaskDetailsDrawer, TaskDetail } from './TaskDetailsDrawer';
import {
  Plus,
  Kanban,
  List,
  Calendar,
  Building,
  MessageSquare,
  Search,
} from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  dueDate?: string | null;
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

interface ColumnConfig {
  id: TaskItem['status'];
  label: string;
  dotColor: string;
  badgeVariant: 'neutral' | 'default' | 'warning' | 'success' | 'danger';
}

const KANBAN_COLUMNS: ColumnConfig[] = [
  { id: 'TODO', label: 'To Do', dotColor: 'bg-slate-400', badgeVariant: 'neutral' },
  { id: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-primary-600', badgeVariant: 'default' },
  { id: 'IN_REVIEW', label: 'In Review', dotColor: 'bg-warning-500', badgeVariant: 'warning' },
  { id: 'COMPLETED', label: 'Completed', dotColor: 'bg-success-600', badgeVariant: 'success' },
  { id: 'BLOCKED', label: 'Blocked', dotColor: 'bg-danger-600', badgeVariant: 'danger' },
];

export const TasksPage: React.FC = () => {
  const { currentAgency } = useAuth();
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    campaignId: '',
    assigneeId: '',
    priority: 'MEDIUM',
    status: 'TODO' as TaskItem['status'],
    dueDate: '',
  });

  // Task Details Drawer
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

      // If drawer is open, refresh selected task
      if (selectedTask) {
        const updated = tasksData.find((t) => t.id === selectedTask.id);
        if (updated) {
          // Fetch full task details for drawer
          try {
            const fullDetails = await apiRequest<TaskDetail>(`/api/v1/tasks/${updated.id}`);
            setSelectedTask(fullDetails);
          } catch {
            // Keep existing if fetch fails
          }
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAgency) {
      fetchTasks();
    }
  }, [currentAgency?.id, priorityFilter]);

  // Client-side filtering for search & client brand
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Client brand filter
      if (clientFilter !== 'ALL' && task.client?.id !== clientFilter) {
        return false;
      }

      // Search query across title, client, and campaign
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesClient = task.client?.name?.toLowerCase().includes(query);
        const matchesCampaign = task.campaign?.name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesClient && !matchesCampaign) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, clientFilter, searchQuery]);

  const handleStatusChange = async (taskId: string, newStatus: TaskItem['status']) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await apiRequest(`/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      success('Status updated', `Task moved to ${newStatus.replace('_', ' ')}.`);
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
      success('Task created', `"${formData.title}" added to board.`);
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
      toastError(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTaskDetails = async (taskId: string) => {
    try {
      const details = await apiRequest<TaskDetail>(`/api/v1/tasks/${taskId}`);
      setSelectedTask(details);
      setIsDrawerOpen(true);
    } catch (err: any) {
      toastError(err.message || 'Failed to load task details.');
    }
  };

  const handleUpdateTask = async (taskId: string, data: Partial<TaskDetail>) => {
    try {
      const updated = await apiRequest<TaskDetail>(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      setSelectedTask(updated);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            title: updated.title,
            description: updated.description,
            priority: updated.priority,
            status: updated.status,
            dueDate: updated.dueDate,
            client: updated.client ? { id: updated.client.id, name: updated.client.name } : null,
            campaign: updated.campaign ? { id: updated.campaign.id, name: updated.campaign.name } : null,
            assignee: updated.assignee
              ? {
                  id: updated.assignee.id,
                  firstName: updated.assignee.firstName,
                  lastName: updated.assignee.lastName,
                  avatarUrl: updated.assignee.avatarUrl,
                }
              : null,
          };
        })
      );
      success('Task updated', 'Changes have been saved successfully.');
    } catch (err: any) {
      toastError(err.message || 'Failed to update task.');
      throw err;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiRequest(`/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
      });

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setIsDrawerOpen(false);
      setSelectedTask(null);
      success('Task deleted', 'The task deliverable has been removed.');
    } catch (err: any) {
      toastError(err.message || 'Failed to delete task.');
      throw err;
    }
  };

  const handleAddComment = async (taskId: string, content: string) => {
    try {
      const added = await apiRequest(`/api/v1/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      setSelectedTask((prev: any) => ({
        ...prev,
        comments: [...(prev?.comments || []), added],
      }));

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, _count: { comments: (t._count?.comments || 0) + 1 } }
            : t
        )
      );
      success('Comment posted', 'Your update has been shared with the team.');
    } catch (err: any) {
      toastError(err.message || 'Failed to add comment.');
      throw err;
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
    <div className="space-y-5">
      {/* 1. Header with Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Task Management
            </h1>
            <Badge variant="outline" size="sm">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Organize team deliverables, track execution progress, and collaborate across campaigns.
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
            onClick={() => {
              setFormData((prev) => ({ ...prev, status: 'TODO' }));
              setIsModalOpen(true);
            }}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* 2. Unified Toolbar (Search, Client Filter, Priority Filter Tabs) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter Tabs */}
          <div className="inline-flex rounded-md border border-border bg-white p-0.5 text-xs font-medium shadow-subtle">
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded transition-colors text-xs ${
                  priorityFilter === p
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {p === 'ALL' ? 'All Priority' : p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Client Filter Dropdown */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-white px-2.5 text-xs text-text-primary shadow-subtle focus:outline-none focus:border-primary-600"
          >
            <option value="ALL">All Client Brands</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search tasks, clients, campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-white text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-600 shadow-subtle"
          />
        </div>
      </div>

      {/* 3. Board or List View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-thin">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="flex-1 min-w-[270px] max-w-[340px] flex flex-col rounded-xl border border-border bg-slate-50/70 p-3 shadow-subtle"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border/80">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="text-xs font-bold text-text-primary">
                      {col.label}
                    </span>
                    <Badge variant={col.badgeVariant} size="sm">
                      {colTasks.length}
                    </Badge>
                  </div>

                  {/* Column Quick Add */}
                  <button
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, status: col.id }));
                      setIsModalOpen(true);
                    }}
                    className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white border border-transparent hover:border-border transition-colors"
                    title={`Add task to ${col.label}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-270px)] pr-0.5 scrollbar-thin">
                  {colTasks.length === 0 ? (
                    /* Helpful Empty State */
                    <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-border/80 bg-white/50 text-center my-1.5">
                      <p className="text-xs font-medium text-text-muted">
                        No tasks in {col.label}
                      </p>
                      <button
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, status: col.id }));
                          setIsModalOpen(true);
                        }}
                        className="mt-2 text-[11px] font-medium text-primary-600 hover:text-primary-700 inline-flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add task</span>
                      </button>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isOverdue =
                        task.dueDate &&
                        new Date(task.dueDate) < new Date() &&
                        task.status !== 'COMPLETED';

                      return (
                        <div
                          key={task.id}
                          onClick={() => openTaskDetails(task.id)}
                          className="group relative flex flex-col rounded-lg border border-border bg-white p-3.5 shadow-subtle hover:border-primary-300 hover:shadow-card transition-all cursor-pointer text-left h-auto space-y-2"
                        >
                          {/* 1. Priority badge at the top & quick status mover */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-1.5">
                              {getPriorityBadge(task.priority)}
                              {task.status === 'BLOCKED' && (
                                <span className="inline-flex items-center text-[10px] font-semibold text-danger-600 bg-danger-50 px-1.5 py-0.5 rounded border border-danger-200">
                                  Blocked
                                </span>
                              )}
                            </div>

                            {/* Fast Status Selector */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="relative shrink-0"
                            >
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    task.id,
                                    e.target.value as TaskItem['status']
                                  )
                                }
                                className="h-6 rounded border border-border/80 bg-slate-50 hover:bg-slate-100 px-1.5 text-[10px] font-medium text-text-secondary focus:outline-none focus:border-primary-500 cursor-pointer"
                                title="Change status"
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="IN_REVIEW">In Review</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="BLOCKED">Blocked</option>
                              </select>
                            </div>
                          </div>

                          {/* 2. Complete Task Title: Full width, wraps naturally across lines */}
                          <h3
                            className="text-xs font-semibold text-text-primary group-hover:text-primary-600 transition-colors leading-snug break-words"
                            title={task.title}
                          >
                            {task.title}
                          </h3>

                          {/* 3. Client name underneath */}
                          {(task.client || task.campaign) && (
                            <div className="flex items-center text-[11px] text-text-secondary truncate pt-0.5">
                              <Building className="w-3 h-3 mr-1 text-text-muted shrink-0" />
                              <span className="font-medium text-text-secondary truncate">
                                {task.client?.name || 'Internal'}
                              </span>
                              {task.campaign && (
                                <>
                                  <span className="mx-1 text-text-muted">•</span>
                                  <span
                                    className="text-text-muted truncate max-w-[130px]"
                                    title={task.campaign.name}
                                  >
                                    {task.campaign.name}
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {/* 4. Due date and assigned user at the bottom */}
                          <div className="mt-1 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-text-secondary">
                            <span
                              className={`inline-flex items-center ${
                                isOverdue
                                  ? 'text-danger-600 font-medium'
                                  : 'text-text-muted'
                              }`}
                            >
                              <Calendar
                                className={`w-3 h-3 mr-1 shrink-0 ${
                                  isOverdue ? 'text-danger-500' : 'text-text-muted'
                                }`}
                              />
                              {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                              {isOverdue && (
                                <span className="ml-1 text-[9px] font-bold uppercase tracking-wider bg-danger-50 text-danger-700 px-1 py-0.2 rounded">
                                  Overdue
                                </span>
                              )}
                            </span>

                            <div className="flex items-center space-x-2 shrink-0">
                              {task._count?.comments > 0 && (
                                <span
                                  className="inline-flex items-center text-text-muted text-[11px]"
                                  title={`${task._count.comments} comments`}
                                >
                                  <MessageSquare className="w-3 h-3 mr-0.5" />
                                  <span className="tabular-nums">
                                    {task._count.comments}
                                  </span>
                                </span>
                              )}

                              {task.assignee ? (
                                <div
                                  className="h-5 w-5 rounded-full bg-primary-50 text-primary-700 font-bold text-[9px] flex items-center justify-center shrink-0 border border-primary-200/60"
                                  title={`Assigned to ${task.assignee.firstName} ${task.assignee.lastName}`}
                                >
                                  {task.assignee.firstName[0]}
                                </div>
                              ) : (
                                <span className="text-text-muted text-[10px] italic">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View (Table) */
        <Card className="p-0 bg-white border border-border shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 min-w-[240px]">Task Title</th>
                  <th className="px-4 py-3">Client / Campaign</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                      No tasks found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== 'COMPLETED';

                    return (
                      <tr
                        key={task.id}
                        onClick={() => openTaskDetails(task.id)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-text-primary">
                          <p className="leading-snug break-words max-w-md">
                            {task.title}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-text-secondary">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-text-primary">
                              {task.client?.name || 'Internal'}
                            </span>
                            {task.campaign && (
                              <span className="text-text-muted">
                                • {task.campaign.name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">{getPriorityBadge(task.priority)}</td>

                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(
                                task.id,
                                e.target.value as TaskItem['status']
                              )
                            }
                            className="h-6 rounded border border-border bg-white px-1.5 text-[11px] text-text-primary focus:outline-none focus:border-primary-500 shadow-subtle"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>
                        </td>

                        <td className="px-4 py-3 tabular-nums">
                          <span
                            className={
                              isOverdue ? 'text-danger-600 font-semibold' : 'text-text-secondary'
                            }
                          >
                            {task.dueDate ? formatDate(task.dueDate) : '—'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-text-secondary">
                          {task.assignee ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="h-5 w-5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex items-center justify-center">
                                {task.assignee.firstName[0]}
                              </span>
                              <span>
                                {task.assignee.firstName} {task.assignee.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-text-muted italic">Unassigned</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => openTaskDetails(task.id)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4. Task Details Side Drawer */}
      <TaskDetailsDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTask(null);
        }}
        onStatusChange={handleStatusChange}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onAddComment={handleAddComment}
        clients={clients}
        campaigns={campaigns}
        members={members}
      />

      {/* 5. Create Task Modal */}
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
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-xs text-text-primary shadow-subtle focus-visible:outline-none"
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
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-xs text-text-primary shadow-subtle focus-visible:outline-none"
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
              rows={3}
              placeholder="Scope, specifications, asset formats..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-md border border-border p-2.5 text-xs text-text-primary focus-visible:outline-none focus-visible:border-primary-500 shadow-subtle"
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
    </div>
  );
};
