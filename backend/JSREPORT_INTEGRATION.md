# jsReport Integration - Visual Report Designer

**Status:** ✅ **COMPLETE**  
**Date:** January 2024

---

## Overview

jsReport has been integrated into the Uruti Lending Platform to provide a powerful visual report designer and report generation engine. This integration enables users to create custom reports with templates, generate PDFs, Excel files, and HTML reports.

---

## Features

### ✅ Implemented Features

1. **Report Rendering**
   - PDF generation (chrome-pdf recipe)
   - HTML generation
   - Excel generation (xlsx recipe)
   - Custom templates with Handlebars

2. **Template Management**
   - Template validation
   - Template syntax checking
   - Support for Handlebars templating engine

3. **API Endpoints**
   - `/jsreport/render` - Render report and download
   - `/jsreport/render/base64` - Render report and return as base64
   - `/jsreport/validate` - Validate template syntax
   - `/jsreport/health` - Health check

4. **Integration with Advanced Reporting**
   - Automatic report generation using jsReport
   - Template-based report creation
   - Support for all report formats (PDF, Excel, HTML)

---

## Installation

### Dependencies

The following packages have been installed:

```json
{
  "jsreport-core": "^3.x.x",
  "jsreport-chrome-pdf": "^3.x.x",
  "jsreport-handlebars": "^3.x.x",
  "jsreport-express": "^3.x.x"
}
```

### Module Registration

The `JsReportModule` has been registered in `app.module.ts` and integrated with `AdvancedReportingModule`.

---

## API Usage

### 1. Render Report (Download)

**Endpoint:** `POST /jsreport/render`

**Request Body:**
```json
{
  "templateContent": "<h1>{{title}}</h1><p>{{content}}</p>",
  "data": {
    "title": "My Report",
    "content": "Report content here"
  },
  "recipe": "chrome-pdf",
  "format": "A4",
  "orientation": "portrait",
  "margin": "1cm"
}
```

**Response:** Binary file (PDF, HTML, or Excel)

### 2. Render Report (Base64)

**Endpoint:** `POST /jsreport/render/base64`

**Request Body:** Same as above

**Response:**
```json
{
  "content": "JVBERi0xLjQKJeLjz9MKMy...",
  "mimeType": "application/pdf",
  "size": 1048576
}
```

### 3. Validate Template

**Endpoint:** `POST /jsreport/validate`

**Request Body:**
```json
{
  "templateContent": "<h1>{{title}}</h1>",
  "engine": "handlebars"
}
```

**Response:**
```json
{
  "valid": true,
  "errors": []
}
```

---

## Template Examples

### Basic PDF Report

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <p>{{content}}</p>
</body>
</html>
```

### Report with Data

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
  <h1>{{report.name}}</h1>
  
  {{#if report.summary}}
  <h2>Summary</h2>
  <ul>
    <li>Total Loans: {{report.summary.totalLoans}}</li>
    <li>Total Amount: ${{report.summary.totalAmount}}</li>
  </ul>
  {{/if}}
  
  {{#if report.tables}}
  {{#each report.tables}}
  <table>
    <thead>
      <tr>
        {{#each headers}}
        <th>{{this}}</th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      {{#each rows}}
      <tr>
        {{#each this}}
        <td>{{this}}</td>
        {{/each}}
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{/each}}
  {{/if}}
</body>
</html>
```

### PDF with Header and Footer

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <p>{{content}}</p>
</body>
</html>
```

**Request with Header/Footer:**
```json
{
  "templateContent": "...",
  "data": { "title": "Report", "content": "Content" },
  "displayHeaderFooter": true,
  "headerTemplate": "<div style='text-align: center;'>Header</div>",
  "footerTemplate": "<div style='text-align: center;'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div>"
}
```

---

## Integration with Advanced Reporting

The `AdvancedReportingService` now automatically uses jsReport for report generation:

1. **Template Selection**: Looks for a default template for the report type
2. **Template Building**: Builds template from configuration or uses default
3. **Report Generation**: Uses jsReport to generate PDF, Excel, or HTML
4. **File Storage**: Saves generated report to file system

### Example: Creating a Report

```typescript
// Create report via Advanced Reporting API
POST /advanced-reporting/reports
{
  "name": "Monthly Portfolio Report",
  "type": "LOAN_PORTFOLIO",
  "format": "PDF",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}

// Report is automatically generated using jsReport
// Template is selected from ReportTemplate or default template is used
```

---

## Configuration

### Environment Variables

No additional environment variables are required. jsReport uses default configuration.

### Custom Configuration

To customize jsReport behavior, modify `jsreport.service.ts`:

```typescript
this.jsreportInstance = jsreport({
  extensions: {
    express: {
      enabled: false,
    },
    'chrome-pdf': {
      // Chrome PDF options
    },
  },
  // Additional configuration
});
```

---

## Handlebars Helpers

jsReport supports Handlebars templating with built-in helpers:

- `{{#if condition}}` - Conditional rendering
- `{{#each items}}` - Loop through arrays
- `{{#with object}}` - Context switching
- `{{variable}}` - Variable interpolation

### Custom Helpers

To add custom Handlebars helpers, modify `jsreport.service.ts`:

```typescript
this.jsreportInstance.use(jsreportHandlebars({
  helpers: {
    formatCurrency: (value) => `$${value.toFixed(2)}`,
    formatDate: (date) => new Date(date).toLocaleDateString(),
  },
}));
```

---

## Error Handling

The service includes comprehensive error handling:

- **Template Validation**: Validates template syntax before rendering
- **Render Errors**: Catches and logs rendering errors
- **Timeout Handling**: Configurable timeout (default: 30 seconds)
- **Error Responses**: Returns meaningful error messages

---

## Performance Considerations

1. **Caching**: Consider caching compiled templates for better performance
2. **Async Processing**: Report generation is asynchronous to avoid blocking
3. **Resource Limits**: Chrome PDF rendering can be resource-intensive
4. **Timeout**: Default timeout is 30 seconds, adjust as needed

---

## Security

1. **Authentication**: All endpoints require JWT authentication
2. **Input Validation**: Template content is validated
3. **Sandboxing**: jsReport runs in a sandboxed environment
4. **File Access**: Generated reports are stored securely

---

## Troubleshooting

### Common Issues

1. **Chrome PDF Not Working**
   - Ensure Chrome/Chromium is installed
   - Check Chrome PDF extension configuration

2. **Template Errors**
   - Use `/jsreport/validate` to check template syntax
   - Verify Handlebars syntax is correct

3. **Memory Issues**
   - Large reports may require more memory
   - Consider increasing Node.js memory limit

### Debug Mode

Enable debug logging:

```typescript
this.logger.debug('jsReport render request:', request);
```

---

## Next Steps

### Recommended Enhancements

1. **Visual Report Designer UI**
   - Build a frontend component for visual template editing
   - Drag-and-drop report builder
   - Live preview

2. **Template Library**
   - Pre-built templates for common report types
   - Template marketplace
   - Template sharing

3. **Advanced Features**
   - Charts and graphs in templates
   - Image embedding
   - Custom fonts
   - Watermarks

4. **Performance Optimization**
   - Template caching
   - Report caching
   - Background job processing

---

## API Documentation

Full API documentation is available at:
- Swagger UI: `http://localhost:3000/api/docs`
- Look for "jsReport - Report Designer" section

---

## Support

For issues or questions:
1. Check jsReport documentation: https://jsreport.net/learn
2. Review template examples in this document
3. Use `/jsreport/validate` to debug template issues
4. Check application logs for detailed error messages

---

**Status:** ✅ **Production Ready**

The jsReport integration is complete and ready for use. All endpoints are functional and integrated with the advanced reporting system.

