import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

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
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl">TyreVans</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`link-${item.name.toLowerCase()}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button 
              className="hidden md:flex bg-chart-3 hover:bg-chart-3/90 text-black font-semibold"
              data-testid="button-configure"
            >
              Configure Your Van
            </Button>

            {/* Authentication Section */}
            {!isLoading && (
              <div className="hidden md:flex items-center space-x-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{user?.firstName || user?.email}</span>
                      {user?.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    {user?.isAdmin && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/admin" data-testid="link-admin">
                          <Shield className="w-4 h-4 mr-1" />
                          Admin
                        </Link>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = "/api/logout"}
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = "/api/login"}
                    data-testid="button-login"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Login
                  </Button>
                )}
              </div>
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
                className="bg-chart-3 hover:bg-chart-3/90 text-black font-semibold w-full"
                data-testid="mobile-button-configure"
              >
                Configure Your Van
              </Button>

              {/* Mobile Authentication */}
              {!isLoading && (
                <div className="pt-4 border-t">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm">{user?.firstName || user?.email}</span>
                          {user?.isAdmin && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                      {user?.isAdmin && (
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href="/admin" data-testid="mobile-link-admin">
                            <Shield className="w-4 h-4 mr-1" />
                            Admin Panel
                          </Link>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => window.location.href = "/api/logout"}
                        data-testid="mobile-button-logout"
                      >
                        <LogOut className="w-4 h-4 mr-1" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline"
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