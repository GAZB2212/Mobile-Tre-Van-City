import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  Car,
  Package,
  Wrench,
  FileText,
  Users,
  Shield,
  Globe,
  LogOut,
  Calculator,
  GraduationCap,
  Image,
  Video,
  Layers,
  UserRound,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  requiredRole: "basic" | "full";
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Sales Tools",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard, requiredRole: "basic" },
      { title: "Admin Configurator", href: "/admin/configurator", icon: UserRound, requiredRole: "basic" },
      { title: "Finance Calculator", href: "/admin/finance-calculator", icon: Calculator, requiredRole: "basic" },
    ],
  },
  {
    label: "Leads",
    items: [
      { title: "Configurators", href: "/admin/quotes", icon: FileText, requiredRole: "basic" },
      { title: "Leads", href: "/admin/leads", icon: Users, requiredRole: "basic" },
      { title: "Analytics", href: "/admin/analytics", icon: BarChart3, requiredRole: "basic" },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Vans", href: "/admin/vans", icon: Car, requiredRole: "full" },
      { title: "Packs", href: "/admin/kits", icon: Package, requiredRole: "full" },
      { title: "Upgrades", href: "/admin/upgrades", icon: Wrench, requiredRole: "full" },
      { title: "Finance Plans", href: "/admin/finance-plans", icon: Calculator, requiredRole: "full" },
      { title: "Training", href: "/admin/training-options", icon: GraduationCap, requiredRole: "full" },
      { title: "Gallery", href: "/admin/gallery-items", icon: Image, requiredRole: "full" },
      { title: "Videos", href: "/admin/videos", icon: Video, requiredRole: "full" },
      { title: "Blog", href: "/admin/blog", icon: BookOpen, requiredRole: "full" },
      { title: "AI Packages", href: "/admin/ai-packages", icon: Layers, requiredRole: "full" },
      { title: "Users", href: "/admin/users", icon: Shield, requiredRole: "full" },
    ],
  },
];

function NavLink({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;
  const inner = (
    <Link
      href={item.href}
      data-testid={`nav-admin-${item.href.split("/").pop()}`}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
        transition-colors duration-150 cursor-pointer
        ${isActive
          ? "bg-[#8bc440]/15 text-[#8bc440]"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
        }
        ${collapsed ? "justify-center" : ""}
      `}
    >
      <Icon className={`shrink-0 ${isActive ? "text-[#8bc440]" : "text-zinc-500"}`} size={17} />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth() as { user: User | undefined };

  const handleLogout = async () => {
    try { await apiRequest("POST", "/api/auth/logout"); } catch {}
    localStorage.removeItem("sessionId");
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/admin") return location === "/admin";
    return location.startsWith(href);
  };

  const canSee = (role: "basic" | "full") => {
    if (!user?.adminRole || user.adminRole === "none") return false;
    if (user.adminRole === "full") return true;
    return role === "basic";
  };

  const sidebarContent = (isMobile = false) => (
    <div
      className={`
        flex flex-col h-full
        bg-[#0d0d0d] border-r border-white/[0.06]
        ${!isMobile ? (collapsed ? "w-[60px]" : "w-[220px]") : "w-[220px]"}
        transition-all duration-200
      `}
    >
      {/* Brand header */}
      <div className={`flex items-center border-b border-white/[0.06] ${collapsed && !isMobile ? "justify-center px-3 py-4" : "px-4 py-4"} gap-3`}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#8bc440] flex items-center justify-center shrink-0">
              <Car size={14} className="text-[#0d0d0d]" />
            </div>
            <span className="font-semibold text-sm text-zinc-100 truncate leading-tight">
              Van City Admin
            </span>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="w-7 h-7 rounded-md bg-[#8bc440] flex items-center justify-center">
            <Car size={14} className="text-[#0d0d0d]" />
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
            data-testid="button-toggle-sidebar"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-5 px-2">
        {navGroups.map((group) => {
          const visible = group.items.filter((i) => canSee(i.requiredRole));
          if (!visible.length) return null;
          return (
            <div key={group.label}>
              {(!collapsed || isMobile) && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-3 mb-1">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visible.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    collapsed={collapsed && !isMobile}
                    isActive={isActive(item.href)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/[0.06] p-3 space-y-1`}>
        {(!collapsed || isMobile) && (
          <div className="px-2 pb-2">
            <p className="text-xs font-medium text-zinc-300 truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email}
            </p>
            <Badge
              variant="outline"
              className="mt-1 text-[10px] border-[#8bc440]/30 text-[#8bc440] bg-[#8bc440]/10"
            >
              {user?.adminRole === "full" ? "Full Admin" : "Basic Admin"}
            </Badge>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.open("/", "_blank")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              data-testid="button-view-main-site"
            >
              <Globe size={16} className="shrink-0 text-zinc-500" />
              {(!collapsed || isMobile) && <span className="text-xs">View Main Site</span>}
            </button>
          </TooltipTrigger>
          {(collapsed && !isMobile) && <TooltipContent side="right">View Main Site</TooltipContent>}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              data-testid="button-logout"
            >
              <LogOut size={16} className="shrink-0" />
              {(!collapsed || isMobile) && <span className="text-xs">Log Out</span>}
            </button>
          </TooltipTrigger>
          {(collapsed && !isMobile) && <TooltipContent side="right">Log Out</TooltipContent>}
        </Tooltip>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col shrink-0" style={{ transition: "width 200ms" }}>
        {sidebarContent(false)}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex flex-col h-full">
            {sidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center h-12 px-4 border-b border-white/[0.06] bg-[#0d0d0d] shrink-0">
          <button
            className="md:hidden text-zinc-400 hover:text-zinc-100 mr-3"
            onClick={() => setMobileOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-zinc-600 hidden sm:block">
            {user?.email}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
