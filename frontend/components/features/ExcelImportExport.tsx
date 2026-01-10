'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import {
  useExportToExcel,
  useImportFromExcel,
  useExportToCSV,
  useImportFromCSV,
} from '@/lib/hooks/useExcel';
import {
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface ExcelImportExportProps {
  data?: any[];
  onImportComplete?: (data: any[]) => void;
  defaultFilename?: string;
}

export function ExcelImportExport({
  data = [],
  onImportComplete,
  defaultFilename = 'export',
}: ExcelImportExportProps) {
  const [filename, setFilename] = useState(defaultFilename);
  const [importFile, setImportFile] = useState<File | null>(null);

  const exportToExcel = useExportToExcel();
  const exportToCSV = useExportToCSV();
  const importFromExcel = useImportFromExcel();
  const importFromCSV = useImportFromCSV();

  const handleExportExcel = async () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    await exportToExcel.mutateAsync({
      data,
      filename: `${filename}.xlsx`,
      sheetName: 'Data',
    });
  };

  const handleExportCSV = async () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    await exportToCSV.mutateAsync({
      data,
    });
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      alert('Please select a file');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const result = await importFromExcel.mutateAsync({
        fileData: base64,
      });

      if (onImportComplete) {
        onImportComplete(result.data);
      }
    };
    reader.readAsDataURL(importFile);
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      alert('Please select a file');
      return;
    }

    const text = await importFile.text();
    const result = await importFromCSV.mutateAsync({
      csvContent: text,
    });

    if (onImportComplete) {
      onImportComplete(result.data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filename (for Excel)
              </label>
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="export"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleExportExcel}
                disabled={exportToExcel.isPending || data.length === 0}
              >
                {exportToExcel.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Export to Excel
              </Button>

              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={exportToCSV.isPending || data.length === 0}
              >
                {exportToCSV.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Export to CSV
              </Button>
            </div>

            {data.length > 0 && (
              <p className="text-sm text-gray-500">
                Ready to export {data.length} records
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Import Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              {importFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleImportExcel}
                disabled={importFromExcel.isPending || !importFile || !importFile.name.endsWith('.xlsx')}
              >
                {importFromExcel.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Import from Excel
              </Button>

              <Button
                variant="outline"
                onClick={handleImportCSV}
                disabled={importFromCSV.isPending || !importFile || !importFile.name.endsWith('.csv')}
              >
                {importFromCSV.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Import from CSV
              </Button>
            </div>

            {(importFromExcel.isSuccess || importFromCSV.isSuccess) && (
              <Alert variant="success" title="Import Successful">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Data imported successfully</span>
                </div>
              </Alert>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

