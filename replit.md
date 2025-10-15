# Mobile Tyre Van Conversion Website

## Overview

A modern, conversion-focused website for a company that designs and builds mobile tyre vans. The application enables customers to browse van stock, configure custom builds through an interactive multi-step process, and request quotes. Built with a focus on lead generation, user experience, and business conversion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: TailwindCSS with shadcn/ui component library for consistent, accessible UI components
- **State Management**: TanStack Query for server state management and caching
- **Forms**: React Hook Form with Zod validation for robust form handling

### Backend Architecture
- **Runtime**: Node.js with Express server in TypeScript
- **API Design**: RESTful endpoints with structured route handling
- **Data Layer**: Drizzle ORM providing type-safe database operations
- **Storage**: PostgreSQL (production) with Neon serverless database provider
- **Session Management**: Express sessions with PostgreSQL store

### Database Design
- **Van Management**: Complete CRUD for vehicle inventory with specifications, pricing, and image handling
- **Equipment Configuration**: Kits and upgrades system for modular tyre equipment packages with custom sort ordering
- **Lead Capture**: Quote and lead tracking system for business conversion
- **User Management**: Basic authentication system for admin functionality

### Component Architecture
- **Atomic Design**: Reusable UI components built on Radix UI primitives
- **Responsive Design**: Mobile-first approach with industrial/automotive styling
- **Interactive Features**: Multi-step configurator with real-time pricing calculations
- **Performance**: Optimized images and lazy loading for fast page loads

### Business Logic
- **Conversion Funnel**: Customer journey system guiding users through Van → Kit → Finance → Quote
- **Configurator Flow**: Multi-step wizard with localStorage persistence via ConfiguratorProvider
- **Finance Plans**: Complete finance options system (Hire Purchase, Lease) with APR calculations
- **Pricing Engine**: Dynamic calculation system with VAT handling and currency formatting
- **Lead Generation**: Form capture with email notifications and quote generation
- **Content Management**: Admin interface for managing inventory, finance plans, and leads
- **Equipment Ordering**: Drag-free reordering system using up/down arrows to control equipment display order within categories
  - Each upgrade has a `sortOrder` field (integer, default 0) for position control
  - Admin can reorder items within their category using arrow buttons
  - Sort order is preserved across both standalone items and grouped items with variants
  - Configurator displays equipment in admin-defined order via `/api/admin/upgrades/:id/sort-order` endpoint

## External Dependencies

### Database & Hosting
- **Neon Database**: Serverless PostgreSQL for production data storage
- **Drizzle Kit**: Database migrations and schema management

### UI & Styling
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Lucide React**: Consistent icon system throughout the application
- **TailwindCSS**: Utility-first CSS framework with custom design tokens
- **Google Fonts**: Inter font family for professional typography

### Development Tools
- **TypeScript**: Static type checking across full stack
- **ESBuild**: Fast JavaScript bundling for production builds
- **PostCSS**: CSS processing with Autoprefixer for browser compatibility

### Image Assets
- Generated placeholder images stored in `attached_assets/generated_images/` for van stock and equipment displays
- Responsive image handling with proper aspect ratios for mobile optimization
- **Object Storage Integration**: Admin image uploads via presigned URLs with ACL management
  - `/api/admin/objects/presigned-url` - Generate presigned upload URLs for admin uploads
  - `/api/admin/objects/set-acl` - Set ACL policy (public/private) on uploaded objects
  - Supports PNG, JPEG, GIF, WebP, and SVG image formats
  - Images stored in Google Cloud Storage with automatic ACL management
  - Public images (equipment, vans) accessible without authentication for public pages
- **Image Gallery System**: Interactive image viewer for equipment and upgrades
  - All upgrade images clickable to expand and view larger in modal gallery
  - Carousel navigation for multiple images per item
  - Hover indicator shows "+X more" for multiple images or "View" for single images
  - Works for both standalone upgrades and variant groups
  - Unique uploader IDs ensure correct file picker opens for each variant

### Business Features
- **Finance Integration**: Placeholder for FCA-compliant finance options and calculations
- **Email System**: Infrastructure ready for quote delivery and lead notifications
- **SEO Optimization**: Comprehensive search engine optimization system
  - Dynamic meta tags (title, description) unique to each page
  - Open Graph tags for social media sharing (Facebook, Twitter, LinkedIn)
  - JSON-LD structured data for rich search results (Organization, Product, BreadcrumbList schemas)
  - Automatic script cleanup preventing stale schema across route changes
  - Canonical URLs for duplicate content management
  - Sitemap.xml for search engine crawling (`/sitemap.xml`)
  - Robots.txt for crawler directives (`/robots.txt`)
  - Product structured data on van detail pages with pricing and availability
  - SEO component at `client/src/components/SEO.tsx` used across all public pages
- **Complete Training Programme**: Comprehensive in-house training for motorway operations and tyre fitting
  - Full training page (`/training`) covering both REACT and tyre fitting certifications
  - REACT Training: Legal requirement for UK motorway operations (6 modules: highway code, vehicle positioning, risk assessment, emergency procedures, equipment safety, practical assessment)
  - Tyre Fitting Training: Professional mobile tyre service expertise (6 modules: tyre technology, mobile fitting techniques, wheel balancing, puncture repair, TPMS systems, customer service)
  - Training section on home page highlighting both certifications included with every van purchase
  - Complete package for full compliance and operational readiness from day one

### Vehicle Data Integration
- **CheckCarDetails API**: Automated vehicle data lookup using UK registration numbers
  - Makes 3 parallel API calls for comprehensive vehicle information:
    1. `VehicleData` - Registration data (make, model, year, colour, fuel, engine)
    2. `VehicleData` - Specifications (body style, transmission, power, dimensions, weights)
    3. `MotHistoryData` - MOT history with current mileage and test status
  - Auto-populates van creation form with: make, model, year, mileage (from MOT), transmission, fuel type, engine size, body style
  - Optimized for cost efficiency by using only essential endpoints
  - API key stored securely in environment secrets as `AUTOTRADER_API_KEY`