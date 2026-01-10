# Customer Portal Loan Link Verification Guide

## Overview

The customer portal allows customers to link their loans to their accounts. This document explains the verification process and how admins should handle verification requests.

## Verification Methods

### 1. Automatic Verification

**Email Match (EMAIL_MATCH)**
- If customer's portal email matches the loan's `applicantId` (which should be an email)
- Status: **Automatically verified**
- No admin action required

**Email Verification (EMAIL_VERIFICATION)**
- Customer provides an email during linking that matches the loan's `applicantId`
- Status: **Automatically verified**
- No admin action required

### 2. Manual Verification (Requires Admin Review)

**Loan Number Only (LOAN_NUMBER)**
- Customer provides only loan number
- Status: **Pending verification**
- Admin must verify manually

**Additional Information Provided (PHONE, SSN)**
- Customer provides phone number or SSN last 4 digits
- Status: **Pending verification**
- Admin should cross-reference with loan application data

**Seed Data (SEED)**
- Created via seed script
- Status: **Pending verification** (unless email matches)
- Admin should verify manually

## Verification Workflow

### Step 1: Customer Initiates Link

1. Customer logs into portal
2. Clicks "Link Loan" button
3. Enters:
   - Loan Number (required)
   - Email (optional - for verification)
   - Phone Number (optional)
   - SSN Last 4 (optional)

### Step 2: System Processing

**Automatic Path:**
- If email matches → Link verified immediately
- Customer sees success message
- Loan appears in dashboard

**Manual Review Path:**
- If email doesn't match → Link created as unverified
- Customer sees "pending verification" message
- Link appears in admin pending verifications queue

### Step 3: Admin Review Process

1. **Access Pending Verifications**
   ```
   GET /api/admin/customer-portal/pending-verifications
   ```

2. **Review Link Details**
   ```
   GET /api/admin/customer-portal/links/:id
   ```
   
   Review:
   - Customer information (name, email, phone)
   - Loan information (loan number, amount, status)
   - Verification data provided (phone, SSN last 4)
   - Loan application data (if available)
   - Customer's portal account details

3. **Verification Actions**

   **Approve:**
   ```json
   POST /api/admin/customer-portal/links/:id/verify
   {
     "action": "approve",
     "comments": "Verified via phone call",
     "verificationMethod": "PHONE_VERIFICATION"
   }
   ```

   **Reject:**
   ```json
   POST /api/admin/customer-portal/links/:id/verify
   {
     "action": "reject",
     "comments": "Customer information does not match loan records"
   }
   ```

   **Request Additional Information:**
   ```json
   POST /api/admin/customer-portal/links/:id/verify
   {
     "action": "request_info",
     "comments": "Please provide government-issued ID for verification"
   }
   ```

## Verification Criteria

### High Confidence (Auto-Approve)
- ✅ Email matches loan applicantId exactly
- ✅ Phone number matches loan application
- ✅ SSN last 4 matches loan application

### Medium Confidence (Quick Review)
- ✅ Loan number correct + customer name matches
- ✅ Phone number partially matches
- ✅ Customer email domain matches company domain

### Low Confidence (Thorough Review)
- ⚠️ Only loan number provided
- ⚠️ No matching contact information
- ⚠️ Customer email doesn't match any loan records
- ⚠️ Multiple failed verification attempts

## Verification Methods Reference

| Method | Description | Use Case |
|--------|-------------|----------|
| `EMAIL_MATCH` | Customer email matches loan applicantId | Automatic |
| `EMAIL_VERIFICATION` | Provided email matches loan applicantId | Automatic |
| `PHONE_VERIFICATION` | Phone number verified via call/SMS | Manual |
| `SSN_VERIFICATION` | SSN last 4 matches records | Manual |
| `MANUAL_ADMIN_VERIFICATION` | Admin reviewed and approved | Manual |
| `DOCUMENT_VERIFICATION` | ID or document verified | Manual |
| `LOAN_NUMBER` | Only loan number provided | Pending |
| `SEED` | Created via seed script | Pending |

## Best Practices

### For Admins

1. **Review Timeline**
   - Review pending links within 24-48 hours
   - Prioritize links with more verification data
   - Flag suspicious requests for security review

2. **Verification Steps**
   - Cross-reference customer info with loan application
   - Check phone numbers and email addresses
   - Verify SSN last 4 digits (if provided)
   - Review loan status and history

3. **Documentation**
   - Always add comments explaining verification method
   - Note any discrepancies found
   - Document phone calls or other verification steps

4. **Security**
   - Never approve without verification
   - Reject suspicious requests immediately
   - Report fraud attempts to security team

### For Customers

1. **Provide Complete Information**
   - Use the same email as loan application
   - Provide phone number if available
   - Include SSN last 4 for faster verification

2. **Wait for Verification**
   - Unverified links won't show loan details
   - Check email for verification status updates
   - Contact support if verification is delayed

## API Endpoints

### Customer Endpoints
- `POST /api/customer-portal/loans/link` - Link a loan
- `GET /api/customer-portal/loans` - View linked loans (only verified)

### Admin Endpoints
- `GET /api/admin/customer-portal/pending-verifications` - List pending links
- `GET /api/admin/customer-portal/links/:id` - Get link details
- `POST /api/admin/customer-portal/links/:id/verify` - Verify/reject link

## Notification System

### Customer Notifications
- ✅ Link verified → Email/SMS notification
- ❌ Link rejected → Email with rejection reason
- ⏳ Additional info requested → Email with instructions

### Admin Notifications
- 📧 New pending verification → Email alert
- 🔔 High-priority verification → Dashboard notification

## Troubleshooting

### Customer Can't See Loan
- Check if link is verified (`isVerified: true`)
- Verify customer email matches loan applicantId
- Check if loan status allows portal access

### Verification Stuck
- Check admin notes for additional info requests
- Review verification data provided
- Contact customer for missing information

### Multiple Links for Same Loan
- System prevents duplicate verified links
- Unverified links can be created multiple times
- Admin should verify the correct one and reject others

## Security Considerations

1. **Data Privacy**
   - SSN last 4 is stored encrypted
   - Verification data is only visible to admins
   - Audit log tracks all verification actions

2. **Fraud Prevention**
   - Rate limit link requests per customer
   - Flag suspicious patterns (multiple failed attempts)
   - Require additional verification for high-value loans

3. **Access Control**
   - Only verified links show loan details
   - Unverified links are hidden from customers
   - Admin actions are logged and auditable

