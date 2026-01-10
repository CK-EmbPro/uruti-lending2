'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { FileUpload } from '@/components/features/FileUpload';
import { ExcelImportExport } from '@/components/features/ExcelImportExport';
import { QRCodeGenerator } from '@/components/features/QRCodeGenerator';
import { ReportDesigner } from '@/components/features/ReportDesigner';
import {
  FileUpload as FileUploadIcon,
  FileSpreadsheet,
  QrCode,
  FileText,
} from 'lucide-react';

export default function ToolsPage() {
  const [sampleData] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', amount: 5000 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', amount: 7500 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', amount: 3000 },
  ]);

  const tabs = [
    {
      id: 'file-upload',
      label: 'File Upload',
      content: (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">File Upload</h2>
            <p className="text-sm text-gray-600 mb-6">
              Upload documents, images, and other files. Supports drag-and-drop and multiple file
              selection.
            </p>
            <FileUpload
              onUploadComplete={(file) => {
                console.log('File uploaded:', file);
              }}
            />
          </div>
        </Card>
      ),
    },
    {
      id: 'excel',
      label: 'Excel/CSV',
      content: (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Excel & CSV Import/Export
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Import data from Excel or CSV files, or export your data to these formats for
              external processing.
            </p>
            <ExcelImportExport
              data={sampleData}
              onImportComplete={(data) => {
                console.log('Data imported:', data);
              }}
            />
          </div>
        </Card>
      ),
    },
    {
      id: 'qrcode',
      label: 'QR Codes',
      content: (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Code Generator</h2>
            <p className="text-sm text-gray-600 mb-6">
              Generate QR codes for URLs, text, payment links, loan documents, and more. Customize
              appearance and download in various formats.
            </p>
            <QRCodeGenerator />
          </div>
        </Card>
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      content: (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Designer</h2>
            <p className="text-sm text-gray-600 mb-6">
              Design and generate custom reports with visual templates. Export to PDF, HTML, or
              Excel formats.
            </p>
            <ReportDesigner />
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Tools</h1>
        <p className="text-gray-600">
          Access powerful tools for file management, data import/export, QR codes, and reporting
        </p>
      </div>

      <Tabs tabs={tabs} defaultTab="file-upload" />
    </div>
  );
}

