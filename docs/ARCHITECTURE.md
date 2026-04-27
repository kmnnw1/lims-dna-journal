# Lab Journal Project Architecture

## Overview
This is a Next.js 16 application for managing laboratory specimens and PCR testing data, built with TypeScript, Prisma, and modern React patterns.

## Project Structure

### `/app` - Next.js App Router
- **Purpose**: Contains all page routes and API endpoints
- **Structure**:
  - `page.tsx` - Home page
  - `admin/page.tsx` - Admin dashboard
  - `login/page.tsx` - Authentication page
  - `api/` - API routes organized by feature (auth, specimens, users, etc.)

### `/components` - React Components
- **Purpose**: Reusable UI components
- **Structure**:
  - `features/` - Feature-specific components (modals, tables, etc.)
  - `ui/` - Reusable UI primitives (buttons, cards, inputs)
  - Standalone components (AnimatedFlask, etc.)

### `/hooks` - Custom React Hooks
- **Purpose**: Shared logic and state management
- **Contents**: All custom hooks consolidated here (useDebounce, usePullToRefresh, etc.)

### `/lib` - Business Logic & Utilities
- **Purpose**: Core application logic, database interactions, and utilities
- **Structure**:
  - `api/` - API client and related utilities
  - `database/` - Prisma client and audit logging
  - `auth/` - Authentication utilities
  - `utilities/` - General utilities (cache, export, favorites, etc.)
  - `excel/` - Excel import/export functionality
  - `import-excel/` - Excel import logic
  - `__tests__/` - Unit tests for lib functions

### `/types` - TypeScript Type Definitions
- **Purpose**: Shared type definitions across the application

### `/prisma` - Database Schema & Migrations
- **Purpose**: Database schema definition and migration files

### `/public` - Static Assets
- **Purpose**: Static files served by Next.js (images, manifest, service worker)

### `/scripts` - Build & Utility Scripts
- **Purpose**: Development and deployment scripts

### `/tests` - Test Suites
- **Purpose**: All test files organized by type
- **Structure**:
  - `unit/` - Unit tests (component tests)
  - `integration/` - Integration tests
  - `e2e/` - End-to-end tests (Playwright)

### `/docs` - Documentation & Development Files
- **Purpose**: Project documentation and development resources
- **Structure**:
  - `local-dev/` - Local development scripts and tools

### `/build` - Generated Artifacts
- **Purpose**: Directory for build outputs and generated files (ignored by git)

### `/data` - Data Storage
- **Purpose**: Excel data files for import/export and persistent storage (ignored by git, except for .gitkeep)
- **Contents**: `data.xlsx` (not tracked)

## Coding Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `SpecimenTable.tsx`)
- Hooks: `camelCase.ts` (e.g., `useDebounce.ts`)
- Utilities: `kebab-case.ts` (e.g., `api-client.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

### Import Organization
- React imports first
- Third-party libraries second
- Local imports last, grouped by:
  - Components
  - Hooks
  - Utilities
  - Types

### Component Structure
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components focused on single responsibility

## Database Schema

See [DATABASE.md](./DATABASE.md) for detailed schema documentation.

## API Endpoints

See [API.md](./API.md) for API documentation.

## Development Setup

See [SETUP.md](./SETUP.md) for setup instructions.