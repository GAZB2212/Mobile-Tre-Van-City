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
- **Equipment Configuration**: Kits and upgrades system for modular tyre equipment packages
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

### Business Features
- **Finance Integration**: Placeholder for FCA-compliant finance options and calculations
- **Email System**: Infrastructure ready for quote delivery and lead notifications
- **SEO Optimization**: Meta tags, structured data, and semantic HTML for search visibility