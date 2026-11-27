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
  Layers,
  CreditCard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle2,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo, BrandSymbol } from '../brand/BrandLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavGroup {
  label: string;
  items: {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}) => {
  const { currentAgency } = useAuth();

  const navigationGroups: NavGroup[] = [
    {
      label: 'Workspace',
      items: [
        { label: 'Overview', href: '/', icon: LayoutDashboard },
        { label: 'Clients', href: '/clients', icon: Users2 },
      ],
    },
    {
      label: 'Execution',
      items: [
        { label: 'Campaigns', href: '/campaigns', icon: Megaphone },
        { label: 'Tasks', href: '/tasks', icon: CheckSquare },
        { label: 'Content Calendar', href: '/content', icon: CalendarDays },
        { label: 'Client Approvals', href: '/portal', icon: CheckCircle2 },
      ],
    },
    {
      label: 'Insights',
      items: [
        { label: 'Advertising', href: '/advertising', icon: BarChart3 },
        { label: 'Analytics', href: '/analytics', icon: LineChart },
        { label: 'Reports', href: '/reports', icon: FileSpreadsheet },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Integrations', href: '/integrations', icon: Layers },
        { label: 'Billing & Plans', href: '/billing', icon: CreditCard },
        { label: 'Team', href: '/team', icon: Users },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin">
      {navigationGroups.map((group) => (
        <div key={group.label} className="space-y-0.5">
          {(!collapsed || isMobile) && (
            <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
              {group.label}
            </div>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={isMobile ? onMobileClose : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-all group relative',
                    isActive
                      ? 'bg-primary-50/80 text-primary-700 font-semibold'
                      : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
                    collapsed && !isMobile ? 'justify-center px-0' : 'justify-start space-x-2.5'
                  )
                }
                title={collapsed && !isMobile ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator bar */}
                    {isActive && (!collapsed || isMobile) && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary-600" />
                    )}
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-primary-600'
                          : 'text-text-secondary group-hover:text-text-primary'
                      )}
                      strokeWidth={isActive ? 2 : 1.75}
                    />
                    {(!collapsed || isMobile) && (
                      <span className="truncate flex-1 tracking-tight">
                        {item.label}
                      </span>
                    )}
                    {(!collapsed || isMobile) && item.badge && (
                      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary-100 text-primary-700">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* 1. Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* 2. Mobile Drawer Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[270px] max-w-[85vw] flex flex-col bg-white shadow-2xl border-r border-border md:hidden transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-3.5">
          <BrandLogo size="md" subtitle={currentAgency?.name || 'Workspace'} />
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {renderNavLinks(true)}

        {/* Mobile Footer Tenant Indicator */}
        {currentAgency && (
          <div className="border-t border-border p-3 bg-[#FAFAFC]">
            <div className="rounded border border-border/80 bg-white p-2.5 shadow-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-text-primary truncate">
                  <Shield className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                  <span className="truncate">
                    {currentAgency.role.replace('AGENCY_', '')}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-text-secondary border border-border">
                  {currentAgency.currency || 'NPR'}
                </span>
              </div>
              <div className="text-[11px] text-text-muted mt-1 truncate">
                {currentAgency.name}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* 3. Desktop Pinned Sidebar */}
      <aside
        className={cn(
          'relative hidden md:flex flex-col border-r border-border bg-white transition-all duration-200 select-none z-20 shrink-0',
          collapsed ? 'w-[64px]' : 'w-[240px]'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3.5">
          {!collapsed ? (
            <div className="flex items-center overflow-hidden">
              <BrandLogo size="md" subtitle={currentAgency?.name || 'Workspace'} />
            </div>
          ) : (
            <div className="mx-auto">
              <BrandSymbol size={26} />
            </div>
          )}
        </div>

        {/* Nav List with Grouping */}
        {renderNavLinks(false)}

        {/* Tenant Indicator & Collapse Control */}
        <div className="border-t border-border p-2.5 space-y-2 bg-[#FAFAFC]">
          {!collapsed && currentAgency && (
            <div className="rounded border border-border/80 bg-white p-2 shadow-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-text-primary truncate">
                  <Shield className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                  <span className="truncate">
                    {currentAgency.role.replace('AGENCY_', '')}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-text-secondary border border-border">
                  {currentAgency.currency || 'NPR'}
                </span>
              </div>
              <div className="text-[10px] text-text-muted mt-1 truncate">
                {currentAgency.name}
              </div>
            </div>
          )}

          <button
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-md py-1.5 text-text-secondary hover:bg-white hover:text-text-primary hover:border hover:border-border transition-all text-xs"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center space-x-1.5">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
