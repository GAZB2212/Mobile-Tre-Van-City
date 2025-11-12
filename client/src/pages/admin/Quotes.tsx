import { useAuth } from "@/hooks/useAuth";
import { useCanEdit } from "@/hooks/useCanEdit";
import type { User, Quote, Van, Kit, Upgrade } from "@shared/schema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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
  Printer
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
  const [sortBy, setSortBy] = useState("newest");

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

  // Filter and sort quotes
  const filteredQuotes = quotes
    .filter((quote) => {
      const matchesSearch = 
        quote.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.company && quote.company.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!quote.createdAt) return matchesSearch;
      const quoteDate = new Date(quote.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24));

      let matchesDate = true;
      if (dateFilter === "today") matchesDate = daysDiff === 0;
      else if (dateFilter === "week") matchesDate = daysDiff <= 7;
      else if (dateFilter === "month") matchesDate = daysDiff <= 30;

      return matchesSearch && matchesDate;
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
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Quote Management
              </h1>
              <p className="text-muted-foreground">
                Review and manage customer quotes
              </p>
            </div>
            <div className="flex items-center gap-2">
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
            <CardTitle>Filter Quotes</CardTitle>
            <CardDescription>
              Search and filter quotes by customer details or date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-quotes"
                  />
                </div>
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-date-filter">
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
                <SelectTrigger className="w-[180px]" data-testid="select-sort-quotes">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Quotes</p>
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
              <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
              <p className="text-muted-foreground">
                {searchTerm || dateFilter !== "all" 
                  ? "Try adjusting your filters to see more quotes."
                  : "Customer quotes will appear here once they start using the configurator."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuotes.map((quote) => (
              <Card key={quote.id} className="hover-elevate">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        {quote.userName}
                        {quote.company && (
                          <Badge variant="secondary">{quote.company}</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {quote.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {quote.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(quote.createdAt)}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground" data-testid={`quote-total-${quote.id}`}>
                        {formatPrice(quote.estTotal)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        +VAT: {formatPrice(quote.estVAT)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Van Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Car className="w-4 h-4" />
                        Van
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getVanName(quote.vanId)}
                      </p>
                    </div>

                    {/* Kit Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="w-4 h-4" />
                        Equipment Package
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getKitName(quote.kitId)}
                      </p>
                    </div>

                    {/* Upgrades */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Wrench className="w-4 h-4" />
                        Upgrades ({quote.selectedUpgradeIds.length})
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getUpgradeNames(quote.selectedUpgradeIds)}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {quote.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
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
                  <div className="mt-4 flex justify-end gap-3">
                    <Button variant="default" asChild data-testid={`button-manage-${quote.id}`}>
                      <Link href={`/admin/quotes/${quote.id}`}>
                        <Wrench className="w-4 h-4 mr-2" />
                        Manage Quote
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
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}