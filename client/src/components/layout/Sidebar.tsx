import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  Megaphone,
  CalendarDays,
  CheckSquare,
  BarChart3,
  LineChart,
  FileSpreadsheet,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { currentAgency } = useAuth();

  const navigationItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Clients', href: '/clients', icon: Users2 },
    { label: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { label: 'Content Calendar', href: '/content', icon: CalendarDays },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Advertising', href: '/advertising', icon: BarChart3 },
    { label: 'Analytics', href: '/analytics', icon: LineChart },
    { label: 'Reports', href: '/reports', icon: FileSpreadsheet },
    { label: 'Team', href: '/team', icon: Users },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-white transition-all duration-200 select-none z-20',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed ? (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-white font-bold text-xs tracking-wider shadow-subtle">
              AO
            </div>
            <div className="truncate">
              <span className="text-xs font-bold tracking-tight text-text-primary block leading-none">
                AGENCY OS
              </span>
              <span className="text-[10px] text-text-secondary block tracking-normal mt-0.5 truncate">
                {currentAgency?.name || 'Workspace'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded bg-primary-600 text-white font-bold text-xs shadow-subtle">
            A
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-md px-2.5 py-2 text-xs font-medium transition-colors group',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
                  collapsed ? 'justify-center' : 'justify-start space-x-3'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Tenant Indicator & Collapse Control */}
      <div className="border-t border-border p-3">
        {!collapsed && currentAgency && (
          <div className="mb-2 rounded border border-border bg-slate-50/70 p-2">
            <div className="flex items-center space-x-1.5 text-[10px] text-text-secondary">
              <ShieldCheck className="w-3.5 h-3.5 text-success-600 shrink-0" />
              <span className="truncate font-medium text-text-primary">
                Role: {currentAgency.role.replace('AGENCY_', '')}
              </span>
            </div>
            <div className="text-[10px] text-text-secondary mt-0.5">
              Currency: {currentAgency.currency || 'NPR'}
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-md py-1.5 text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors text-xs"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center space-x-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] font-medium">Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
