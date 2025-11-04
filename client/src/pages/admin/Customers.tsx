import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Mail, Calendar, FileText, Link as LinkIcon, Search, ArrowLeft } from "lucide-react";
import type { User, Quote } from "@shared/schema";

export default function AdminCustomers() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [linkQuoteEmail, setLinkQuoteEmail] = useState("");
  const [linkQuoteUserId, setLinkQuoteUserId] = useState("");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<User[]>({
    queryKey: ['/api/admin/customers'],
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ['/api/admin/quotes'],
  });

  const { data: customerQuotes = [], isLoading: isLoadingQuotes } = useQuery<Quote[]>({
    queryKey: ['/api/admin/customers', selectedCustomer?.id, 'quotes'],
    enabled: !!selectedCustomer,
  });

  const linkQuotesMutation = useMutation({
    mutationFn: async ({ email, userId }: { email: string; userId: string }) => {
      return apiRequest('POST', '/api/admin/customers/link-quotes', { email, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      toast({
        title: "Success",
        description: "Quotes linked to customer account",
      });
      setIsLinkDialogOpen(false);
      setLinkQuoteEmail("");
      setLinkQuoteUserId("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to link quotes",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const filteredCustomers = searchEmail
    ? customers.filter(c => c.email?.toLowerCase().includes(searchEmail.toLowerCase()))
    : customers;

  const unlinkedQuotes = quotes.filter(q => !q.userId);

  const handleLinkQuotes = (email: string, userId: string) => {
    setLinkQuoteEmail(email);
    setLinkQuoteUserId(userId);
    setIsLinkDialogOpen(true);
  };

  const confirmLinkQuotes = () => {
    if (linkQuoteEmail && linkQuoteUserId) {
      linkQuotesMutation.mutate({ email: linkQuoteEmail, userId: linkQuoteUserId });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          Customer Accounts
        </h1>
        <p className="text-muted-foreground">
          Manage customer accounts and link quotes
        </p>
      </div>

      <div className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unlinked Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unlinkedQuotes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotes.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle>Customer List</CardTitle>
                <CardDescription>View and manage all customer accounts</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full max-w-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingCustomers ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Customers Found</h3>
                <p className="text-muted-foreground">
                  {searchEmail ? "No customers match your search" : "Customers will appear here when they create accounts"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((customer) => {
                  const customerQuoteCount = quotes.filter(q => q.userId === customer.id).length;
                  const unlinkedQuotesForEmail = unlinkedQuotes.filter(q => q.email === customer.email).length;
                  
                  return (
                    <Card key={customer.id} data-testid={`card-customer-${customer.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="w-4 h-4 text-accent" />
                              <span className="font-medium" data-testid={`text-customer-email-${customer.id}`}>
                                {customer.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>Joined {formatDate(customer.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {customerQuoteCount} {customerQuoteCount === 1 ? 'quote' : 'quotes'}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              {unlinkedQuotesForEmail > 0 && customer.email && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleLinkQuotes(customer.email!, customer.id)}
                                  data-testid={`button-link-quotes-${customer.id}`}
                                >
                                  <LinkIcon className="w-3 h-3 mr-1" />
                                  Link {unlinkedQuotesForEmail} Quote{unlinkedQuotesForEmail > 1 ? 's' : ''}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCustomer(customer)}
                                data-testid={`button-view-quotes-${customer.id}`}
                              >
                                View Quotes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Quotes Dialog */}
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Quotes</DialogTitle>
              <DialogDescription>
                Viewing quotes for {selectedCustomer?.email}
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingQuotes ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : customerQuotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No quotes found for this customer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customerQuotes.map((quote) => (
                  <Card key={quote.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-lg">{formatPrice(quote.estTotal)}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(quote.createdAt)}</div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          Pending
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span> {quote.userName}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span> {quote.phone}
                        </div>
                        {quote.company && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Company:</span> {quote.company}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Link Quotes Confirmation Dialog */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Quotes to Customer</DialogTitle>
              <DialogDescription>
                This will link all unlinked quotes with email "{linkQuoteEmail}" to this customer account.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                {unlinkedQuotes.filter(q => q.email === linkQuoteEmail).length} quote(s) will be linked.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsLinkDialogOpen(false)}
                disabled={linkQuotesMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmLinkQuotes}
                disabled={linkQuotesMutation.isPending}
                data-testid="button-confirm-link"
              >
                {linkQuotesMutation.isPending ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Linking...
                  </>
                ) : (
                  'Confirm Link'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
