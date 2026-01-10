# Next.js Frontend Implementation Plan - Uruti Lending Platform

## Overview

This document provides a comprehensive plan for building a Next.js frontend that replicates the user journey and functionality of the current Frappe-based frontend, while leveraging modern React patterns and the existing NestJS backend API.

---

## 1. Technology Stack

### Core Framework
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**

### UI Framework & Styling
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** or **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **Zod** - Schema validation (syncs with backend DTOs)

### State Management
- **TanStack Query (React Query)** - Server state management
- **Zustand** or **Jotai** - Client state management
- **React Context** - Auth & user context

### API Integration
- **Axios** or **Fetch** - HTTP client
- **SWR** (optional) - Data fetching with caching

### Additional Libraries
- **date-fns** - Date manipulation
- **react-table** or **TanStack Table** - Data tables
- **recharts** or **Chart.js** - Charts and graphs
- **react-hot-toast** - Toast notifications
- **framer-motion** - Animations

---

## 2. Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected routes
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── page.tsx              # Dashboard home
│   │   ├── loans/
│   │   │   ├── page.tsx          # Loan list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Loan detail
│   │   │   │   └── edit/
│   │   │   └── new/
│   │   ├── loan-applications/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   └── new/
│   │   ├── disbursements/
│   │   ├── repayments/
│   │   ├── securities/
│   │   ├── reports/
│   │   └── settings/
│   └── api/                      # API routes (if needed)
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   │   ├── LoanApplicationForm.tsx
│   │   ├── LoanForm.tsx
│   │   ├── RepaymentForm.tsx
│   │   └── SecurityAssignmentForm.tsx
│   ├── tables/                   # Table components
│   ├── charts/                   # Chart components
│   ├── layout/                   # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── DashboardLayout.tsx
│   └── features/                 # Feature-specific components
│       ├── loans/
│       ├── applications/
│       └── securities/
├── lib/
│   ├── api/                      # API client
│   │   ├── client.ts
│   │   ├── loans.ts
│   │   ├── applications.ts
│   │   └── auth.ts
│   ├── hooks/                    # Custom hooks
│   │   ├── useLoan.ts
│   │   ├── useLoanApplication.ts
│   │   └── useWorkflow.ts
│   ├── utils/                    # Utilities
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── calculations.ts
│   └── types/                    # TypeScript types
│       ├── loan.ts
│       ├── application.ts
│       └── api.ts
├── store/                        # State management
│   ├── authStore.ts
│   └── uiStore.ts
├── contexts/                     # React contexts
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
└── public/                       # Static assets
```

---

## 3. Route Mapping

### 3.1 Authentication Routes
```
/login          → Login page
/register      → Registration page
```

### 3.2 Dashboard Routes
```
/                    → Dashboard home
/loans                → Loan list
/loans/new            → Create loan
/loans/[id]           → Loan detail view
/loans/[id]/edit      → Edit loan
/loans/[id]/disburse  → Create disbursement
/loans/[id]/repay     → Create repayment
/loans/[id]/close     → Request closure

/loan-applications           → Application list
/loan-applications/new       → Create application
/loan-applications/[id]      → Application detail
/loan-applications/[id]/approve → Approval workflow

/disbursements       → Disbursement list
/disbursements/[id]  → Disbursement detail

/repayments          → Repayment list
/repayments/[id]     → Repayment detail

/securities                    → Security list
/securities/assignments        → Assignment list
/securities/assignments/[id]   → Assignment detail

/reports              → Reports dashboard
/reports/portfolio    → Portfolio report
/reports/npa          → NPA report
/reports/collection   → Collection report

/settings             → Settings
```

---

## 4. Component Architecture

### 4.1 Form Components

#### LoanApplicationForm
```typescript
// components/forms/LoanApplicationForm.tsx
interface LoanApplicationFormProps {
  initialData?: LoanApplication;
  onSubmit: (data: CreateLoanApplicationDto) => Promise<void>;
  mode: 'create' | 'edit';
}

// Features:
// - Dynamic field visibility (term loan, secured loan)
// - Duplicate customer detection
// - Real-time security value calculation
// - Workflow action buttons
// - Document upload
```

#### LoanForm
```typescript
// components/forms/LoanForm.tsx
interface LoanFormProps {
  loanId?: string;
  applicationId?: string; // Pre-fill from application
  mode: 'create' | 'edit' | 'view';
}

// Features:
// - Pre-fill from application
// - Status-based action buttons
// - Dashboard stats display
// - Related documents links
```

#### RepaymentForm
```typescript
// components/forms/RepaymentForm.tsx
interface RepaymentFormProps {
  loanId: string;
  initialData?: LoanRepayment;
}

// Features:
// - Auto-calculate amounts on value date change
// - Repayment type selection
// - Payment allocation display
// - Charges breakdown
```

### 4.2 Table Components

#### LoanListTable
```typescript
// components/tables/LoanListTable.tsx
// Features:
// - Sortable columns
// - Filterable by status, date range
// - Quick actions (view, edit, disburse)
// - Pagination
// - Export to CSV
```

### 4.3 Layout Components

#### DashboardLayout
```typescript
// components/layout/DashboardLayout.tsx
// Features:
// - Sidebar navigation
// - Header with user menu
// - Breadcrumbs
// - Notification center
// - Quick shortcuts
```

---

## 5. State Management Strategy

### 5.1 Server State (TanStack Query)
```typescript
// lib/hooks/useLoan.ts
export function useLoan(id: string) {
  return useQuery({
    queryKey: ['loan', id],
    queryFn: () => api.loans.getById(id),
  });
}

export function useLoans(filters?: LoanFilters) {
  return useQuery({
    queryKey: ['loans', filters],
    queryFn: () => api.loans.getAll(filters),
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateLoanDto) => api.loans.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
}
```

### 5.2 Client State (Zustand)
```typescript
// store/uiStore.ts
interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedLoanId: string | null;
  setSelectedLoan: (id: string | null) => void;
}

// store/authStore.ts
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### 5.3 Form State (React Hook Form)
```typescript
// components/forms/LoanApplicationForm.tsx
const form = useForm<CreateLoanApplicationDto>({
  resolver: zodResolver(loanApplicationSchema),
  defaultValues: {
    applicantType: 'Customer',
    isTermLoan: false,
    isSecuredLoan: false,
  },
});

// Watch for dynamic field changes
const isTermLoan = form.watch('isTermLoan');
const isSecuredLoan = form.watch('isSecuredLoan');
```

---

## 6. API Integration

### 6.1 API Client Setup
```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 6.2 API Service Functions
```typescript
// lib/api/loans.ts
export const loansApi = {
  getAll: (filters?: LoanFilters) => 
    apiClient.get<Loan[]>('/loans', { params: filters }),
  
  getById: (id: string) => 
    apiClient.get<Loan>(`/loans/${id}`),
  
  create: (data: CreateLoanDto) => 
    apiClient.post<Loan>('/loans', data),
  
  update: (id: string, data: UpdateLoanDto) => 
    apiClient.patch<Loan>(`/loans/${id}`, data),
  
  submit: (id: string) => 
    apiClient.post(`/loans/${id}/submit`),
  
  disburse: (id: string, data: CreateDisbursementDto) => 
    apiClient.post(`/loans/${id}/disburse`, data),
  
  createRepayment: (id: string, data: CreateRepaymentDto) => 
    apiClient.post(`/loans/${id}/repayments`, data),
  
  requestClosure: (id: string) => 
    apiClient.post(`/loans/${id}/request-closure`),
};
```

---

## 7. Key Features Implementation

### 7.1 Dynamic Form Fields

```typescript
// components/forms/LoanApplicationForm.tsx
const LoanApplicationForm = () => {
  const form = useForm<CreateLoanApplicationDto>();
  const isTermLoan = form.watch('isTermLoan');
  const isSecuredLoan = form.watch('isSecuredLoan');
  const repaymentMethod = form.watch('repaymentMethod');

  return (
    <Form {...form}>
      {/* Conditional fields */}
      {isTermLoan && (
        <FormField
          control={form.control}
          name="repaymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repayment Method</FormLabel>
              <Select onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Repay Fixed Amount per Period">
                    Fixed Amount
                  </SelectItem>
                  <SelectItem value="Repay Over Number of Periods">
                    Number of Periods
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      )}

      {isTermLoan && repaymentMethod === 'Repay Fixed Amount per Period' && (
        <FormField
          control={form.control}
          name="repaymentAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repayment Amount</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {isSecuredLoan && (
        <ProposedPledgesTable
          onCalculate={handleSecurityCalculation}
        />
      )}
    </Form>
  );
};
```

### 7.2 Real-Time Calculations

```typescript
// components/forms/RepaymentForm.tsx
const RepaymentForm = ({ loanId }: RepaymentFormProps) => {
  const form = useForm<CreateRepaymentDto>();
  const valueDate = form.watch('valueDate');
  const repaymentType = form.watch('repaymentType');

  // Auto-calculate on value date change
  useEffect(() => {
    if (valueDate && loanId) {
      calculateRepaymentAmounts(loanId, valueDate, repaymentType);
    }
  }, [valueDate, repaymentType, loanId]);

  const calculateRepaymentAmounts = async (
    loanId: string,
    valueDate: string,
    repaymentType: string
  ) => {
    const response = await api.loans.calculateRepaymentAmounts({
      loanId,
      valueDate,
      repaymentType,
    });
    
    form.setValue('principalPaid', response.data.payablePrincipalAmount);
    form.setValue('interestPaid', response.data.interestAmount);
    form.setValue('penaltyPaid', response.data.penaltyAmount);
    form.setValue('amountPaid', response.data.payableAmount);
  };
};
```

### 7.3 Duplicate Customer Detection

```typescript
// components/forms/LoanApplicationForm.tsx
const checkDuplicateCustomer = async (
  phoneNumber?: string,
  email?: string
) => {
  if (!phoneNumber && !email) return;

  const duplicates = await api.customers.checkDuplicate({
    phoneNumber,
    email,
  });

  if (duplicates.length > 0) {
    const useExisting = await showConfirmDialog({
      title: 'Duplicate Customer Found',
      message: 'A customer with the same contact details exists. Use existing?',
    });

    if (useExisting) {
      const customer = duplicates[0];
      form.setValue('applicant', customer.id);
      form.setValue('applicantPhoneNumber', customer.mobileNo);
      form.setValue('applicantEmailAddress', customer.emailId);
      // Auto-fill address if available
    }
  }
};

// Trigger on field change
useEffect(() => {
  const phone = form.watch('applicantPhoneNumber');
  const email = form.watch('applicantEmailAddress');
  
  const timeoutId = setTimeout(() => {
    checkDuplicateCustomer(phone, email);
  }, 500); // Debounce

  return () => clearTimeout(timeoutId);
}, [form.watch('applicantPhoneNumber'), form.watch('applicantEmailAddress')]);
```

### 7.4 Workflow Integration

```typescript
// lib/hooks/useWorkflow.ts
export function useWorkflowActions(
  documentType: string,
  documentId: string,
  currentState: string
) {
  return useQuery({
    queryKey: ['workflow-actions', documentType, documentId],
    queryFn: () => 
      api.workflow.getAvailableActions(documentType, currentState),
  });
}

export function usePerformWorkflowAction() {
  return useMutation({
    mutationFn: (data: PerformWorkflowActionDto) =>
      api.workflow.performAction(data),
  });
}

// components/features/WorkflowActions.tsx
const WorkflowActions = ({ 
  documentType, 
  documentId, 
  currentState 
}) => {
  const { data: actions } = useWorkflowActions(
    documentType,
    documentId,
    currentState
  );
  const performAction = usePerformWorkflowAction();

  return (
    <div className="flex gap-2">
      {actions?.map((action) => (
        <Button
          key={action.id}
          onClick={() => performAction.mutate({
            documentType,
            documentId,
            action: action.name,
          })}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};
```

### 7.5 Status-Based Action Buttons

```typescript
// components/features/LoanActions.tsx
const LoanActions = ({ loan }: { loan: Loan }) => {
  const router = useRouter();
  const createDisbursement = useCreateDisbursement();
  const createRepayment = useCreateRepayment();
  const requestClosure = useRequestLoanClosure();

  const canDisburse = ['Sanctioned', 'Partially Disbursed', 'Active'].includes(
    loan.status
  );
  const canRepay = ['Disbursed', 'Partially Disbursed'].includes(loan.status);
  const canClose = ['Disbursed', 'Partially Disbursed'].includes(loan.status);

  return (
    <div className="flex gap-2">
      {canDisburse && (
        <Button onClick={() => router.push(`/loans/${loan.id}/disburse`)}>
          Create Disbursement
        </Button>
      )}
      {canRepay && (
        <Button onClick={() => router.push(`/loans/${loan.id}/repay`)}>
          Create Repayment
        </Button>
      )}
      {canClose && (
        <Button onClick={() => requestClosure.mutate(loan.id)}>
          Request Closure
        </Button>
      )}
      {loan.status === 'Loan Closure Requested' && loan.isSecuredLoan && (
        <Button onClick={() => router.push(`/securities/release/${loan.id}`)}>
          Release Security
        </Button>
      )}
    </div>
  );
};
```

---

## 8. Dashboard Implementation

### 8.1 Dashboard Home Page
```typescript
// app/(dashboard)/page.tsx
export default function DashboardPage() {
  const { data: stats } = useDashboardStats();
  const { data: recentLoans } = useRecentLoans();
  const { data: pendingApplications } = usePendingApplications();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Loans"
          value={stats?.totalLoans}
          trend={stats?.loansTrend}
        />
        <StatCard
          title="Active Loans"
          value={stats?.activeLoans}
        />
        <StatCard
          title="Pending Applications"
          value={stats?.pendingApplications}
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(stats?.totalDisbursed)}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LoanDisbursementChart />
        <LoanStatusChart />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <RecentActivityTable />
    </div>
  );
}
```

### 8.2 Quick Shortcuts
```typescript
// components/features/QuickActions.tsx
const QuickActions = () => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <ActionCard
        icon={<FileText />}
        title="New Application"
        onClick={() => router.push('/loan-applications/new')}
      />
      <ActionCard
        icon={<DollarSign />}
        title="New Loan"
        onClick={() => router.push('/loans/new')}
      />
      <ActionCard
        icon={<TrendingUp />}
        title="Reports"
        onClick={() => router.push('/reports')}
      />
      <ActionCard
        icon={<Settings />}
        title="Settings"
        onClick={() => router.push('/settings')}
      />
    </div>
  );
};
```

---

## 9. Form Validation

### 9.1 Schema Definition (Zod)
```typescript
// lib/types/schemas.ts
import { z } from 'zod';

export const loanApplicationSchema = z.object({
  applicantType: z.enum(['Customer', 'Employee']),
  applicant: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  postingDate: z.string(),
  loanProductId: z.string().min(1, 'Loan product is required'),
  loanAmount: z.number().positive('Loan amount must be positive'),
  isTermLoan: z.boolean(),
  isSecuredLoan: z.boolean(),
  rateOfInterest: z.number().min(0).max(100),
  
  // Conditional fields
  repaymentMethod: z.string().optional(),
  repaymentAmount: z.number().optional(),
  repaymentPeriods: z.number().optional(),
  
  // Proposed pledges for secured loans
  proposedPledges: z.array(z.object({
    loanSecurityId: z.string(),
    qty: z.number().positive(),
    loanSecurityPrice: z.number().positive(),
  })).optional(),
}).refine((data) => {
  // If term loan, repayment method is required
  if (data.isTermLoan && !data.repaymentMethod) {
    return false;
  }
  return true;
}, {
  message: 'Repayment method is required for term loans',
  path: ['repaymentMethod'],
});
```

---

## 10. Error Handling & User Feedback

### 10.1 Toast Notifications
```typescript
// lib/utils/toast.ts
import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

// Usage in mutations
const createLoan = useCreateLoan({
  onSuccess: () => {
    showSuccess('Loan created successfully');
    router.push(`/loans/${data.id}`);
  },
  onError: (error) => {
    showError(error.message || 'Failed to create loan');
  },
});
```

### 10.2 Error Boundaries
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  // Handle React errors gracefully
}

// app/error.tsx (Next.js error page)
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## 11. Authentication & Authorization

### 11.1 Auth Context
```typescript
// contexts/AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify and fetch user
      verifyToken(token);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    localStorage.setItem('auth_token', response.token);
    setUser(response.user);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 11.2 Protected Routes
```typescript
// middleware.ts (Next.js middleware)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

---

## 12. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Next.js, TypeScript, Tailwind)
- [ ] Authentication flow
- [ ] Layout components (Sidebar, Header)
- [ ] API client setup
- [ ] Basic routing

### Phase 2: Core Features (Week 3-4)
- [ ] Loan Application form
- [ ] Loan list and detail pages
- [ ] Basic CRUD operations
- [ ] Form validation

### Phase 3: Advanced Features (Week 5-6)
- [ ] Dynamic form fields
- [ ] Real-time calculations
- [ ] Workflow integration
- [ ] Status-based actions

### Phase 4: Transaction Management (Week 7-8)
- [ ] Disbursement forms
- [ ] Repayment forms
- [ ] Security assignment
- [ ] Loan closure flow

### Phase 5: Reporting & Analytics (Week 9-10)
- [ ] Dashboard with charts
- [ ] Report pages
- [ ] Data export
- [ ] Filters and search

### Phase 6: Polish & Optimization (Week 11-12)
- [ ] Performance optimization
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Testing

---

## 13. Key Differences from Frappe Frontend

### Advantages of Next.js Approach:
1. **Modern React Patterns**: Hooks, context, server components
2. **Better Performance**: SSR, SSG, optimized bundles
3. **Type Safety**: Full TypeScript integration
4. **Better Developer Experience**: Hot reload, better tooling
5. **SEO Friendly**: Server-side rendering
6. **Mobile Responsive**: Better mobile experience
7. **Component Reusability**: Better component architecture
8. **State Management**: Modern state management solutions

### Considerations:
1. **Form Complexity**: Need to handle complex dynamic forms
2. **Workflow UI**: Need to build workflow action UI
3. **Real-time Updates**: May need WebSocket for real-time updates
4. **File Uploads**: Need proper file upload handling
5. **Print/Export**: Need to implement print and export features

---

## 14. Sample Implementation

### Example: Loan Application Form Page
```typescript
// app/(dashboard)/loan-applications/new/page.tsx
'use client';

import { LoanApplicationForm } from '@/components/forms/LoanApplicationForm';
import { useCreateLoanApplication } from '@/lib/hooks/useLoanApplication';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function NewLoanApplicationPage() {
  const router = useRouter();
  const createApplication = useCreateLoanApplication();

  const handleSubmit = async (data: CreateLoanApplicationDto) => {
    try {
      const application = await createApplication.mutateAsync(data);
      toast.success('Application created successfully');
      router.push(`/loan-applications/${application.id}`);
    } catch (error) {
      toast.error('Failed to create application');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">New Loan Application</h1>
      <LoanApplicationForm
        onSubmit={handleSubmit}
        mode="create"
      />
    </div>
  );
}
```

---

## 15. Next Steps

1. **Set up Next.js project** with TypeScript
2. **Install dependencies** (UI library, form library, etc.)
3. **Configure API client** to connect to backend
4. **Build authentication flow**
5. **Create layout components**
6. **Implement first form** (Loan Application)
7. **Add dynamic field logic**
8. **Integrate with backend API**
9. **Add error handling and validation**
10. **Iterate and improve**

---

## Conclusion

Yes, we can absolutely develop a similar frontend in Next.js! The existing NestJS backend provides all the necessary APIs, and Next.js offers a modern, performant platform to build a superior user experience while maintaining the same functionality and user journey.

The key is to:
- Map Frappe forms to React forms with React Hook Form
- Use TanStack Query for server state
- Implement dynamic field logic with React state
- Build reusable components
- Leverage Next.js features (SSR, routing, etc.)

This will result in a more modern, maintainable, and performant frontend while preserving all the business logic and user workflows.

