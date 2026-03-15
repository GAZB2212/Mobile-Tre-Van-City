function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "new": return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "contacted": return "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300";
    case "awaiting_deposit": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-800";
    case "awaiting_finance": return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
    case "deposit_taken": return "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300";
    case "finance_approved": return "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300";
    case "in_build": return "bg-[#8bc440]/20 text-[#3a6a0a] dark:text-[#8bc440]";
    case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    default: return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    awaiting_deposit: "Awaiting Deposit",
    awaiting_finance: "Finance Submitted",
    deposit_taken: "Deposit Taken",
    finance_approved: "Finance Approved",
    in_build: "In Build",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

import { useAuth } from "@/hooks/useAuth";
import { useCanEdit } from "@/hooks/useCanEdit";
import type { User, Quote, Van, Kit, Upgrade } from "@shared/schema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminBackButton } from "@/components/AdminBackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Search, 
  Download,
  Calendar,
  User as UserIcon,
  Phone,
  Mail,
  Building,
  Car,
  Package,
  Wrench,
  StickyNote,
  PoundSterling,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AdminQuotes() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check if user has admin role (basic or full)
  useEffect(() => {
    if (user && (!user.adminRole || user.adminRole === "none")) {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [user, toast]);

  // Fetch quotes data
  const { data: quotes = [], isLoading: quotesLoading, error: quotesError } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  // Fetch vans, kits, and upgrades for reference data
  const { data: vans = [] } = useQuery<Van[]>({
    queryKey: ["/api/admin/vans"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: kits = [] } = useQuery<Kit[]>({
    queryKey: ["/api/admin/kits"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: upgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  // Only full admins can edit quotes
  const canEdit = useCanEdit();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.adminRole || user.adminRole === "none") {
    return null;
  }

  if (quotesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load quotes</p>
        </div>
      </div>
    );
  }

  // Helper functions
  const formatPrice = (pence: number): string => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | Date | null): string => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getVanName = (vanId: string | null): string => {
    if (!vanId) return "No van selected";
    const van = vans.find((v) => v.id === vanId);
    return van ? `${van.make} ${van.model}` : "Unknown van";
  };

  const getKitName = (kitId: string | null): string => {
    if (!kitId) return "No kit selected";
    const kit = kits.find((k) => k.id === kitId);
    return kit?.name || "Unknown kit";
  };

  const getUpgradeNames = (upgradeIds: string[]): string => {
    if (!upgradeIds.length) return "No upgrades";
    const selectedUpgrades = upgrades.filter((u) => upgradeIds.includes(u.id));
    return selectedUpgrades.map((u) => u.name).join(", ");
  };

  const getUpgradeList = (upgradeIds: string[]): string[] => {
    if (!upgradeIds.length) return [];
    return upgrades.filter((u) => upgradeIds.includes(u.id)).map((u) => u.name);
  };

  // Filter and sort quotes
  const filteredQuotes = quotes
    .filter((quote) => {
      const normalizedSearch = searchTerm.toLowerCase().replace(/^#/, '');
      const shortId = quote.id.slice(0, 8).toUpperCase();
      const matchesSearch = 
        quote.userName.toLowerCase().includes(normalizedSearch) ||
        quote.email.toLowerCase().includes(normalizedSearch) ||
        (quote.company && quote.company.toLowerCase().includes(normalizedSearch)) ||
        quote.id.toLowerCase().includes(normalizedSearch) ||
        shortId.toLowerCase().includes(normalizedSearch);

      if (!quote.createdAt) return matchesSearch;
      const quoteDate = new Date(quote.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24));

      let matchesDate = true;
      if (dateFilter === "today") matchesDate = daysDiff === 0;
      else if (dateFilter === "week") matchesDate = daysDiff <= 7;
      else if (dateFilter === "month") matchesDate = daysDiff <= 30;

      const matchesStatus = statusFilter === "all" || quote.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      }
      if (sortBy === "oldest") {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aDate - bDate;
      }
      if (sortBy === "highest") return b.estTotal - a.estTotal;
      if (sortBy === "lowest") return a.estTotal - b.estTotal;
      return 0;
    });

  const handleExportQuotes = () => {
    if (filteredQuotes.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no quotes to export with the current filters.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "Date", "Customer Name", "Email", "Phone", "Company", 
      "Van", "Equipment Package", "Upgrades", "Notes",
      "Subtotal (£)", "VAT (£)", "Total (£)"
    ];

    const csvRows = [
      headers.join(","),
      ...filteredQuotes.map((quote) => [
        quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("en-GB") : "Unknown",
        `"${quote.userName}"`,
        `"${quote.email}"`,
        `"${quote.phone}"`,
        `"${quote.company || ""}"`,
        `"${getVanName(quote.vanId)}"`,
        `"${getKitName(quote.kitId)}"`,
        `"${getUpgradeNames(quote.selectedUpgradeIds)}"`,
        `"${quote.notes || ""}"`,
        (quote.estSubtotal / 100).toFixed(2),
        (quote.estVAT / 100).toFixed(2),
        (quote.estTotal / 100).toFixed(2)
      ].join(","))
    ];

    // Create and trigger download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `quotes-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredQuotes.length} quotes to CSV file.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminBackButton />
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Configurator Management
              </h1>
              <p className="text-muted-foreground">
                Review and manage customer configurators
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={handleExportQuotes}
                data-testid="button-export-quotes"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" asChild>
                <a href="/admin" data-testid="link-admin-dashboard">
                  Back to Dashboard
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Configurators</CardTitle>
            <CardDescription>
              Search and filter configurators by customer details or date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, company or quote number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-quotes"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="awaiting_deposit">Awaiting Deposit</SelectItem>
                  <SelectItem value="awaiting_finance">Finance Submitted</SelectItem>
                  <SelectItem value="deposit_taken">Deposit Taken</SelectItem>
                  <SelectItem value="finance_approved">Finance Approved</SelectItem>
                  <SelectItem value="in_build">In Build</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[160px]" data-testid="select-date-filter">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-sort-quotes">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="highest">Highest value</SelectItem>
                  <SelectItem value="lowest">Lowest value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Configurators</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-quotes">{quotes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PoundSterling className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-value">
                    {formatPrice(quotes.reduce((sum, quote) => sum + quote.estTotal, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold" data-testid="stat-week-quotes">
                    {quotes.filter((quote) => {
                      if (!quote.createdAt) return false;
                      const quoteDate = new Date(quote.createdAt);
                      const now = new Date();
                      const daysDiff = Math.floor((now.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24));
                      return daysDiff <= 7;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PoundSterling className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Value</p>
                  <p className="text-2xl font-bold" data-testid="stat-average-value">
                    {quotes.length > 0 ? formatPrice(Math.round(quotes.reduce((sum, quote) => sum + quote.estTotal, 0) / quotes.length)) : "£0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quotes List */}
        {quotesLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading quotes...</p>
            </CardContent>
          </Card>
        ) : filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No configurators found</h3>
              <p className="text-muted-foreground">
                {searchTerm || dateFilter !== "all" 
                  ? "Try adjusting your filters to see more configurators."
                  : "Customer configurators will appear here once they start using the configurator."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredQuotes.map((quote) => {
              const isExpanded = expandedIds.has(quote.id);
              return (
                <Card key={quote.id}>
                  {/* Collapsed summary row — always visible, click to expand */}
                  <button
                    className="w-full text-left"
                    onClick={() => toggleExpanded(quote.id)}
                    data-testid={`button-expand-${quote.id}`}
                  >
                    <div className="flex items-center justify-between gap-4 px-4 py-3 hover-elevate rounded-md">
                      {/* Left: name, company, status */}
                      <div className="flex items-center gap-3 flex-wrap min-w-0">
                        <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-sm truncate" data-testid={`text-name-${quote.id}`}>{quote.userName}</span>
                        {quote.company && (
                          <Badge variant="secondary" className="shrink-0" data-testid={`text-company-${quote.id}`}>{quote.company}</Badge>
                        )}
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium shrink-0 ${getStatusBadgeClass(quote.status)}`}
                          data-testid={`status-badge-${quote.id}`}
                        >
                          {getStatusLabel(quote.status)}
                        </span>
                      </div>

                      {/* Centre: phone & email */}
                      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {quote.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {quote.email}
                        </span>
                      </div>

                      {/* Right: total + chevron */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-sm" data-testid={`quote-total-${quote.id}`}>{formatPrice(quote.estTotal)}</span>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail — only visible when open */}
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-4 border-t">
                      {/* Mobile phone/email row */}
                      <div className="flex md:hidden items-center gap-4 text-sm text-muted-foreground mb-4 mt-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {quote.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {quote.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(quote.createdAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {/* Van Selection */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Car className="w-4 h-4" />
                            Van
                          </div>
                          {quote.vanId ? (
                            <p className="text-sm text-muted-foreground">{getVanName(quote.vanId)}</p>
                          ) : quote.customVanValue || quote.vanRegistration || quote.customVanDescription ? (
                            <div className="space-y-0.5">
                              {quote.vanRegistration && (
                                <p className="text-sm font-medium">{quote.vanRegistration.toUpperCase()}</p>
                              )}
                              {quote.customVanDescription && (
                                <p className="text-sm text-muted-foreground">{quote.customVanDescription}</p>
                              )}
                              {quote.customVanValue && (
                                <p className="text-sm text-muted-foreground">£{(quote.customVanValue / 100).toLocaleString()}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No van selected</p>
                          )}
                        </div>

                        {/* Kit Selection */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Package className="w-4 h-4" />
                            Equipment Package
                          </div>
                          <p className="text-sm text-muted-foreground">{getKitName(quote.kitId)}</p>
                        </div>

                        {/* Upgrades */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Wrench className="w-4 h-4" />
                            Upgrades ({quote.selectedUpgradeIds.length})
                          </div>
                          {quote.selectedUpgradeIds.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No upgrades</p>
                          ) : (
                            <ul className="space-y-0.5">
                              {getUpgradeList(quote.selectedUpgradeIds).map((name, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                                  {name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {quote.notes && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2 text-sm font-medium mb-1">
                            <StickyNote className="w-4 h-4" />
                            Customer Notes
                          </div>
                          <p className="text-sm text-muted-foreground">{quote.notes}</p>
                        </div>
                      )}

                      {/* Pricing Breakdown */}
                      <div className="mt-4 p-3 border rounded-md">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>{formatPrice(quote.estSubtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>VAT (20%):</span>
                            <span>{formatPrice(quote.estVAT)}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t pt-1">
                            <span>Total:</span>
                            <span>{formatPrice(quote.estTotal)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex justify-end gap-3 flex-wrap">
                        <Button variant="default" asChild data-testid={`button-manage-${quote.id}`}>
                          <Link href={`/admin/quotes/${quote.id}`}>
                            <Wrench className="w-4 h-4 mr-2" />
                            Manage Configurator
                          </Link>
                        </Button>
                        <Button variant="outline" asChild data-testid={`button-build-sheet-${quote.id}`}>
                          <Link href={`/admin/quotes/${quote.id}/build-sheet`}>
                            <Printer className="w-4 h-4 mr-2" />
                            View Build Sheet
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}