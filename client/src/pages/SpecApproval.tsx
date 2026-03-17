import { useParams, useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type ApprovalInfo = {
  ref: string;
  customerName: string;
  specApprovalStatus: "approved" | "rejected" | null;
  specApprovalComments: string | null;
};

export default function SpecApproval() {
  const { token } = useParams<{ token: string }>();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const preselectedStatus = params.get("status") as "approved" | "rejected" | null;

  const [selectedStatus, setSelectedStatus] = useState<"approved" | "rejected" | null>(null);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: info, isLoading, error } = useQuery<ApprovalInfo>({
    queryKey: [`/api/spec-approval/${token}`],
    enabled: !!token,
  });

  useEffect(() => {
    if (preselectedStatus && (preselectedStatus === "approved" || preselectedStatus === "rejected")) {
      setSelectedStatus(preselectedStatus);
    }
  }, [preselectedStatus]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/spec-approval/${token}`, {
        status: selectedStatus,
        comments: comments.trim() || undefined,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Link Not Found</h2>
              <p className="text-muted-foreground mb-6">
                This approval link is invalid or has expired. Please contact us if you need to provide feedback on your specification.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-accent" />
                <a href="tel:01512038500" className="text-accent font-medium hover:underline">
                  0151 203 8500
                </a>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Already responded (in DB)
  const alreadyAnswered = info.specApprovalStatus !== null;

  // Just submitted in this session
  if (submitted || alreadyAnswered) {
    const status = alreadyAnswered ? info.specApprovalStatus : selectedStatus;
    const isApproved = status === "approved";

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="max-w-lg w-full" data-testid="card-approval-submitted">
            <CardContent className="py-12 text-center">
              {isApproved ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <Badge variant="outline" className="mb-4 border-green-500 text-green-600">
                    Confirmed
                  </Badge>
                  <h2 className="text-2xl font-bold mb-3">Thanks, {info.customerName.split(" ")[0]}!</h2>
                  <p className="text-muted-foreground">
                    We've noted that your specification looks correct. Our team will be in touch shortly to progress your order.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                    <XCircle className="w-8 h-8 text-orange-500" />
                  </div>
                  <Badge variant="outline" className="mb-4 border-orange-500 text-orange-500">
                    Feedback Received
                  </Badge>
                  <h2 className="text-2xl font-bold mb-3">Got it, {info.customerName.split(" ")[0]}</h2>
                  <p className="text-muted-foreground mb-4">
                    We've received your feedback and a member of our team will review it and be in touch to discuss the changes.
                  </p>
                  {(info.specApprovalComments || comments) && (
                    <div className="text-left bg-muted rounded-md p-4 text-sm text-muted-foreground mt-2">
                      <p className="font-medium mb-1">Your comments:</p>
                      <p className="whitespace-pre-wrap">{info.specApprovalComments || comments}</p>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center justify-center gap-2 text-sm mt-6">
                <Phone className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Questions?</span>
                <a href="tel:01512038500" className="text-accent font-medium hover:underline">
                  0151 203 8500
                </a>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const canSubmit = selectedStatus !== null && (selectedStatus === "approved" || comments.trim().length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Reference <span className="font-mono font-semibold">#{info.ref}</span></p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Hi {info.customerName.split(" ")[0]},</h1>
            <p className="text-muted-foreground">
              Please let us know whether the van conversion specification we discussed is correct.
            </p>
          </div>

          {/* Choice buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedStatus("approved")}
              data-testid="button-approve"
              className={`rounded-md p-5 border-2 text-left transition-colors ${
                selectedStatus === "approved"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-border hover-elevate"
              }`}
            >
              <CheckCircle className={`w-6 h-6 mb-2 ${selectedStatus === "approved" ? "text-green-500" : "text-muted-foreground"}`} />
              <p className="font-semibold">This looks correct</p>
              <p className="text-sm text-muted-foreground mt-1">I'm happy with the specification</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("rejected")}
              data-testid="button-reject"
              className={`rounded-md p-5 border-2 text-left transition-colors ${
                selectedStatus === "rejected"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-border hover-elevate"
              }`}
            >
              <XCircle className={`w-6 h-6 mb-2 ${selectedStatus === "rejected" ? "text-orange-500" : "text-muted-foreground"}`} />
              <p className="font-semibold">Something needs changing</p>
              <p className="text-sm text-muted-foreground mt-1">I'd like to flag an issue</p>
            </button>
          </div>

          {/* Comments area — only when rejecting */}
          {selectedStatus === "rejected" && (
            <div className="space-y-2" data-testid="section-comments">
              <label htmlFor="comments" className="text-sm font-medium">
                Please describe what needs changing <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="comments"
                data-testid="textarea-comments"
                placeholder="e.g. The compressor type is wrong, I wanted the 12V version..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={5}
              />
            </div>
          )}

          {/* Submit */}
          {selectedStatus !== null && (
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!canSubmit || submitMutation.isPending}
              size="lg"
              className="w-full bg-accent text-accent-foreground"
              data-testid="button-submit-approval"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : selectedStatus === "approved" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm — this is correct
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Send my feedback
                </>
              )}
            </Button>
          )}

          {submitMutation.error && (
            <p className="text-sm text-destructive text-center" data-testid="text-approval-error">
              {(submitMutation.error as any)?.message || "Something went wrong. Please try again or call us on 0151 203 8500."}
            </p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Prefer to speak to someone?{" "}
            <a href="tel:01512038500" className="text-accent font-medium hover:underline">
              Call 0151 203 8500
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
