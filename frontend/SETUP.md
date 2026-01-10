# Frontend Setup Guide

## Quick Start

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open browser:**
Navigate to [http://localhost:3001](http://localhost:3001)

## Default Credentials

You'll need to register a user first or use existing backend credentials.

## Features Implemented

✅ Authentication (Login/Register)
✅ Dashboard with stats
✅ Loan Applications (List, Create, Detail)
✅ Loans (List, Create, Detail)
✅ Dynamic forms with validation
✅ Duplicate customer detection
✅ Workflow actions integration
✅ Responsive design

## Next Steps

- [ ] Add Disbursement forms
- [ ] Add Repayment forms
- [ ] Add Security Assignment forms
- [ ] Implement Reports with charts
- [ ] Add more workflow states
- [ ] Add file upload for documents

## Troubleshooting

### API Connection Issues
- Ensure backend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors: `npm run type-check`
- Clear `.next` folder and rebuild

### Authentication Issues
- Clear localStorage and try logging in again
- Check backend auth endpoints are working
- Verify JWT token is being stored correctly

