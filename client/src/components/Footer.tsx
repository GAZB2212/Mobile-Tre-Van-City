import { Link } from "wouter";
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Shield } from "lucide-react";

export default function Footer() {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Stock", href: "/stock" },
    { name: "Configurator", href: "/configurator/van" },
    { name: "Finance", href: "/finance" },
    { name: "Gallery", href: "/gallery" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" }
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/legal/privacy" },
    { name: "Terms & Conditions", href: "/legal/terms" },
    { name: "Cookie Policy", href: "/legal/cookies" }
  ];

  const services = [
    "Van Conversions",
    "Equipment Supply",
    "Finance Options", 
    "Nationwide Delivery",
    "After-Sales Support",
    "Training & Support"
  ];

  return (
    <footer className="bg-background text-foreground border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-xl">TyreVans</span>
            </div>
            <p className="text-primary-foreground/80 mb-4">
              UK's leading mobile tyre van conversion specialists. Custom-built solutions for your mobile tyre business.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 hover:text-accent cursor-pointer transition-colors" data-testid="link-facebook" />
              <Twitter className="w-5 h-5 hover:text-accent cursor-pointer transition-colors" data-testid="link-twitter" />
              <Linkedin className="w-5 h-5 hover:text-accent cursor-pointer transition-colors" data-testid="link-linkedin" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-accent transition-colors"
                    data-testid={`footer-link-${link.name.toLowerCase()}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service} className="text-primary-foreground/80">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2" data-testid="contact-phone">
                <Phone className="w-4 h-4" />
                <span className="text-primary-foreground/80">0800 123 4567</span>
              </div>
              <div className="flex items-center space-x-2" data-testid="contact-email">
                <Mail className="w-4 h-4" />
                <span className="text-primary-foreground/80">info@tyrevans.co.uk</span>
              </div>
              <div className="flex items-start space-x-2" data-testid="contact-address">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span className="text-primary-foreground/80">
                  123 Industrial Estate<br />
                  Manchester, M1 1AA
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-primary-foreground/80 text-sm">
              © 2024 TyreVans. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {legalLinks.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href}
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                  data-testid={`footer-legal-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {link.name}
                </Link>
              ))}
              <span className="text-primary-foreground/20">|</span>
              <Link
                href="/login"
                className="text-primary-foreground/80 hover:text-accent transition-colors text-sm flex items-center gap-1"
                data-testid="footer-admin-login"
              >
                <Shield className="w-3 h-3" />
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}