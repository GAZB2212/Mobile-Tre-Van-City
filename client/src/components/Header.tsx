import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Shield, Phone, Clock } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import logoImage from "@assets/Untitled design-51_1759240381746.png";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Stock", href: "/stock" },
    { name: "Finance", href: "/finance" },
    { name: "Gallery", href: "/gallery" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top Utility Bar */}
      <div className="border-b border-border/20 bg-card">
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
              <span className="hidden sm:inline">FCA Authorised Finance</span>
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
        <div className="flex items-center justify-between md:justify-between justify-center py-3 md:py-4">
          <Link href="/" className="flex items-center md:flex-none flex-1 justify-center md:justify-start" data-testid="link-home">
            <img 
              src={logoImage} 
              alt="Mobile Tyre Van City" 
              className="h-16 md:h-36 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
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

          <div className="flex items-center gap-4 md:flex md:relative absolute right-4">
            <Button 
              variant="default"
              size="lg"
              className="hidden md:flex bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              data-testid="button-configure"
            >
              Configure Your Van
            </Button>

            {/* Authentication Section */}
            {!isLoading && !isAuthenticated && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
                className="hidden md:flex"
              >
                <User className="w-4 h-4 mr-1" />
                Login
              </Button>
            )}
            {!isLoading && isAuthenticated && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
                className="hidden md:flex"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-menu-toggle"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid={`mobile-link-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Link>
              ))}
              <Button 
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold w-full"
                data-testid="mobile-button-configure"
              >
                Configure Your Van
              </Button>

              {/* Mobile Authentication */}
              {!isLoading && (
                <div className="pt-4 border-t">
                  {isAuthenticated ? (
                    <>
                      {user?.isAdmin && (
                        <Button variant="ghost" size="sm" className="w-full mb-2" asChild>
                          <Link href="/admin" data-testid="mobile-link-admin">
                            <Shield className="w-4 h-4 mr-1" />
                            Admin Panel
                          </Link>
                        </Button>
                      )}
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => window.location.href = "/api/logout"}
                        data-testid="mobile-button-logout"
                      >
                        <LogOut className="w-4 h-4 mr-1" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => window.location.href = "/api/login"}
                      data-testid="mobile-button-login"
                    >
                      <User className="w-4 h-4 mr-1" />
                      Login
                    </Button>
                  )}
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}