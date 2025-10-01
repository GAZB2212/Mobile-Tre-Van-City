import { useAuth } from "@/hooks/useAuth";
import type { User, Lead } from "@shared/schema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Download,
  Calendar,
  User as UserIcon,
  Phone,
  Mail,
  MessageSquare,
  Globe,
  TrendingUp
} from "lucide-react";

export default function AdminLeads() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
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

  // Check if user is admin
  useEffect(() => {
    if (user && !user.isAdmin) {
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

  // Fetch leads data
  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
    enabled: !!user?.isAdmin,
  });

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

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  if (leadsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load leads</p>
        </div>
      </div>
    );
  }

  // Helper functions
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

  const getSourceBadge = (source: string) => {
    const sourceMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      "website": { variant: "default", icon: Globe },
      "contact-form": { variant: "secondary", icon: MessageSquare },
      "phone": { variant: "outline", icon: Phone },
      "email": { variant: "destructive", icon: Mail },
    };
    
    const config = sourceMap[source] || { variant: "outline" as const, icon: Globe };
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {source.charAt(0).toUpperCase() + source.slice(1).replace("-", " ")}
      </Badge>
    );
  };

  // Get unique sources for filter
  const uniqueSources = Array.from(new Set(leads.map((lead) => lead.source)));

  // Filter and sort leads
  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.message && lead.message.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

      if (!lead.createdAt) return matchesSearch && matchesSource;
      const leadDate = new Date(lead.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24));

      let matchesDate = true;
      if (dateFilter === "today") matchesDate = daysDiff === 0;
      else if (dateFilter === "week") matchesDate = daysDiff <= 7;
      else if (dateFilter === "month") matchesDate = daysDiff <= 30;

      return matchesSearch && matchesSource && matchesDate;
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
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const handleExportLeads = () => {
    if (filteredLeads.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no leads to export with the current filters.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "Date", "Name", "Email", "Phone", "Source", "Message"
    ];

    const csvRows = [
      headers.join(","),
      ...filteredLeads.map((lead) => [
        lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-GB") : "Unknown",
        `"${lead.name}"`,
        `"${lead.email}"`,
        `"${lead.phone || ""}"`,
        `"${lead.source}"`,
        `"${lead.message || ""}"`
      ].join(","))
    ];

    // Create and trigger download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredLeads.length} leads to CSV file.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                Lead Management
              </h1>
              <p className="text-muted-foreground">
                Track and manage customer inquiries and leads
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportLeads}
                data-testid="button-export-leads"
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
            <CardTitle>Filter Leads</CardTitle>
            <CardDescription>
              Search and filter leads by customer details, source, or date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-leads"
                  />
                </div>
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-source-filter">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source.charAt(0).toUpperCase() + source.slice(1).replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <SelectTrigger className="w-[180px]" data-testid="select-sort-leads">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
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
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-leads">{leads.length}</p>
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
                  <p className="text-2xl font-bold" data-testid="stat-week-leads">
                    {leads.filter((lead) => {
                      if (!lead.createdAt) return false;
                      const leadDate = new Date(lead.createdAt);
                      const now = new Date();
                      const daysDiff = Math.floor((now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24));
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
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold" data-testid="stat-today-leads">
                    {leads.filter((lead) => {
                      if (!lead.createdAt) return false;
                      const leadDate = new Date(lead.createdAt);
                      const now = new Date();
                      const daysDiff = Math.floor((now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24));
                      return daysDiff === 0;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Top Source</p>
                  <p className="text-sm font-bold" data-testid="stat-top-source">
                    {leads.length > 0 ? 
                      Object.entries(
                        leads.reduce((acc: Record<string, number>, lead) => {
                          acc[lead.source] = (acc[lead.source] || 0) + 1;
                          return acc;
                        }, {})
                      ).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0]?.replace("-", " ") || "None"
                      : "None"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        {leadsLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading leads...</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leads found</h3>
              <p className="text-muted-foreground">
                {searchTerm || sourceFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters to see more leads."
                  : "Customer inquiries and leads will appear here."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover-elevate">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        {lead.name}
                        {getSourceBadge(lead.source)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.createdAt)}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                {lead.message && (
                  <CardContent>
                    <div className="p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </div>
                      <p className="text-sm text-muted-foreground">{lead.message}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}