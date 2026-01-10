'use client';

import { useState } from 'react';
import { useProcessDocument } from '@/lib/hooks/useAI';
import { DocumentType, DocumentProcessingResult } from '@/lib/api/ai';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Upload, CheckCircle, XCircle, AlertCircle, FileText, Clock } from 'lucide-react';

interface DocumentVerificationProps {
  applicationId?: string;
  onComplete?: (result: DocumentProcessingResult) => void;
}

export function DocumentVerification({ applicationId, onComplete }: DocumentVerificationProps) {
  const [documentId, setDocumentId] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.ID_CARD);
  const [fileUrl, setFileUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DocumentProcessingResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const processDocument = useProcessDocument();

  const documentTypeOptions = Object.values(DocumentType).map((type) => ({
    value: type,
    label: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // In a real implementation, upload file first and get URL
      // For now, we'll use a placeholder
      setFileUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleProcess = async () => {
    if (!documentId || !documentType) {
      alert('Please provide document ID and type');
      return;
    }

    try {
      setIsUploading(true);
      const processingResult = await processDocument.mutateAsync({
        documentId,
        documentType,
        fileUrl: fileUrl || undefined,
        mimeType: file?.type,
      });
      setResult(processingResult);
      if (onComplete) {
        onComplete(processingResult);
      }
    } catch (error) {
      console.error('Failed to process document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <Card title="AI Document Verification" subtitle="Upload and verify documents with 50+ document types support">
        <div className="space-y-4">
          {/* Document ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document ID <span className="text-red-500">*</span>
            </label>
            <Input
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Enter document ID"
              disabled={isUploading || processDocument.isPending}
            />
          </div>

          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              options={documentTypeOptions}
              disabled={isUploading || processDocument.isPending}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document File (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      disabled={isUploading || processDocument.isPending}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: <span className="font-medium">{file.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            isLoading={isUploading || processDocument.isPending}
            disabled={!documentId || !documentType}
            className="w-full"
          >
            Process Document
          </Button>
        </div>
      </Card>

      {/* Results Display */}
      {result && (
        <Card title="Verification Results">
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {result.success ? 'Document Verified' : 'Verification Failed'}
                  </p>
                  {result.processingTime && (
                    <p className="text-sm text-gray-600">
                      Processed in {(result.processingTime / 1000).toFixed(2)}s
                    </p>
                  )}
                </div>
              </div>
              {result.success && <Badge variant="success">Verified</Badge>}
            </div>

            {/* OCR Metrics */}
            {result.ocrMetrics && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  OCR Metrics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">OCR Accuracy</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPercentage(result.ocrMetrics.accuracy)}
                    </p>
                    {result.extractedData?.isHandwritten && (
                      <Badge variant="info" size="sm" className="mt-2">
                        Handwritten
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatPercentage(result.ocrMetrics.confidence)}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-gray-600">Text Type</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {result.extractedData?.isHandwritten ? 'Handwritten' : 'Typed'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Authenticity Check */}
            {result.authenticityCheck && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Authenticity Check
                </h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Score</span>
                    <Badge variant={result.authenticityCheck.passed ? 'success' : 'error'}>
                      {formatPercentage(result.authenticityCheck.score)}
                    </Badge>
                  </div>
                  <Progress
                    value={result.authenticityCheck.score * 100}
                    className="mb-3"
                  />
                  {result.authenticityCheck.issues.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Issues Found:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.authenticityCheck.issues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-red-600">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quality Check */}
            {result.qualityCheck && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Quality Check
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.qualityCheck.blurry && (
                    <Badge variant="warning">Blurry Image</Badge>
                  )}
                  {result.qualityCheck.partial && (
                    <Badge variant="warning">Partial Document</Badge>
                  )}
                  {result.qualityCheck.tampered && (
                    <Badge variant="error">Tampered Image</Badge>
                  )}
                  {!result.qualityCheck.blurry && !result.qualityCheck.partial && !result.qualityCheck.tampered && (
                    <Badge variant="success">Quality Passed</Badge>
                  )}
                </div>
                {result.qualityCheck.issues.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Quality Issues:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.qualityCheck.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-yellow-700">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Cross-field Validation */}
            {result.extractedData?.crossFieldValidation && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Cross-field Validation</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">Name Consistency</span>
                    {result.extractedData.crossFieldValidation.nameConsistency ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">ID Consistency</span>
                    {result.extractedData.crossFieldValidation.idConsistency ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">Photo Consistency</span>
                    {result.extractedData.crossFieldValidation.photoConsistency ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  {result.extractedData.crossFieldValidation.issues.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-1">Validation Issues:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.extractedData.crossFieldValidation.issues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-red-700">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extracted Data Summary */}
            {result.extractedData && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Extracted Data</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {result.extractedData.fullName && (
                      <div>
                        <span className="font-medium text-gray-700">Full Name:</span>{' '}
                        <span className="text-gray-900">{result.extractedData.fullName}</span>
                      </div>
                    )}
                    {result.extractedData.idNumber && (
                      <div>
                        <span className="font-medium text-gray-700">ID Number:</span>{' '}
                        <span className="text-gray-900">{result.extractedData.idNumber}</span>
                      </div>
                    )}
                    {result.extractedData.dateOfBirth && (
                      <div>
                        <span className="font-medium text-gray-700">Date of Birth:</span>{' '}
                        <span className="text-gray-900">{result.extractedData.dateOfBirth}</span>
                      </div>
                    )}
                    {result.extractedData.address && (
                      <div>
                        <span className="font-medium text-gray-700">Address:</span>{' '}
                        <span className="text-gray-900">{result.extractedData.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

