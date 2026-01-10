'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useRenderReport, useValidateTemplate, useRenderReportBase64 } from '@/lib/hooks/useJsReport';
import {
  ReportEngine,
  ReportRecipe,
  PageFormat,
  PageOrientation,
  type RenderReportDto,
} from '@/lib/api/jsreport';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Code,
  Settings,
  Play,
  Save,
  Loader2,
} from 'lucide-react';

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
    }
    .summary {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <p><strong>Generated:</strong> {{generatedAt}}</p>
  
  {{#if data.summary}}
  <div class="summary">
    <h2>Summary</h2>
    <ul>
      <li>Total Items: {{data.summary.total}}</li>
      <li>Active: {{data.summary.active}}</li>
      <li>Total Amount: ${{data.summary.amount}}</li>
    </ul>
  </div>
  {{/if}}
  
  {{#if data.items}}
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Status</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each data.items}}
      <tr>
        <td>{{id}}</td>
        <td>{{name}}</td>
        <td>{{status}}</td>
        <td>${{amount}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{/if}}
</body>
</html>`;

const DEFAULT_DATA = {
  title: 'Sample Report',
  generatedAt: new Date().toISOString(),
  data: {
    summary: {
      total: 100,
      active: 85,
      amount: 500000,
    },
    items: [
      { id: '1', name: 'Item 1', status: 'Active', amount: 1000 },
      { id: '2', name: 'Item 2', status: 'Active', amount: 2000 },
      { id: '3', name: 'Item 3', status: 'Inactive', amount: 1500 },
    ],
  },
};

export function ReportDesigner() {
  const [templateContent, setTemplateContent] = useState(DEFAULT_TEMPLATE);
  const [dataContent, setDataContent] = useState(JSON.stringify(DEFAULT_DATA, null, 2));
  const [recipe, setRecipe] = useState<ReportRecipe>(ReportRecipe.CHROME_PDF);
  const [format, setFormat] = useState<PageFormat>(PageFormat.A4);
  const [orientation, setOrientation] = useState<PageOrientation>(PageOrientation.PORTRAIT);
  const [margin, setMargin] = useState('1cm');
  const [displayHeaderFooter, setDisplayHeaderFooter] = useState(false);
  const [headerTemplate, setHeaderTemplate] = useState('');
  const [footerTemplate, setFooterTemplate] = useState('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors?: string[] } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const renderReport = useRenderReport();
  const renderReportBase64 = useRenderReportBase64();
  const validateTemplate = useValidateTemplate();

  const handleValidate = useCallback(async () => {
    try {
      const result = await validateTemplate.mutateAsync({
        templateContent,
        engine: ReportEngine.HANDLEBARS,
      });
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ valid: false, errors: ['Validation failed'] });
    }
  }, [templateContent, validateTemplate]);

  const handlePreview = useCallback(async () => {
    try {
      let data: Record<string, any> = {};
      try {
        data = JSON.parse(dataContent);
      } catch (e) {
        throw new Error('Invalid JSON data');
      }

      const dto: RenderReportDto = {
        templateContent,
        data,
        recipe: ReportRecipe.HTML, // Always use HTML for preview
        engine: ReportEngine.HANDLEBARS,
      };

      const result = await renderReportBase64.mutateAsync(dto);
      
      // Create blob URL for preview
      const binaryString = atob(result.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error: any) {
      console.error('Preview error:', error);
    }
  }, [templateContent, dataContent, renderReportBase64]);

  const handleRender = useCallback(async () => {
    try {
      let data: Record<string, any> = {};
      try {
        data = JSON.parse(dataContent);
      } catch (e) {
        throw new Error('Invalid JSON data');
      }

      const dto: RenderReportDto = {
        templateContent,
        data,
        recipe,
        engine: ReportEngine.HANDLEBARS,
        format,
        orientation,
        margin,
        displayHeaderFooter,
        headerTemplate: displayHeaderFooter ? headerTemplate : undefined,
        footerTemplate: displayHeaderFooter ? footerTemplate : undefined,
      };

      await renderReport.mutateAsync(dto);
    } catch (error: any) {
      console.error('Render error:', error);
    }
  }, [
    templateContent,
    dataContent,
    recipe,
    format,
    orientation,
    margin,
    displayHeaderFooter,
    headerTemplate,
    footerTemplate,
    renderReport,
  ]);

  const tabs = [
    { id: 'template', label: 'Template', icon: Code },
    { id: 'data', label: 'Data', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'preview', label: 'Preview', icon: Eye },
  ];

  const [activeTab, setActiveTab] = useState('template');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Designer</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and customize reports using Handlebars templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={validateTemplate.isPending}
          >
            {validateTemplate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Validate
          </Button>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={renderReportBase64.isPending}
          >
            {renderReportBase64.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Preview
          </Button>
          <Button
            onClick={handleRender}
            disabled={renderReport.isPending}
          >
            {renderReport.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Generate & Download
          </Button>
        </div>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <Alert
          variant={validationResult.valid ? 'success' : 'error'}
          title={validationResult.valid ? 'Template is valid' : 'Template validation failed'}
        >
          {validationResult.valid ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Template syntax is correct</span>
            </div>
          ) : (
            <div>
              <p className="font-semibold mb-2">Errors:</p>
              <ul className="list-disc list-inside">
                {validationResult.errors?.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </Alert>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <Card>
        <div className="p-6">
          {activeTab === 'template' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Template (Handlebars)
                </label>
                <Badge variant="info">Handlebars</Badge>
              </div>
              <Textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Enter Handlebars template..."
              />
              <div className="text-xs text-gray-500">
                <p>Use Handlebars syntax: {`{{variable}}`, `{{#if condition}}`, `{{#each items}}`}</p>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">
                Data (JSON)
              </label>
              <Textarea
                value={dataContent}
                onChange={(e) => setDataContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Enter JSON data..."
              />
              <div className="text-xs text-gray-500">
                <p>Enter JSON data that will be used to populate the template variables.</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <Select
                    value={recipe}
                    onChange={(e) => setRecipe(e.target.value as ReportRecipe)}
                  >
                    <option value={ReportRecipe.CHROME_PDF}>PDF</option>
                    <option value={ReportRecipe.HTML}>HTML</option>
                    <option value={ReportRecipe.XLSX}>Excel (XLSX)</option>
                  </Select>
                </div>

                {recipe === ReportRecipe.CHROME_PDF && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Format
                      </label>
                      <Select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as PageFormat)}
                      >
                        <option value={PageFormat.A4}>A4</option>
                        <option value={PageFormat.LETTER}>Letter</option>
                        <option value={PageFormat.A3}>A3</option>
                        <option value={PageFormat.A5}>A5</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Orientation
                      </label>
                      <Select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value as PageOrientation)}
                      >
                        <option value={PageOrientation.PORTRAIT}>Portrait</option>
                        <option value={PageOrientation.LANDSCAPE}>Landscape</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Margin
                      </label>
                      <Input
                        value={margin}
                        onChange={(e) => setMargin(e.target.value)}
                        placeholder="1cm"
                      />
                    </div>
                  </>
                )}
              </div>

              {recipe === ReportRecipe.CHROME_PDF && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="headerFooter"
                      checked={displayHeaderFooter}
                      onChange={(e) => setDisplayHeaderFooter(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="headerFooter" className="text-sm font-medium text-gray-700">
                      Display Header and Footer
                    </label>
                  </div>

                  {displayHeaderFooter && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Header Template (HTML)
                        </label>
                        <Textarea
                          value={headerTemplate}
                          onChange={(e) => setHeaderTemplate(e.target.value)}
                          rows={3}
                          placeholder="<div style='text-align: center;'>Header</div>"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Footer Template (HTML)
                        </label>
                        <Textarea
                          value={footerTemplate}
                          onChange={(e) => setFooterTemplate(e.target.value)}
                          rows={3}
                          placeholder="<div style='text-align: center;'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div>"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use <code className="bg-gray-100 px-1 rounded">pageNumber</code> and{' '}
                          <code className="bg-gray-100 px-1 rounded">totalPages</code> classes for page numbers
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              {previewUrl ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      HTML Preview
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewUrl(null);
                        URL.revokeObjectURL(previewUrl);
                      }}
                    >
                      Clear Preview
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      src={previewUrl}
                      className="w-full h-[600px] border-0"
                      title="Report Preview"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No preview available</p>
                  <p className="text-sm mt-2">Click "Preview" to generate a preview</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

