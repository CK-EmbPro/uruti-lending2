# Frontend Architecture Documentation

## Overview
The Uruti Lending Platform frontend is built using **Next.js 14** (React framework) with **TypeScript**, **Tailwind CSS** for styling, and follows a component-based architecture with clear separation of concerns.

## Technology Stack
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: 
  - React Context API (Auth, Customer Portal)
  - Zustand (optional, for complex state)
- **Data Fetching**: 
  - TanStack React Query (v5)
  - Axios (HTTP client)
- **Form Management**: React Hook Form + Zod validation
- **UI Components**: Custom component library + Lucide React icons
- **Real-time**: Socket.io Client

## Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── login/                    # Authentication pages
│   ├── register/
│   ├── (dashboard)/              # Dashboard route group
│   │   ├── layout.tsx            # Dashboard layout (sidebar, header)
│   │   ├── dashboard/            # Dashboard page
│   │   ├── loans/                # Loan management pages
│   │   ├── loan-applications/   # Application pages
│   │   ├── accounting/           # Accounting pages
│   │   └── ...                   # 30+ feature pages
│   └── portal/                   # Customer portal
│       ├── layout.tsx            # Portal layout
│       ├── dashboard/
│       ├── loans/
│       └── ...
├── components/                   # React components
│   ├── ui/                       # Reusable UI components (Button, Input, etc.)
│   ├── features/                 # Feature-specific components (70+ files)
│   ├── forms/                     # Form components
│   ├── layout/                    # Layout components (Header, Sidebar)
│   ├── chatbot/                  # Chatbot widget
│   └── admin/                     # Admin components
├── lib/                          # Shared libraries
│   ├── api/                      # API client functions (50+ files)
│   ├── hooks/                     # Custom React hooks (30+ files)
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Utility functions
│   ├── services/                 # Service layer (offline storage, etc.)
│   └── constants/                # Constants and configuration
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx            # Authentication state
│   └── CustomerPortalContext.tsx # Portal state
├── providers/                    # Additional providers
│   └── QueryProvider.tsx          # React Query provider
├── hooks/                         # Shared hooks (pagination, sorting)
└── public/                        # Static assets
```

## Architecture Patterns

### 1. App Router Structure (Next.js 14)
- **Route Groups**: `(dashboard)` groups related routes
- **Layouts**: Nested layouts for shared UI
- **Pages**: Server/Client components as needed
- **Metadata**: SEO and page metadata

### 2. Component Organization

#### UI Components (`components/ui/`)
Reusable, style-agnostic components:
- `Button.tsx`, `Input.tsx`, `Select.tsx`
- `Table.tsx`, `Modal.tsx`, `Card.tsx`
- `Pagination.tsx`, `Tabs.tsx`, `Badge.tsx`

#### Feature Components (`components/features/`)
Business logic components:
- `LoanBookingSection.tsx`
- `PaymentAllocationModal.tsx`
- `CreditAssessmentSection.tsx`
- `AnalyticsDashboard.tsx`

#### Layout Components (`components/layout/`)
- `Header.tsx`: Top navigation
- `Sidebar.tsx`: Side navigation
- `MobileMenu.tsx`: Mobile navigation

### 3. API Layer Architecture

#### API Client (`lib/api/client.ts`)
- **Base**: Axios instance with interceptors
- **Auth**: Automatic token injection from localStorage
- **Error Handling**: 401 redirects, timeout handling
- **Base URL**: Configurable via `NEXT_PUBLIC_API_URL`

#### API Functions (`lib/api/*.ts`)
One file per domain:
- `auth.ts`: Authentication endpoints
- `loans.ts`: Loan operations
- `loan-applications.ts`: Application operations
- `accounting.ts`: Accounting operations
- `ai.ts`: AI/chatbot endpoints

**Pattern**:
```typescript
export async function getLoans(params: GetLoansParams): Promise<Loan[]> {
  const response = await apiClient.get('/loans', { params });
  return response.data;
}
```

### 4. React Query Hooks (`lib/hooks/use*.ts`)
Custom hooks wrapping React Query:
- `useLoan.ts`: Loan queries/mutations
- `useLoanApplication.ts`: Application queries/mutations
- `useAccounting.ts`: Accounting operations

**Pattern**:
```typescript
export function useLoans(params: GetLoansParams) {
  return useQuery({
    queryKey: ['loans', params],
    queryFn: () => getLoans(params),
  });
}
```

### 5. State Management

#### Context API
- **AuthContext**: User authentication state, login/logout
- **CustomerPortalContext**: Portal-specific state

#### React Query
- Server state management
- Caching, refetching, optimistic updates
- Query invalidation strategies

## Routing Structure

### Dashboard Routes (`app/(dashboard)/`)
All authenticated admin/staff routes:
- `/dashboard` - Main dashboard
- `/loans` - Loan list
- `/loans/[id]` - Loan detail
- `/loans/new` - Create loan
- `/loan-applications` - Application list
- `/accounting` - Accounting pages
- `/analytics` - Analytics dashboards
- `/collections` - Collections management
- `/risk-management` - Risk management
- `/compliance` - Compliance pages
- `/settings` - Settings

### Customer Portal Routes (`app/portal/`)
Customer-facing routes:
- `/portal/login` - Customer login
- `/portal/register` - Customer registration
- `/portal/dashboard` - Customer dashboard
- `/portal/loans` - Customer loans
- `/portal/documents` - Document management
- `/portal/settings` - Customer settings

### Public Routes
- `/` - Landing/home page
- `/login` - Admin login
- `/register` - Admin registration
- `/forgot-password` - Password reset

## Styling Architecture

### Tailwind CSS
- **Configuration**: `tailwind.config.ts`
- **Global Styles**: `app/globals.css`
- **Approach**: Utility-first CSS
- **Customization**: Theme colors, spacing, typography

### Component Styling Pattern
```tsx
<div className="bg-white rounded-lg shadow-md p-4">
  <h2 className="text-xl font-semibold mb-4">Title</h2>
</div>
```

## Form Management

### React Hook Form + Zod
- **Validation**: Zod schemas
- **Form State**: React Hook Form
- **Integration**: `@hookform/resolvers/zod`

**Pattern**:
```typescript
const schema = z.object({
  amount: z.number().min(1),
  date: z.date(),
});

const form = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

## Authentication Flow

### Auth Context (`contexts/AuthContext.tsx`)
- **Token Storage**: localStorage (`auth_token`)
- **User State**: React state + Context
- **Methods**: `login()`, `logout()`, `register()`
- **Verification**: Token verification on mount

### Protected Routes
- **Layout Guard**: Dashboard layout checks authentication
- **Redirect**: Unauthenticated users → `/login`
- **Token Refresh**: Automatic via API interceptor

## API Integration Pattern

### Request Flow
```
Component
  ↓
Custom Hook (useLoans)
  ↓
API Function (getLoans)
  ↓
API Client (axios)
  ↓
Backend API
```

### Error Handling
- **Network Errors**: Handled in API client interceptor
- **401 Unauthorized**: Auto-redirect to login
- **Validation Errors**: Displayed in forms
- **Toast Notifications**: `react-hot-toast` for user feedback

## Real-time Features

### WebSocket Integration
- **Library**: Socket.io Client
- **Hooks**: `useNotificationWebSocket.ts`, `useAnalyticsWebSocket.ts`
- **Usage**: Real-time notifications, analytics updates

## Data Fetching Strategy

### React Query Configuration
- **Provider**: `QueryProvider.tsx` wraps app
- **Default Options**: Stale time, cache time, retry logic
- **Query Keys**: Hierarchical keys for cache management

### Caching Strategy
- **Stale Time**: 5 minutes (default)
- **Cache Time**: 10 minutes (default)
- **Refetch**: On window focus, on reconnect
- **Invalidation**: After mutations

## Component Patterns

### Server vs Client Components
- **Server Components**: Default (pages, layouts)
- **Client Components**: Marked with `'use client'`
- **Usage**: Client components for interactivity, forms, state

### Page Component Pattern
```tsx
export default function LoansPage() {
  return (
    <div>
      <h1>Loans</h1>
      <LoanList />
    </div>
  );
}
```

## Build & Deployment

### Build Process
```bash
npm run build    # Production build
npm run dev      # Development server
npm run start    # Production server
```

### Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_WS_URL`: WebSocket URL

### Configuration
- **Next.js Config**: `next.config.js`
- **TypeScript**: `tsconfig.json`
- **Tailwind**: `tailwind.config.ts`
- **PostCSS**: `postcss.config.mjs`

## Best Practices

1. **Component Reusability**: Extract common UI to `components/ui/`
2. **API Separation**: One API file per domain
3. **Type Safety**: TypeScript types for all API responses
4. **Error Boundaries**: `ErrorBoundary.tsx` for error handling
5. **Loading States**: Skeleton components for loading
6. **Form Validation**: Zod schemas for type-safe validation
7. **Code Splitting**: Next.js automatic code splitting
8. **SEO**: Metadata API for pages

