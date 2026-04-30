import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import mtvcLogoWide from "@assets/Untitled_design-36_1773155683674.png";
import mtvcLogoRound from "@assets/Untitled design-47_1759231860895.png";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminProfileModal } from "@/components/AdminProfileModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  Bot,
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
  RefreshCw,
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
      { title: "AI Conversations", href: "/admin/ai-conversations", icon: Bot, requiredRole: "basic" },
      { title: "Analytics", href: "/admin/analytics", icon: BarChart3, requiredRole: "basic" },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Vans", href: "/admin/vans", icon: Car, requiredRole: "basic" },
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
  badge,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  badge?: number;
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
      <div className="relative shrink-0">
        <Icon className={`${isActive ? "text-[#8bc440]" : "text-zinc-500"}`} size={17} />
        {collapsed && badge != null && badge > 0 && (
          <span
            data-testid={`badge-nav-${item.href.split("/").pop()}-collapsed`}
            className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-[#8bc440] text-black text-[9px] font-bold px-0.5 leading-none"
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      {!collapsed && <span className="truncate flex-1">{item.title}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <Badge
          data-testid={`badge-nav-${item.href.split("/").pop()}`}
          className="ml-auto shrink-0 bg-[#8bc440] text-black text-[10px] font-bold px-1.5 py-0 h-5 no-default-active-elevate"
        >
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.title}
          {badge != null && badge > 0 && ` (${badge} new)`}
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
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAuth() as { user: User | undefined };

  // Server version polling — detects when the backend has restarted (new deployment)
  const initialVersion = useRef<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const { data: versionData } = useQuery<{ version: string }>({
    queryKey: ["/api/version"],
    refetchInterval: 30_000,
    staleTime: 0,
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  useEffect(() => {
    if (!versionData?.version) return;
    if (initialVersion.current === null) {
      initialVersion.current = versionData.version;
    } else if (versionData.version !== initialVersion.current) {
      setUpdateAvailable(true);
    }
  }, [versionData]);

  const { data: aiConversationsData } = useQuery<{
    conversations: { contact_phone?: string | null; marked_contacted?: boolean | null }[];
    stats: unknown;
  }>({
    queryKey: ["/api/admin/ai-conversations"],
    refetchInterval: 60_000,
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: quotesData } = useQuery<{ status?: string | null }[]>({
    queryKey: ["/api/admin/quotes"],
    refetchInterval: 60_000,
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: leadsData } = useQuery<{ status?: string | null }[]>({
    queryKey: ["/api/admin/leads"],
    refetchInterval: 60_000,
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const uncontactedCount = aiConversationsData?.conversations
    ? aiConversationsData.conversations.filter(
        (s) => s.contact_phone && !s.marked_contacted
      ).length
    : 0;

  const newQuotesCount = quotesData
    ? quotesData.filter((q) => q.status === "new").length
    : 0;

  const newLeadsCount = leadsData
    ? leadsData.filter((l) => l.status === "new").length
    : 0;

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
      {collapsed && !isMobile ? (
        /* Collapsed: round logo, clickable to expand */
        <div className="flex items-center justify-center border-b border-white/[0.06] py-3">
          <button
            onClick={() => setCollapsed(false)}
            className="w-9 h-9 rounded-full overflow-hidden hover:opacity-80 transition-opacity shrink-0"
            data-testid="button-toggle-sidebar"
            title="Expand sidebar"
          >
            <img src={mtvcLogoRound} alt="MTVC" className="w-full h-full object-cover" />
          </button>
        </div>
      ) : (
        /* Expanded (desktop or mobile) */
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/[0.06]">
          <img
            src={mtvcLogoWide}
            alt="Mobile Tyre Van City"
            className="h-9 w-auto object-contain shrink-0"
            style={{ maxWidth: "120px" }}
          />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest leading-tight flex-1 min-w-0">
            Admin
          </span>
          {!isMobile && (
            <button
              onClick={() => setCollapsed(true)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
              data-testid="button-toggle-sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>
      )}

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
                    badge={
                      item.href === "/admin/ai-conversations" ? uncontactedCount :
                      item.href === "/admin/quotes" ? newQuotesCount :
                      item.href === "/admin/leads" ? newLeadsCount :
                      undefined
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/[0.06] p-3 space-y-1`}>
        {/* User profile row */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setProfileOpen(true)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/5 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
              data-testid="button-open-profile"
            >
              <Avatar className="w-7 h-7 shrink-0 ring-1 ring-white/10">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || user?.username} />
                <AvatarFallback className="text-[10px] font-semibold bg-[#8bc440]/15 text-[#8bc440]">
                  {user?.firstName?.[0] || user?.email?.[0] || "A"}
                </AvatarFallback>
              </Avatar>
              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-zinc-300 truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email}
                  </p>
                  <p className="text-[10px] text-zinc-600 truncate">Edit profile</p>
                </div>
              )}
            </button>
          </TooltipTrigger>
          {(collapsed && !isMobile) && <TooltipContent side="right">Edit Profile</TooltipContent>}
        </Tooltip>

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
      <div className="hidden md:flex flex-col shrink-0 no-print" style={{ transition: "width 200ms" }}>
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
        <header className="flex items-center h-12 px-4 border-b border-white/[0.06] bg-[#0d0d0d] shrink-0 no-print">
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

        {/* Update available banner */}
        {updateAvailable && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/25 shrink-0"
            data-testid="banner-update-available"
          >
            <p className="text-xs text-amber-400 font-medium">
              The site has been updated. Refresh your browser to get the latest version — some actions may not save correctly until you do.
            </p>
            <button
              onClick={() => window.location.reload()}
              data-testid="button-refresh-now"
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap transition-colors shrink-0"
            >
              <RefreshCw size={13} />
              Refresh now
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Profile modal */}
      {user && (
        <AdminProfileModal
          user={user}
          open={profileOpen}
          onOpenChange={setProfileOpen}
        />
      )}
    </div>
  );
}
