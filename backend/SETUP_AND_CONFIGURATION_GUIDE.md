# Setup and Configuration Guide

**Date:** January 2024  
**Status:** ✅ **COMPLETE**

---

## 🚀 Quick Setup

This guide will help you configure all the newly installed libraries and services.

---

## 1. Environment Configuration

### Add to `.env` or `.env.local`

```env
# ============================================
# Redis Configuration (for caching and queues)
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# Email Configuration (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@urutilending.com
SMTP_SECURE=false
EMAIL_TEMPLATES_DIR=./templates/email

# ============================================
# File Upload Configuration
# ============================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
USE_S3=false

# ============================================
# AWS S3 Configuration (Optional)
# ============================================
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# ============================================
# Application Configuration
# ============================================
NODE_ENV=development
PORT=3000
```

---

## 2. Redis Setup

### Option A: Docker (Recommended)

Add to `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

Then run:
```bash
docker-compose up -d redis
```

### Option B: Local Installation

**Windows:**
```bash
# Download Redis from: https://github.com/microsoftarchive/redis/releases
# Or use WSL
```

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
brew services start redis
```

### Test Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

---

## 3. Email Setup

### Gmail Configuration

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account → Security → 2-Step Verification
   - Click "App passwords"
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

### Other SMTP Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key
SMTP_PASS=your-ses-secret-key
```

---

## 4. File Upload Setup

### Local Storage (Default)

```bash
# Create uploads directory
mkdir -p backend/uploads

# Set permissions (Linux/Mac)
chmod 755 backend/uploads
```

### AWS S3 Setup (Optional)

1. **Create S3 Bucket:**
   - Go to AWS Console → S3
   - Create bucket (e.g., `uruti-lending-documents`)
   - Set appropriate permissions

2. **Create IAM User:**
   - Go to IAM → Users
   - Create user with S3 access
   - Generate access keys

3. **Update Environment:**
```env
USE_S3=true
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=uruti-lending-documents
```

---

## 5. Email Templates Setup

Email templates are located in `backend/templates/email/`.

### Available Templates

- ✅ `payment-reminder.hbs` - Payment reminder email
- ✅ `loan-statement.hbs` - Loan statement email
- ✅ `application-status.hbs` - Application status update
- ✅ `password-reset.hbs` - Password reset email

### Creating Custom Templates

1. Create `.hbs` file in `backend/templates/email/`
2. Use Handlebars syntax: `{{variable}}`, `{{#if condition}}`, etc.
3. Reference in code: `template: 'your-template-name'`

---

## 6. Testing Services

### Test Excel Service

```typescript
// In a controller or service
const data = [
  { id: '1', name: 'Loan 1', amount: 1000 },
  { id: '2', name: 'Loan 2', amount: 2000 },
];

const excelBuffer = await excelService.generateExcel(data);
// Save or return buffer
```

### Test Email Service

```typescript
await emailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Test</h1><p>This is a test email.</p>',
});
```

### Test File Upload

```bash
# Using curl
curl -X POST http://localhost:3000/api/file-upload/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

### Test Cache Service

```typescript
// Set cache
await cacheService.set('test-key', { data: 'value' }, 300);

// Get cache
const value = await cacheService.get('test-key');
```

---

## 7. Integration Examples

### Example 1: Add Excel Export to Loan Controller

```typescript
import { ExcelService } from '../excel/excel.service';

@Controller('loans')
export class LoanController {
  constructor(
    private readonly loanService: LoanService,
    private readonly excelService: ExcelService,
  ) {}

  @Get('export')
  async exportLoans(@Res() res: Response) {
    const loans = await this.loanService.findAll();
    const buffer = await this.excelService.exportLoans(loans);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="loans.xlsx"');
    res.send(buffer);
  }
}
```

### Example 2: Add Email to Payment Reminder

```typescript
import { EmailService } from '../email/email.service';

@Injectable()
export class PaymentReminderService {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  async sendReminder(loan: Loan) {
    await this.emailService.sendPaymentReminder(
      loan.customerEmail,
      {
        loanId: loan.id,
        customerName: loan.customerName,
        amountDue: loan.amountDue,
        dueDate: loan.dueDate.toISOString(),
        paymentLink: `https://app.urutilending.com/pay/${loan.id}`,
      },
    );
  }
}
```

### Example 3: Add Caching to Loan Service

```typescript
import { CacheService } from '../cache/cache.service';

@Injectable()
export class LoanService {
  constructor(
    private readonly loanRepository: Repository<Loan>,
    private readonly cacheService: CacheService,
  ) {}

  async findOne(id: string): Promise<Loan> {
    return this.cacheService.getOrSet(
      `loan:${id}`,
      async () => await this.loanRepository.findOne({ where: { id } }),
      600, // 10 minutes
    );
  }
}
```

---

## 8. Frontend Integration

### File Upload Component

```typescript
// frontend/components/features/FileUpload.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/file-upload/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return response.data;
    },
  });

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
```

---

## 9. Troubleshooting

### Redis Connection Failed

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
- Check if Redis is running: `redis-cli ping`
- Verify `REDIS_HOST` and `REDIS_PORT` in `.env`
- Start Redis: `redis-server` or `docker-compose up redis`

### Email Not Sending

**Error:** `Invalid login` or `Authentication failed`

**Solution:**
- Verify SMTP credentials
- For Gmail, use App Password (not regular password)
- Check firewall/network settings
- Verify SMTP port (587 for TLS, 465 for SSL)

### File Upload Fails

**Error:** `File too large` or `Permission denied`

**Solution:**
- Check `MAX_FILE_SIZE` in `.env`
- Verify upload directory exists and has write permissions
- Check disk space

### Cache Not Working

**Error:** Cache always returns undefined

**Solution:**
- Verify Redis is running
- Check Redis connection settings
- Fallback to memory cache if Redis unavailable

---

## 10. Production Checklist

### Before Deploying

- [ ] Redis configured and running
- [ ] SMTP credentials configured
- [ ] File upload directory created with proper permissions
- [ ] Email templates created and tested
- [ ] AWS S3 configured (if using cloud storage)
- [ ] Environment variables set in production
- [ ] Cache TTL values optimized
- [ ] File size limits appropriate
- [ ] Email rate limiting configured
- [ ] Error handling tested

---

## 11. Performance Optimization

### Caching Strategy

```typescript
// Cache frequently accessed data
- Loan details: 10 minutes TTL
- Portfolio summaries: 5 minutes TTL
- User sessions: 30 minutes TTL
- Static data: 1 hour TTL
```

### File Upload Optimization

```typescript
// Use S3 for production
USE_S3=true

// Implement file compression
// Use CDN for file delivery
// Set appropriate file size limits
```

### Email Optimization

```typescript
// Use email queue for bulk sends
// Implement rate limiting
// Use email templates for consistency
// Monitor email delivery rates
```

---

## 12. Security Considerations

### File Upload Security

- ✅ Validate file types (MIME types)
- ✅ Validate file sizes
- ✅ Scan for viruses (consider ClamAV)
- ✅ Store files outside web root
- ✅ Use unique filenames
- ✅ Implement access controls

### Email Security

- ✅ Use TLS/SSL for SMTP
- ✅ Validate email addresses
- ✅ Implement rate limiting
- ✅ Sanitize email content
- ✅ Use SPF/DKIM for domain authentication

### Cache Security

- ✅ Use Redis password
- ✅ Restrict Redis network access
- ✅ Encrypt sensitive cached data
- ✅ Set appropriate TTL values
- ✅ Implement cache invalidation

---

## ✅ Status

**Configuration Guide Complete!**

All services are ready to use. Follow the steps above to configure and test each service.

---

**Last Updated:** January 2024

