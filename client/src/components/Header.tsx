import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Shield, Phone, Clock, Package } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/logo_17_1770396630370.png";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Stock", href: "/stock" },
    { name: "Finance", href: "/finance" },
    { name: "Gallery", href: "/gallery" },
    { name: "Training", href: "/training" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
      {/* Top Utility Bar */}
      <div className="border-b border-white/10 bg-transparent">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-xs">
            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                <span>0800 123 4567</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Mon-Fri 8am-6pm</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              {!isLoading && isAuthenticated && user?.isAdmin && (
                <Link href="/admin" className="text-accent hover:text-accent/80 font-medium">
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 md:py-4 gap-3 md:gap-4">
          <Link href="/" className="flex items-center flex-shrink-0" data-testid="link-home">
            <img 
              src={logoImage} 
              alt="Northwest Van Conversions" 
              className="h-20 sm:h-24 md:h-16 lg:h-24 xl:h-32 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-foreground hover:text-accent transition-colors tracking-wide uppercase"
                data-testid={`link-${item.name.toLowerCase()}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            <Button 
              variant="default"
              size="lg"
              className="hidden lg:flex bg-accent hover:bg-accent/90 text-accent-foreground font-semibold whitespace-nowrap text-sm xl:text-base px-4 xl:px-6"
              data-testid="button-configure"
              asChild
            >
              <Link href="/configurator/van">Configure Your Van</Link>
            </Button>

            {/* Admin Authentication Section */}
            {!isLoading && isAuthenticated && user?.isAdmin && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
                className="hidden lg:flex"
              >
                <LogOut className="w-4 h-4 mr-1" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-menu-toggle"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="flex flex-col space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-accent transition-colors py-2 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid={`mobile-link-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Link>
              ))}
              <Button 
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold w-full mt-2"
                data-testid="mobile-button-configure"
                asChild
                onClick={() => setIsMenuOpen(false)}
              >
                <Link href="/configurator/van">Configure Your Van</Link>
              </Button>

              {/* Mobile Admin Authentication */}
              {!isLoading && isAuthenticated && user?.isAdmin && (
                <div className="pt-4 border-t space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                    <Link href="/admin" data-testid="mobile-link-admin">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    disabled={logoutMutation.isPending}
                    data-testid="mobile-button-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}