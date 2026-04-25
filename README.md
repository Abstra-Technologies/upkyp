# Upkyp Monorepo

A rental property management platform built with a monorepo architecture using Turborepo, pnpm workspaces, Next.js, and NestJS.

## Structure

```
upkyp/
├── packages/
│   └── common/          # @upkyp/common - Shared types, utilities, hooks, components, configs
├── apps/
│   ├── api/             # @upkyp/api - NestJS backend API
│   ├── landlord/        # @upkyp/landlord - Landlord dashboard (Next.js)
│   ├── tenant/          # @upkyp/tenant - Tenant portal (Next.js)
│   ├── admin/           # @upkyp/admin - Admin panel (Next.js)
│   └── chat-server/     # @upkyp/chat-server - Socket.IO real-time chat server
```

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Zustand, SWR
- **Backend**: NestJS 10, MySQL (mysql2), JWT auth
- **Real-time**: Socket.IO
- **Payments**: Xendit
- **Email**: Resend
- **Storage**: AWS S3, Cloudinary
- **Caching**: Upstash Redis
- **Push Notifications**: Firebase FCM, Web Push

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Installation

```bash
# Install pnpm globally if you haven't
npm install -g pnpm

# Install dependencies
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific apps
pnpm dev:api        # NestJS API (port 3000)
pnpm dev:landlord   # Landlord dashboard (port 3001)
pnpm dev:tenant     # Tenant portal (port 3002)
pnpm dev:admin      # Admin panel (port 3003)

# Run chat server
pnpm chat
```

### Building

```bash
# Build all apps
pnpm build

# Build specific apps
pnpm build:api
pnpm build:landlord
pnpm build:tenant
pnpm build:admin
```

### Environment Setup

Copy `.env.example` to `.env` in each app and fill in the required values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/landlord/.env.example apps/landlord/.env
cp apps/tenant/.env.example apps/tenant/.env
cp apps/admin/.env.example apps/admin/.env
```

## Architecture

### @upkyp/common

Shared package containing:
- **Types**: TypeScript interfaces for all domain entities
- **Utils**: ID generation, encryption, validation, date/format utilities
- **Hooks**: useApi, useAuth, useDebounce
- **Components**: LoadingScreen, AuthGuard
- **Config**: Constants, subscription plans
- **Lib**: Database connection, Redis, S3, Cloudinary, auth utilities
- **Zustand**: Auth store, subscription store

### @upkyp/api (NestJS)

Modular NestJS architecture:
```
src/
├── modules/
│   ├── auth/          # Authentication & authorization
│   ├── landlord/      # Landlord-specific endpoints
│   ├── tenant/        # Tenant-specific endpoints
│   ├── admin/         # Admin-specific endpoints
│   ├── property/      # Property & unit management
│   ├── lease/         # Lease agreements
│   ├── billing/       # Billing & invoices
│   ├── payment/       # Payment processing (Xendit)
│   ├── maintenance/   # Maintenance requests
│   ├── chat/          # Chat API
│   ├── notification/  # Notifications & FCM
│   ├── analytics/     # Analytics endpoints
│   ├── webhook/       # Xendit webhooks
│   └── cron/          # Scheduled tasks
└── common/
    ├── guards/        # JWT & admin auth guards
    ├── decorators/    # @Roles, @Public, @CurrentUser
    ├── interceptors/  # Response formatting
    ├── filters/       # Exception handling
    └── pipes/         # Validation pipes
```

### Frontend Apps

Each frontend app (landlord, tenant, admin) is a standalone Next.js application:
- Port 3001: Landlord dashboard
- Port 3002: Tenant portal
- Port 3003: Admin panel

All apps share:
- `@upkyp/common` for types, utilities, hooks, and components
- The same API backend at `http://localhost:3000/api`

## Migration Guide

To migrate existing code from the original monolith:

1. **Components**: Move role-specific components to the respective app's `src/components/`
2. **Pages**: Move pages from `app/landlord/` to `apps/landlord/src/app/`, etc.
3. **API Routes**: Convert Next.js API routes to NestJS controllers/services in `apps/api/src/modules/`
4. **Libraries**: Already migrated to `packages/common/src/lib/`
5. **Types**: Already migrated to `packages/common/src/types/`
6. **Hooks**: Move to `packages/common/src/hooks/` or app-specific `src/hooks/`
7. **Zustand stores**: Move to `packages/common/src/zustand/`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm type-check` | Type check all apps |
| `pnpm clean` | Clean all build artifacts |
| `pnpm chat` | Start chat server |
