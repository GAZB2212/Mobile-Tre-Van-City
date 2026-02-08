import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import logoPath from "@assets/logo_17_1770396630370.png";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/site-auth/status")
      .then(res => res.json())
      .then(data => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/site-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoPath} alt="Northwest Van Conversions" className="h-16 object-contain" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            Password Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter site password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-site-password"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive" data-testid="text-password-error">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password}
              data-testid="button-submit-password"
            >
              {loading ? "Checking..." : "Enter Site"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
