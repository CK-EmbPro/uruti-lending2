'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useProcessDocument, useProcessAndFillApplication } from '@/lib/hooks/useAI';
import { DocumentType, type ExtractedData } from '@/lib/api/ai';
import toast from 'react-hot-toast';
import {
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  Eye,
} from 'lucide-react';

interface AIDocumentProcessorProps {
  documentId: string;
  applicationId?: string;
  fileUrl?: string;
  filePath?: string;
  mimeType?: string;
  onExtracted?: (data: ExtractedData) => void;
  onAutoFilled?: (filledFields: string[]) => void;
}

export function AIDocumentProcessor({
  documentId,
  applicationId,
  fileUrl,
  filePath,
  mimeType,
  onExtracted,
  onAutoFilled,
}: AIDocumentProcessorProps) {
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.ID_CARD);
  const [showResults, setShowResults] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);

  const processDocument = useProcessDocument();
  const processAndFill = useProcessAndFillApplication();

  const handleProcess = async () => {
    try {
      const result = await processDocument.mutateAsync({
        documentId,
        documentType,
        fileUrl,
        filePath,
        mimeType,
        autoFillApplication: !!applicationId,
      });

      setProcessingResult(result);
      setExtractedData(result.extractedData);
      setShowResults(true);

      if (onExtracted) {
        onExtracted(result.extractedData);
      }
    } catch (error) {
      console.error('Processing error:', error);
    }
  };

  const handleProcessAndFill = async () => {
    if (!applicationId) return;

    try {
      const result = await processAndFill.mutateAsync({
        documentId,
        applicationId,
        documentType,
        fileUrl,
        filePath,
        mimeType,
      });

      setExtractedData(result.extractedData);
      setProcessingResult({ ...processingResult, filledFields: result.filledFields });

      if (onAutoFilled) {
        onAutoFilled(result.filledFields);
      }

      toast.success(`Successfully filled ${result.filledFields.length} fields in application`);
    } catch (error) {
      console.error('Process and fill error:', error);
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-100 text-gray-800';
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Document Processing</h3>
          </div>

          <div className="space-y-4">
            <Select
              label="Document Type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            >
              <option value={DocumentType.ID_CARD}>ID Card</option>
              <option value={DocumentType.BANK_STATEMENT}>Bank Statement</option>
              <option value={DocumentType.PAYSLIP}>Payslip</option>
              <option value={DocumentType.TAX_RETURN}>Tax Return</option>
              <option value={DocumentType.UTILITY_BILL}>Utility Bill</option>
              <option value={DocumentType.EMPLOYMENT_LETTER}>Employment Letter</option>
              <option value={DocumentType.OTHER}>Other</option>
            </Select>

            <div className="flex gap-2">
              <Button
                onClick={handleProcess}
                disabled={processDocument.isPending}
                className="flex items-center gap-2"
              >
                {processDocument.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Extract Data
                  </>
                )}
              </Button>

              {applicationId && extractedData && (
                <Button
                  onClick={handleProcessAndFill}
                  disabled={processAndFill.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {processAndFill.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Filling...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Auto-Fill Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Results Modal */}
      <Modal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        title="AI Extraction Results"
        size="lg"
      >
        {processingResult && (
          <div className="space-y-6">
            {/* Confidence Score */}
            {processingResult.extractedData?.confidence !== undefined && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Confidence Score</span>
                <Badge className={getConfidenceColor(processingResult.extractedData.confidence)}>
                  {(processingResult.extractedData.confidence * 100).toFixed(1)}%
                </Badge>
              </div>
            )}

            {/* Extracted Data */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Extracted Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {processingResult.extractedData?.fullName && (
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">{processingResult.extractedData.fullName}</p>
                  </div>
                )}
                {processingResult.extractedData?.idNumber && (
                  <div>
                    <p className="text-sm text-gray-600">ID Number</p>
                    <p className="font-medium">{processingResult.extractedData.idNumber}</p>
                  </div>
                )}
                {processingResult.extractedData?.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{processingResult.extractedData.email}</p>
                  </div>
                )}
                {processingResult.extractedData?.phoneNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium">{processingResult.extractedData.phoneNumber}</p>
                  </div>
                )}
                {processingResult.extractedData?.monthlyIncome && (
                  <div>
                    <p className="text-sm text-gray-600">Monthly Income</p>
                    <p className="font-medium">
                      ${processingResult.extractedData.monthlyIncome.toLocaleString()}
                    </p>
                  </div>
                )}
                {processingResult.extractedData?.bankName && (
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-medium">{processingResult.extractedData.bankName}</p>
                  </div>
                )}
                {processingResult.extractedData?.accountNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium">{processingResult.extractedData.accountNumber}</p>
                  </div>
                )}
                {processingResult.extractedData?.employerName && (
                  <div>
                    <p className="text-sm text-gray-600">Employer</p>
                    <p className="font-medium">{processingResult.extractedData.employerName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Errors */}
            {processingResult.validationErrors && processingResult.validationErrors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Validation Warnings
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                  {processingResult.validationErrors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {processingResult.suggestions && Object.keys(processingResult.suggestions).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Suggestions</h4>
                <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                  {Object.entries(processingResult.suggestions).map(([key, value]) => (
                    <p key={key} className="mb-1">
                      <strong>{key}:</strong> {String(value)}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Info */}
            {processingResult.processingTime && (
              <div className="text-sm text-gray-500">
                Processed in {(processingResult.processingTime / 1000).toFixed(2)}s using{' '}
                {processingResult.aiModel || 'AI'}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Close
              </Button>
              {applicationId && (
                <Button onClick={handleProcessAndFill} disabled={processAndFill.isPending}>
                  {processAndFill.isPending ? 'Filling...' : 'Auto-Fill Application'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

