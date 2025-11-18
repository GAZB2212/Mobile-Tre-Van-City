# Mobile Tyre Van Conversion Website

## Overview

A modern, conversion-focused website for a company specializing in mobile tyre van conversions. The platform allows customers to browse van stock, configure custom builds through an interactive multi-step process, and request quotes. The primary goals are lead generation, an excellent user experience, and business conversion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **Styling**: TailwindCSS with shadcn/ui
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation
- **UI/UX**: Atomic Design, Responsive (mobile-first) with industrial/automotive styling, interactive multi-step configurator with real-time pricing, optimized images.
- **Interactive Tutorial**: `react-joyride` for onboarding users through the configurator, persisting progress in localStorage.

### Backend
- **Runtime**: Node.js with Express in TypeScript
- **API Design**: RESTful
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **Session Management**: Express sessions with PostgreSQL store

### Core Features
- **Van Management**: CRUD for vehicle inventory.
- **Equipment Configuration**: Modular kits and upgrades with compatibility validation based on van size (LWB/MWB/SWB) or wrap selection.
- **Lead Capture**: Quote and lead tracking system.
- **User Management**: Role-based admin authentication with three access levels:
    - **None**: Regular users (no admin access, redirected to home page).
    - **Basic Admin**: Customer-facing data access (quotes and leads). Can fully edit quotes (status, discounts, notes, configurations), view leads, and access build sheets.
    - **Full Admin**: Complete system access including basic admin permissions plus user management, inventory (vans/kits/upgrades), analytics, finance plans, training options, gallery items, and privileged quote actions (send confirmation emails, delete quotes).
- **Conversion Funnel**: Guides users through Van → Kit → Finance → Quote.
- **Finance Plans**: Hire Purchase, Lease options with APR calculations.
- **Pricing Engine**: Dynamic calculation with VAT handling.
- **Build Sheet System**: Internal documentation for technicians, excluding pricing, including full specs, equipment, quantities, and build instructions.
- **Staff-Driven Quote Workflow**:
    - All admins (basic and full) can review and modify customer quotes, applying discounts (percentage or fixed).
    - Real-time pricing updates and finance calculations for staff.
    - All admins can edit quote configurations (van, kit, equipment, quantities) with an equipment editor organized by category and admin-defined sort order.
    - Server-side pricing security ensures all calculations (including discounts and VAT) are handled on the backend.
    - Only full admins can generate secure, one-time confirmation links and send emails to customers.
    - Only full admins can delete quotes.
    - Quote statuses: pending, deposit_taken, in_build, completed (changeable by all admins).
- **Equipment Ordering**: Admin interface to control display order of upgrades and variants within the configurator using a `sortOrder` field.
- **Portfolio Gallery**: Database-driven system for showcasing builds with image/video support, categorization, and admin-controlled publishing and sorting.

## External Dependencies

### Database & Hosting
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle Kit**: Database migrations.

### UI & Styling
- **Radix UI**: Accessible component primitives.
- **Lucide React**: Icon system.
- **TailwindCSS**: Utility-first CSS framework.
- **Google Fonts**: Inter font family.

### Development Tools
- **TypeScript**: Static type checking.
- **ESBuild**: Fast JavaScript bundling.
- **PostCSS**: CSS processing.

### Media Assets
- **Media Serving**: Backend proxy (`/media/:filename`, `/objects/:objectPath`) for static assets and uploaded content from Google Cloud Storage, supporting video streaming (HTTP range requests) and various image/video formats. Includes ACL checks for uploaded objects.
- **Object Storage**: Google Cloud Storage for image/video uploads with presigned URLs and ACL management.
- **Image Gallery System**: Interactive modal gallery for upgrade images with carousel navigation.
- **Video Optimization**: `preload="metadata"` for faster video loading.

### Business Features
- **Finance Integration**: Placeholder for FCA-compliant finance options.
- **Email System**: SendGrid for automated, dynamic HTML quote confirmation emails with secure, one-time confirmation links.
- **SEO Optimization**: Dynamic meta tags, Open Graph, JSON-LD structured data, canonical URLs, sitemap.xml, robots.txt.
- **Training Programme**: Information on REACT (motorway operations) and Tyre Fitting certifications included with van purchases.

### Vehicle Data Integration
- **CheckCarDetails API**: Integrates with UK registration lookup for automated vehicle data population (make, model, year, mileage, specs) during van creation.

## Technical Implementation Notes

### State Management & React 18 Production Optimization
- **Atomic State Updates**: The configurator uses a custom `replaceUpgrades` method in `ConfiguratorContext` to handle mutually exclusive upgrade selections (PTO vs Compressor) atomically. This prevents race conditions caused by React 18's aggressive state batching in production mode.
- **Issue Fixed (November 2025)**: Production deployments were experiencing issues where mutually exclusive upgrades could both be selected simultaneously. The root cause was multiple `removeUpgrade` calls followed by `addUpgrade` being batched unpredictably. Fixed by implementing single atomic state updates via `replaceUpgrades(toRemove[], toAdd)`.

### Database Seeding
- Run `tsx server/seed-upgrades.ts` to manually reseed upgrade data after modifying `server/seed-upgrades.ts`
- Parent items for variant groups MUST have `published: true` for child variants to display correctly in configurator dropdowns

### Mutual Exclusivity Rules
- **Air Systems**: PTO Air System (`mounted-pto-air-system`) and Electric Start Compressor (`compressor-12hp-270l`) cannot be selected together
- **Branding**: Full Wrap, Half Wrap, and Graphic Pack options are mutually exclusive
- Implementation: Frontend enforces rules via `handleUpgradeToggle` and `handleVariantSelect` with atomic state updates