'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useGenerateQRCode, useGenerateAndDownloadQRCode, useValidateQRCodeData } from '@/lib/hooks/useQRCode';
import { QRCodeErrorCorrectionLevel, QRCodeType, type GenerateQRCodeDto } from '@/lib/api/qrcode';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  RefreshCw,
} from 'lucide-react';

export function QRCodeGenerator() {
  const [data, setData] = useState('https://example.com');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<QRCodeErrorCorrectionLevel>(
    QRCodeErrorCorrectionLevel.M,
  );
  const [width, setWidth] = useState(300);
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#FFFFFF');
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const generateQRCode = useGenerateQRCode();
  const downloadQRCode = useGenerateAndDownloadQRCode();
  const validateData = useValidateQRCodeData();

  const handleGenerate = async () => {
    try {
      const result = await generateQRCode.mutateAsync({
        data,
        errorCorrectionLevel,
        width,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        type: QRCodeType.PNG,
      });
      setGeneratedDataUrl(result.dataUrl);
    } catch (error) {
      console.error('Generate error:', error);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadQRCode.mutateAsync({
        data,
        errorCorrectionLevel,
        width,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        type: QRCodeType.PNG,
      });
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleValidate = async () => {
    try {
      const result = await validateData.mutateAsync(data);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ valid: false, error: 'Validation failed' });
    }
  };

  const handleCopyDataUrl = () => {
    if (generatedDataUrl) {
      navigator.clipboard.writeText(generatedDataUrl);
      toast.success('Data URL copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QR Code Generator</h2>
          <p className="text-sm text-gray-600 mt-1">
            Generate QR codes for URLs, text, payments, and more
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={validateData.isPending}
          >
            {validateData.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Validate
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateQRCode.isPending}
          >
            {generateQRCode.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <QrCode className="h-4 w-4 mr-2" />
            )}
            Generate
          </Button>
          {generatedDataUrl && (
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={downloadQRCode.isPending}
            >
              {downloadQRCode.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <Alert
          variant={validationResult.valid ? 'success' : 'error'}
          title={validationResult.valid ? 'Data is valid' : 'Data validation failed'}
        >
          {validationResult.valid ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>QR code data is valid</span>
            </div>
          ) : (
            <div>
              <p className="font-semibold">Error:</p>
              <p>{validationResult.error}</p>
            </div>
          )}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data to Encode
              </label>
              <Textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                rows={4}
                placeholder="Enter URL, text, or data to encode..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {data.length} characters (max 2953)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Correction
                </label>
                <Select
                  value={errorCorrectionLevel}
                  onChange={(e) => setErrorCorrectionLevel(e.target.value as QRCodeErrorCorrectionLevel)}
                >
                  <option value={QRCodeErrorCorrectionLevel.L}>L (~7%)</option>
                  <option value={QRCodeErrorCorrectionLevel.M}>M (~15%)</option>
                  <option value={QRCodeErrorCorrectionLevel.Q}>Q (~25%)</option>
                  <option value={QRCodeErrorCorrectionLevel.H}>H (~30%)</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (pixels)
                </label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 300)}
                  min={100}
                  max={2000}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dark Color
                </label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Light Color
                </label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>

            {/* Quick Examples */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Examples
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setData('https://urutilending.com')}
                >
                  URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setData('Hello, World!')}
                >
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setData('PAYMENT:1000:USD:REF-123')}
                >
                  Payment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setData('LOAN:12345:DOC:67890')}
                >
                  Loan Doc
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview Panel */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                Preview
              </label>
              {generatedDataUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDataUrl}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Data URL
                </Button>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[400px]">
              {data ? (
                <>
                  {/* Client-side preview using qrcode.react */}
                  <div className="mb-4">
                    <QRCodeSVG
                      value={data}
                      size={Math.min(width, 400)}
                      level={errorCorrectionLevel}
                      fgColor={darkColor}
                      bgColor={lightColor}
                    />
                  </div>

                  {/* Server-generated preview if available */}
                  {generatedDataUrl && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Server Generated:</p>
                      <img
                        src={generatedDataUrl}
                        alt="QR Code"
                        className="border rounded"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                  )}

                  <div className="mt-4 text-center">
                    <Badge variant="info" className="mb-2">
                      {data.length} chars
                    </Badge>
                    <p className="text-xs text-gray-500 break-all">{data}</p>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400">
                  <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Enter data to generate QR code</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

