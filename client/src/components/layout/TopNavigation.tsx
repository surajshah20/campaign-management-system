import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  Plus,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Check,
  Command,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const TopNavigation: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    currentAgency,
    availableAgencies,
    switchWorkspace,
    logout,
    refreshProfile,
  } = useAuth();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      setIsCreating(true);
      await fetch('/api/v1/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
        credentials: 'include',
      });
      await refreshProfile();
      setNewWorkspaceName('');
      setCreateModalOpen(false);
      setWorkspaceMenuOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b border-border bg-white px-4 md:px-6">
      {/* Left: Workspace Selector & Breadcrumb */}
      <div className="flex items-center space-x-3">
        <div className="relative" ref={workspaceRef}>
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center space-x-2 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-subtle hover:border-slate-300 transition-all shadow-subtle active:scale-[0.98]"
          >
            <Building2 className="w-3.5 h-3.5 text-primary-600" />
            <span className="max-w-[150px] truncate">
              {currentAgency?.name || 'Workspace'}
            </span>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-lg border border-border bg-white p-1.5 shadow-dropdown z-30">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                Workspaces ({availableAgencies.length})
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5 my-1">
                {availableAgencies.map((agency) => (
                  <button
                    key={agency.id}
                    onClick={() => {
                      switchWorkspace(agency.id);
                      setWorkspaceMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs text-text-primary hover:bg-surface-subtle transition-colors text-left"
                  >
                    <div className="truncate pr-2">
                      <p className="font-medium text-text-primary truncate">
                        {agency.name}
                      </p>
                      <p className="text-[10px] text-text-muted capitalize">
                        {agency.role.replace('AGENCY_', '').toLowerCase()}
                      </p>
                    </div>
                    {agency.id === currentAgency?.id && (
                      <Check className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-border pt-1 mt-1">
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    setCreateModalOpen(true);
                  }}
                  className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="hidden md:flex items-center w-80">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center justify-between h-8 w-full rounded-md border border-border bg-surface-subtle px-2.5 text-xs text-text-muted hover:border-slate-300 hover:bg-white hover:text-text-primary transition-all shadow-subtle group"
        >
          <div className="flex items-center space-x-2 truncate">
            <Search className="w-3.5 h-3.5 text-text-muted group-hover:text-primary-600 transition-colors" />
            <span className="truncate">Search campaigns, tasks, clients...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-muted shadow-subtle">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate('/settings')}
          className="rounded-md p-1.5 text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
          title="Workspace Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          className="relative rounded-md p-1.5 text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary-600 ring-2 ring-white" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* User Profile Trigger */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center space-x-2 rounded-md p-1 hover:bg-surface-subtle transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold border border-primary-200">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <span className="font-semibold text-text-primary block leading-none">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-text-secondary block mt-0.5 truncate max-w-[110px]">
                {user?.email}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-lg border border-border bg-white p-1.5 shadow-dropdown z-30">
              <div className="px-2.5 py-2 border-b border-border mb-1">
                <p className="text-xs font-semibold text-text-primary">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-text-secondary truncate mt-0.5">
                  {user?.email}
                </p>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/team');
                  }}
                  className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs text-text-primary hover:bg-surface-subtle transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Team & Permissions</span>
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs text-text-primary hover:bg-surface-subtle transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Agency Settings</span>
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center space-x-2 rounded-md px-2.5 py-1.5 text-xs text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command Palette Modal */}
      <Dialog
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Quick Navigation & Command Palette"
        description="Jump to any module, campaign, client or action across Agency OS."
      >
        <div className="space-y-3">
          <Input
            leftIcon={<Search className="w-3.5 h-3.5 text-text-muted" />}
            placeholder="Type to search or navigate..."
            autoFocus
          />
          <div className="space-y-1 text-xs">
            <p className="text-[10px] uppercase font-semibold text-text-muted tracking-wider px-1">
              Shortcuts
            </p>
            {[
              { name: 'Campaigns Overview', path: '/campaigns' },
              { name: 'Active Client Workspaces', path: '/clients' },
              { name: 'Task Board & Kanban', path: '/tasks' },
              { name: 'Client Approvals Portal', path: '/portal' },
              { name: 'Cross-Platform Analytics', path: '/analytics' },
              { name: 'Subscription & Billing', path: '/billing' },
            ].map((shortcut) => (
              <button
                key={shortcut.path}
                onClick={() => {
                  setSearchModalOpen(false);
                  navigate(shortcut.path);
                }}
                className="flex items-center justify-between w-full px-2.5 py-2 rounded-md hover:bg-surface-subtle text-text-primary text-left transition-colors"
              >
                <span>{shortcut.name}</span>
                <span className="text-[10px] text-text-muted font-mono">
                  {shortcut.path}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Dialog>

      {/* Create Workspace Modal */}
      <Dialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Agency Workspace"
        description="Launch an isolated organization workspace to manage a new branch or agency team."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <Input
            label="Agency Workspace Name"
            placeholder="e.g. Apex Digital Asia"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isCreating}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Dialog>
    </header>
  );
};