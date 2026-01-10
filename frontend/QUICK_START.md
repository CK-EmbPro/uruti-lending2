# Quick Start Guide - Frontend

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## 📋 Prerequisites

- Node.js 18+ installed
- Backend API running on port 3000
- npm or yarn package manager

## ✅ What's Working

### Authentication
- ✅ Login/Register
- ✅ JWT token management
- ✅ Protected routes

### Loan Applications
- ✅ Create application
- ✅ View applications list
- ✅ View application details
- ✅ Approve application
- ✅ Create loan from application
- ✅ Duplicate customer detection

### Loans
- ✅ Create loan
- ✅ View loans list
- ✅ View loan details
- ✅ Submit for approval
- ✅ Request closure
- ✅ Create disbursement
- ✅ Create repayment

### Disbursements
- ✅ Create disbursement
- ✅ View disbursements list
- ✅ View disbursement details

### Repayments
- ✅ Create repayment
- ✅ Auto-calculate amounts
- ✅ View repayments list
- ✅ View repayment details

### Workflow
- ✅ Workflow actions integration
- ✅ Status-based buttons

## 🎯 Try These Flows

### Flow 1: Create Loan Application
1. Login
2. Go to "Loan Applications" → "New Application"
3. Fill in the form
4. Submit

### Flow 2: Approve and Create Loan
1. Go to an application
2. Click "Approve"
3. Click "Create Loan"
4. View the created loan

### Flow 3: Disburse Loan
1. Go to a sanctioned loan
2. Click "Create Disbursement"
3. Fill disbursement details
4. Submit

### Flow 4: Make Repayment
1. Go to a disbursed loan
2. Click "Create Repayment"
3. Select value date (amounts auto-calculate)
4. Submit

## 🐛 Troubleshooting

**Port already in use?**
- Change port: `npm run dev -- -p 3002`

**API connection failed?**
- Check backend is running
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for errors

**Build errors?**
- Run `npm install` again
- Delete `node_modules` and `.next` folder
- Run `npm install` and `npm run dev`

## 📚 Next Steps

- Add more forms (Security Assignment, etc.)
- Enhance reports with charts
- Add data export functionality
- Improve mobile responsiveness

Happy coding! 🎉

