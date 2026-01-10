# AI Document Processing Implementation

## Overview

This implementation adds AI-powered document processing to the Uruti Lending Platform, enabling automatic text extraction (OCR) and structured data extraction from loan application documents.

## Features

✅ **OCR (Optical Character Recognition)** - Extract text from images and PDFs
✅ **Structured Data Extraction** - Extract names, dates, amounts, IDs, etc.
✅ **Auto-Fill Loan Applications** - Automatically populate application fields
✅ **Multiple AI Provider Support** - OpenAI, Google Vision, AWS Textract
✅ **Validation & Confidence Scoring** - Validate extracted data quality
✅ **Frontend Integration** - React component for document processing

## Architecture

### Backend Structure

```
backend/src/modules/ai/
├── dto/
│   └── document-processing.dto.ts      # DTOs for requests/responses
├── services/
│   ├── ai-document-processor.service.ts  # Main OCR & extraction service
│   └── ai-application-filler.service.ts  # Auto-fill application service
├── ai.controller.ts                    # API endpoints
└── ai.module.ts                        # NestJS module
```

### API Endpoints

1. **POST `/ai/documents/process`** - Process document and extract data
2. **POST `/ai/documents/:documentId/process-and-fill/:applicationId`** - Process and auto-fill application

## Setup Instructions

### 1. Install Dependencies

The implementation uses `axios` for HTTP requests. Install it if not already present:

```bash
cd backend
npm install axios
```

### 2. Configure AI Provider

Choose one of the following AI providers:

#### Option A: OpenAI (Recommended for Development)

1. Get API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add to `.env` file:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
```

#### Option B: Google Vision API

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env` file:

```env
AI_PROVIDER=google
GOOGLE_VISION_API_KEY=your_google_api_key_here
```

#### Option C: AWS Textract (For Production)

1. Configure AWS credentials
2. Add to `.env` file:

```env
AI_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### 3. Environment Variables

Add these to your `.env` file:

```env
# AI Configuration
AI_PROVIDER=openai  # or 'google', 'aws', 'fallback'
OPENAI_API_KEY=sk-...
# OR
GOOGLE_VISION_API_KEY=...
# OR
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### 4. Module Registration

The `AIModule` is already registered in `app.module.ts`. No additional setup needed.

## Usage

### Backend Usage

```typescript
import { AIDocumentProcessorService } from './modules/ai/services/ai-document-processor.service';

// Process a document
const result = await aiDocumentProcessorService.processDocument({
  documentId: 'doc-123',
  documentType: DocumentType.ID_CARD,
  fileUrl: 'https://example.com/document.jpg',
  mimeType: 'image/jpeg',
});

// Access extracted data
console.log(result.extractedData.fullName);
console.log(result.extractedData.idNumber);
```

### Frontend Usage

```tsx
import { AIDocumentProcessor } from '@/components/features/AIDocumentProcessor';

<AIDocumentProcessor
  documentId="doc-123"
  applicationId="app-456"
  fileUrl="https://example.com/document.jpg"
  mimeType="image/jpeg"
  onExtracted={(data) => {
    console.log('Extracted:', data);
  }}
  onAutoFilled={(fields) => {
    console.log('Filled fields:', fields);
  }}
/>
```

## Supported Document Types

- **ID_CARD** - National ID, Driver's License, Passport
- **BANK_STATEMENT** - Bank account statements
- **PAYSLIP** - Salary/pay slips
- **TAX_RETURN** - Tax return documents
- **UTILITY_BILL** - Utility bills for address verification
- **EMPLOYMENT_LETTER** - Employment verification letters
- **OTHER** - Other document types

## Extracted Data Fields

The AI extracts the following fields based on document type:

### Common Fields
- Full Name, First Name, Last Name
- Date of Birth
- ID Number
- Address
- Phone Number
- Email

### Financial Fields (Bank Statements, Payslips)
- Account Number
- Bank Name
- Monthly Income
- Average Balance
- Employer Name
- Tax ID

### Dates
- Issue Date
- Expiry Date
- Statement Period

## Validation & Quality

The system includes:
- **Confidence Scoring** - 0-1 score indicating extraction quality
- **Validation Rules** - Checks for required fields per document type
- **Suggestions** - Flags potential issues for manual review

## Cost Considerations

### OpenAI
- GPT-4 Vision: ~$0.01-0.03 per image
- GPT-4: ~$0.03 per 1K tokens

### Google Vision
- First 1,000 units/month: Free
- Additional: $1.50 per 1,000 units

### AWS Textract
- First 1,000 pages/month: Free
- Additional: $1.50 per 1,000 pages

**Recommendation**: Start with OpenAI for development, migrate to AWS Textract for production scale.

## Future Enhancements

1. **Batch Processing** - Process multiple documents at once
2. **Custom Training** - Train models on your specific document formats
3. **Fraud Detection** - Detect document tampering/forgery
4. **Multi-language Support** - Support documents in multiple languages
5. **Real-time Processing** - WebSocket-based real-time extraction
6. **Document Classification** - Auto-detect document type
7. **Data Enrichment** - Cross-reference with external databases

## Troubleshooting

### "No AI provider configured"
- Ensure `AI_PROVIDER` is set in `.env`
- Check that API keys are correctly configured

### "Failed to extract text"
- Verify document is clear and readable
- Check file format is supported (JPEG, PNG, PDF)
- Ensure API key has sufficient credits/quota

### Low confidence scores
- Improve document image quality
- Ensure document is not rotated or skewed
- Try different AI provider

## Testing

Test the implementation:

```bash
# Start the backend
npm run start:dev

# Test endpoint (using curl or Postman)
curl -X POST http://localhost:3000/api/ai/documents/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "documentId": "test-123",
    "documentType": "ID_CARD",
    "fileUrl": "https://example.com/id-card.jpg",
    "mimeType": "image/jpeg"
  }'
```

## Security Considerations

1. **API Keys** - Never commit API keys to version control
2. **File Storage** - Ensure secure file storage for uploaded documents
3. **Data Privacy** - Extracted data should comply with privacy regulations
4. **Rate Limiting** - Implement rate limiting to prevent abuse
5. **Validation** - Always validate extracted data before using in production

## Support

For issues or questions, refer to:
- OpenAI API Docs: https://platform.openai.com/docs
- Google Vision API Docs: https://cloud.google.com/vision/docs
- AWS Textract Docs: https://docs.aws.amazon.com/textract/

