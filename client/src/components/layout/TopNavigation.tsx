import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  ChevronDown,
  Plus,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const TopNavigation: React.FC = () => {
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b border-border bg-white px-4">
      {/* Left: Workspace Switcher */}
      <div className="flex items-center space-x-3">
        <div className="relative" ref={workspaceRef}>
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center space-x-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-colors shadow-subtle"
          >
            <Building2 className="w-3.5 h-3.5 text-primary-600" />
            <span className="max-w-[140px] truncate">
              {currentAgency?.name || 'Select Workspace'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-md border border-border bg-white p-1.5 shadow-dropdown z-30">
              <div className="px-2 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Workspaces
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
                {availableAgencies.map((agency) => (
                  <button
                    key={agency.id}
                    onClick={() => {
                      switchWorkspace(agency.id);
                      setWorkspaceMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-text-primary hover:bg-surface-subtle text-left"
                  >
                    <div className="truncate">
                      <p className="font-medium truncate">{agency.name}</p>
                      <p className="text-[10px] text-text-secondary">
                        {agency.role.replace('AGENCY_', '')}
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
                  className="flex w-full items-center space-x-2 rounded px-2 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex items-center w-72">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search campaigns, clients, tasks (⌘K)..."
            readOnly
            className="h-8 w-full rounded-md border border-border bg-surface-subtle pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted cursor-pointer hover:border-slate-300 transition-colors"
          />
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center space-x-2">
        <button
          className="relative rounded-md p-1.5 text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-600 ring-2 ring-white" />
        </button>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center space-x-2 rounded-md p-1 hover:bg-surface-subtle transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <span className="font-semibold text-text-primary block leading-none">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-text-secondary block mt-0.5 truncate max-w-[120px]">
                {user?.email}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-md border border-border bg-white p-1.5 shadow-dropdown z-30">
              <div className="px-2 py-1.5 border-b border-border mb-1">
                <p className="text-xs font-semibold text-text-primary">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-text-secondary truncate">{user?.email}</p>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full items-center space-x-2 rounded px-2 py-1.5 text-xs text-text-primary hover:bg-surface-subtle"
                >
                  <UserIcon className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center space-x-2 rounded px-2 py-1.5 text-xs text-danger-600 hover:bg-danger-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
            placeholder="e.g. Nexus Media Group"
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
