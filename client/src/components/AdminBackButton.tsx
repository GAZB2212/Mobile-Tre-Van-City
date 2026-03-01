import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function AdminBackButton() {
  return (
    <div className="border-b bg-background">
      <div className="px-6 py-3">
        <Button variant="ghost" size="sm" asChild data-testid="button-back-to-admin">
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
        </Button>
      </div>
    </div>
  );
}
