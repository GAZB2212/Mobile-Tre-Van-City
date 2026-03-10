import { useState } from "react";
import { Link, useParams } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", `/api/auth/reset-password/${token}`, { password });
      return res.json();
    },
    onSuccess: () => {
      setDone(true);
    },
    onError: (error: any) => {
      toast({
        title: "Reset failed",
        description: error.message || "This link may have expired. Please request a new one.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }
    mutation.mutate(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SEO
        title="Reset Password | Mobile Tyre Van City"
        description="Set a new password for your Mobile Tyre Van City account."
        noindex={true}
      />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {done ? (
              <CheckCircle className="w-12 h-12 text-accent" />
            ) : (
              <KeyRound className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl text-center">
            {done ? "Password updated" : "Set new password"}
          </CardTitle>
          <CardDescription className="text-center">
            {done
              ? "Your password has been changed. You can now log in with your new password."
              : "Choose a strong password — at least 8 characters."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  autoFocus
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  data-testid="input-confirm-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
                data-testid="button-set-password"
              >
                {mutation.isPending ? "Saving..." : "Set new password"}
              </Button>
            </form>
          ) : (
            <div className="text-center pt-2">
              <Link href="/login">
                <Button className="w-full" data-testid="button-go-login">
                  Go to login
                </Button>
              </Link>
            </div>
          )}
          {!done && (
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3 h-3" />
                Back to login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
