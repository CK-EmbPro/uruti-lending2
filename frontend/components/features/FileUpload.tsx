'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { Upload, X, File, CheckCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete?: (file: any) => void;
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
}

export function FileUpload({
  onUploadComplete,
  accept = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx',
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const uploadFile = useFileUpload();

  const handleFiles = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const fileArray = Array.from(selectedFiles);
      const validFiles = fileArray.filter((file) => {
        if (file.size > maxSize) {
          alert(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
          return false;
        }
        return true;
      });

      if (multiple) {
        setFiles((prev) => [...prev, ...validFiles]);
      } else {
        setFiles(validFiles);
      }
    },
    [maxSize, multiple],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        const result = await uploadFile.mutateAsync(file);
        if (onUploadComplete) {
          onUploadComplete(result.file);
        }
        // Remove uploaded file from list
        setFiles((prev) => prev.filter((f) => f !== file));
      } catch (error) {
        console.error('Upload error:', error);
      }
    },
    [uploadFile, onUploadComplete],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }
        `}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop files here, or click to select
        </p>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload">
          <Button type="button" variant="outline" asChild>
            <span>Select Files</span>
          </Button>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          Maximum file size: {formatFileSize(maxSize)}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Selected Files ({files.length})
            </h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-5 w-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpload(file)}
                      disabled={uploadFile.isPending}
                    >
                      {uploadFile.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

