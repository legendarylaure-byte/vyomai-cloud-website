# VyomAi Pvt Ltd - AI Solutions Platform

## Overview

VyomAi Pvt Ltd is a Nepal-based AI technology startup providing intelligent business solutions including AI agent templates, custom chatbots, and platform integrations. The application is a single-page web platform with an admin dashboard, visitor analytics, content management, and payment integration capabilities. Built with React and Express, it features a modern tech aesthetic blended with traditional Nepali design elements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Core Technology:**
- React 18 with TypeScript for type-safe component development
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Tailwind CSS with custom design system featuring Nepali-inspired saffron accents
- Radix UI primitives via shadcn/ui component library
- Framer Motion for animations and interactive elements

**Design Philosophy:**
- Hybrid cultural-tech fusion combining futuristic AI aesthetics with traditional Nepali mandala patterns
- Custom typography stack: Inter (body), Space Grotesk (headings), Poppins (Devanagari compatibility)
- Dual theme support (light/dark) with purple/blue tech colors and saffron accents
- Mobile-first responsive design with smooth scroll navigation

**Key Features:**
- AI-powered chatbot using OpenAI API for user interaction
- Real-time visitor counter and analytics dashboard
- Admin authentication with token-based sessions
- Content management for articles, team members, pricing packages
- Contact forms with email notifications
- Booking request system
- Social media integration management

### Backend Architecture

**Core Technology:**
- Node.js with Express.js framework
- TypeScript for type safety
- Token-based authentication using crypto.randomBytes for secure token generation
- bcryptjs for password hashing (10 rounds)
- Rate limiting on login endpoint (5 attempts per 15 minutes)

**Security Measures:**
- Helmet.js for comprehensive HTTP security headers
- Content Security Policy configured for API access to OpenAI, Fonepay, SendGrid
- Two-factor authentication (TOTP) using speakeasy library with QR code generation
- Environment-based admin credentials (no hardcoded secrets)
- 24-hour token expiration

**Storage Strategy:**
- Dual storage implementation: PostgreSQL (via Neon/Drizzle ORM) or in-memory fallback
- Storage abstraction layer allows seamless switching between database and memory storage
- Database schema defined in shared/schema.ts using Drizzle ORM
- Graceful degradation when DATABASE_URL is not configured

**API Architecture:**
- RESTful API design with JSON responses
- Zod validation schemas for all POST/PUT endpoints
- Query parameters for filtering and pagination
- Centralized error handling with proper HTTP status codes

### Data Storage Solutions

**Primary Database (Optional):**
- PostgreSQL via Neon serverless platform (recommended for production)
- Drizzle ORM for type-safe database queries
- Connection pooling via @neondatabase/serverless
- WebSocket constructor override for serverless compatibility

**Fallback Storage:**
- In-memory storage implementation for development/testing
- Maintains same interface as database storage for consistency
- Automatically used when DATABASE_URL environment variable is not set

**Data Models:**
- Users (admin authentication, 2FA support)
- Articles (media content with type: article/video/demo)
- Team Members (staff profiles with avatars)
- Pricing Packages (subscription tiers with multi-currency support)
- Booking Requests (consultation scheduling)
- Customer Inquiries (contact form submissions)
- Site Settings (global configuration)
- Visitor Statistics (analytics data with hourly breakdown)
- Social Media Integrations (platform connection status)
- Project Discussions (custom project requests)

### Authentication and Authorization

**Admin Authentication:**
- Token-based system with secure random token generation
- Credentials stored in environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)
- Password hashing using bcryptjs with 10 salt rounds
- Bearer token middleware on all protected endpoints
- Rate limiting to prevent brute force attacks

**Two-Factor Authentication:**
- TOTP implementation using speakeasy library
- QR code generation for authenticator apps
- Base32-encoded secrets stored in user schema
- ±2 time window verification for clock skew tolerance
- Setup and enable endpoints protected by bearer token

**Password Reset Flow:**
- Email-based verification with 6-digit codes
- Code expiration and validation
- Secure password update with confirmation matching

### External Dependencies

**Email Services:**
- Gmail API integration via Google OAuth2 (primary)
- SendGrid support for transactional emails (alternative)
- Nodemailer SMTP fallback for Hostinger email (info@vyomai.cloud)
- Email templates for contact forms, bookings, password resets

**AI Integration:**
- OpenAI API for chatbot functionality
- GPT model for natural language processing
- Context-aware responses about VyomAi services
- Graceful degradation when API key not configured

**Payment Gateway:**
- Fonepay integration for Nepal-based payments
- Payment initiation and verification endpoints
- Merchant code and secret key configuration
- Transaction tracking and confirmation emails

**Third-Party APIs:**
- Exchange rate API (exchangerate-api.com) for multi-currency pricing
- 24-hour caching for rate data
- Fallback rates for NPR calculation (INR × 1.6)

**Social Media Platforms:**
- LinkedIn, Instagram, Facebook, YouTube integration status tracking
- WhatsApp and Viber contact links
- Connection verification system
- Platform-specific analytics placeholders

**Cloud Platform Integrations:**
- Google Workspace (Gmail, Calendar, Drive) integration capabilities
- Microsoft 365 (Outlook, Teams, SharePoint) integration capabilities
- OAuth2 authentication flow support for platform connections

**Development Tools:**
- Vite for frontend build and development
- esbuild for server bundling
- Drizzle Kit for database migrations
- Docker support for containerized deployment

**Hosting & Deployment:**
- Hostinger VPS with Docker support
- SSL/TLS via Let's Encrypt or Hostinger certificates
- Nginx reverse proxy for HTTPS termination
- Environment variable configuration via .env files