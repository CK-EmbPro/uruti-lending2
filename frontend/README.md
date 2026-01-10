# Uruti Lending Platform - Frontend

Next.js frontend for the Uruti Lending Platform, built with modern React patterns and TypeScript.

## Tech Stack

- **Next.js 14+** (App Router)
- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **TanStack Query** for server state management
- **React Hook Form** + **Zod** for forms and validation
- **Axios** for API calls

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── login/             # Authentication pages
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/                    # Utilities and helpers
│   ├── api/               # API client functions
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── contexts/               # React contexts
└── providers/              # Context providers
```

## Features

- ✅ Authentication flow
- ✅ Dashboard with stats
- ✅ Loan Application form with dynamic fields
- ✅ Loan list and detail views
- ✅ Real-time form validation
- ✅ Duplicate customer detection
- ✅ Responsive design

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## API Integration

The frontend connects to the NestJS backend API. Make sure the backend is running on `http://localhost:3000` (or update `NEXT_PUBLIC_API_URL`).

All API calls are handled through:
- `lib/api/` - API client functions
- `lib/hooks/` - React Query hooks for data fetching

## Authentication

Authentication is handled through:
- `contexts/AuthContext.tsx` - Auth state management
- JWT tokens stored in localStorage
- Protected routes via dashboard layout

## Next Steps

- [ ] Complete Loan Application detail page
- [ ] Implement Loan form
- [ ] Add Disbursement and Repayment forms
- [ ] Add Security Assignment forms
- [ ] Implement Workflow actions
- [ ] Add Reports pages
- [ ] Add Charts and analytics

## License

MIT

