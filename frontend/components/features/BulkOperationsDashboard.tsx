'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  useCreateBulkOperation,
  usePreviewBulkOperation,
  useApproveBulkOperation,
  useExecuteBulkOperation,
  useBulkOperations,
} from '@/lib/hooks/useWorkflowException';
import {
  Plus,
  Eye,
  CheckCircle,
  Play,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BulkOperationStatus,
  BulkOperationType,
  type BulkOperation,
  type CreateBulkOperationDto,
  type PreviewBulkOperationDto,
  type ApproveBulkOperationDto,
  type ExecuteBulkOperationDto,
} from '@/lib/api/workflow-exception';

export function BulkOperationsDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<BulkOperationStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [operationName, setOperationName] = useState('');
  const [operationType, setOperationType] = useState<BulkOperationType>(BulkOperationType.OTHER);
  const [selectionCriteria, setSelectionCriteria] = useState('{}');
  const [operationDetails, setOperationDetails] = useState('{}');
  const [operationDescription, setOperationDescription] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [generateReport, setGenerateReport] = useState(true);

  const createOperation = useCreateBulkOperation();
  const previewOperation = usePreviewBulkOperation();
  const approveOperation = useApproveBulkOperation();
  const executeOperation = useExecuteBulkOperation();
  const { data: operations, isLoading, refetch } = useBulkOperations({
    status: selectedStatus || undefined,
  });

  const operationsArray = Array.isArray(operations) ? operations : [];

  const handleCreate = () => {
    try {
      const criteria = JSON.parse(selectionCriteria);
      const details = JSON.parse(operationDetails);

      const dto: CreateBulkOperationDto = {
        operationName,
        operationType,
        selectionCriteria: criteria,
        operationDetails: details,
        operationDescription: operationDescription || undefined,
      };

      createOperation.mutate(dto, {
        onSuccess: () => {
          setShowCreateModal(false);
          resetForm();
        },
      });
    } catch (error) {
      alert('Invalid JSON in criteria or details');
    }
  };

  const handlePreview = () => {
    if (!selectedOperation) return;

    const dto: PreviewBulkOperationDto = {
      bulkOperationId: selectedOperation.id,
      sampleSize: 10,
    };

    previewOperation.mutate(
      { id: selectedOperation.id, dto },
      {
        onSuccess: () => {
          refetch();
        },
      },
    );
  };

  const handleApprove = () => {
    if (!selectedOperation) return;

    const dto: ApproveBulkOperationDto = {
      approvalNotes: approvalNotes || undefined,
    };

    approveOperation.mutate(
      { id: selectedOperation.id, dto },
      {
        onSuccess: () => {
          setShowApproveModal(false);
          setSelectedOperation(null);
          setApprovalNotes('');
          refetch();
        },
      },
    );
  };

  const handleExecute = () => {
    if (!selectedOperation) return;

    const dto: ExecuteBulkOperationDto = {
      generateReport,
    };

    executeOperation.mutate(
      { id: selectedOperation.id, dto },
      {
        onSuccess: () => {
          setShowExecuteModal(false);
          setSelectedOperation(null);
          refetch();
        },
      },
    );
  };

  const resetForm = () => {
    setOperationName('');
    setOperationType(BulkOperationType.OTHER);
    setSelectionCriteria('{}');
    setOperationDetails('{}');
    setOperationDescription('');
    setApprovalNotes('');
    setGenerateReport(true);
  };

  const getStatusColor = (status: BulkOperationStatus) => {
    switch (status) {
      case BulkOperationStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case BulkOperationStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case BulkOperationStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case BulkOperationStatus.APPROVED:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const draftCount = operationsArray.filter((o) => o.status === BulkOperationStatus.DRAFT).length;
  const approvedCount = operationsArray.filter((o) => o.status === BulkOperationStatus.APPROVED).length;
  const completedCount = operationsArray.filter((o) => o.status === BulkOperationStatus.COMPLETED).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Bulk Operations</h2>
          <p className="text-sm text-gray-600 mt-1">Execute bulk updates and operations</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as BulkOperationStatus | '')}
            className="w-40"
          >
            <option value="">All Status</option>
            {Object.values(BulkOperationStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Operation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{draftCount}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Operations</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : operationsArray.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Affected Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {operationsArray.map((operation) => (
                    <tr key={operation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{operation.operationName}</div>
                        {operation.operationDescription && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {operation.operationDescription}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{operation.operationType}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(operation.status)}>{operation.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {operation.actualAffectedCount > 0
                            ? operation.actualAffectedCount
                            : operation.estimatedAffectedCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(operation.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {operation.status === BulkOperationStatus.DRAFT && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOperation(operation);
                                handlePreview();
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          )}
                          {operation.status === BulkOperationStatus.PENDING_APPROVAL && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOperation(operation);
                                setShowApproveModal(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {operation.status === BulkOperationStatus.APPROVED && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOperation(operation);
                                setShowExecuteModal(true);
                              }}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Execute
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bulk operations found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create Operation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Bulk Operation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operation Name *</label>
            <Input
              value={operationName}
              onChange={(e) => setOperationName(e.target.value)}
              placeholder="Bulk Rate Adjustment"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operation Type *</label>
            <Select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value as BulkOperationType)}
            >
              {Object.values(BulkOperationType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selection Criteria (JSON) *
            </label>
            <Textarea
              value={selectionCriteria}
              onChange={(e) => setSelectionCriteria(e.target.value)}
              placeholder='{"loanStatus": "Active"}'
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operation Details (JSON) *</label>
            <Textarea
              value={operationDetails}
              onChange={(e) => setOperationDetails(e.target.value)}
              placeholder='{"rateAdjustment": 0.5}'
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={operationDescription}
              onChange={(e) => setOperationDescription(e.target.value)}
              placeholder="Operation description"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!operationName || createOperation.isPending}>
              {createOperation.isPending ? 'Creating...' : 'Create Operation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Operation Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedOperation(null);
          setApprovalNotes('');
        }}
        title="Approve Bulk Operation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Approval Notes</label>
            <Textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Approval notes"
              rows={4}
            />
          </div>
          {selectedOperation?.previewData && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Preview:</h4>
              <p className="text-sm text-gray-600">{selectedOperation.previewData.estimatedImpact}</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approveOperation.isPending}>
              {approveOperation.isPending ? 'Approving...' : 'Approve Operation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Execute Operation Modal */}
      <Modal
        isOpen={showExecuteModal}
        onClose={() => {
          setShowExecuteModal(false);
          setSelectedOperation(null);
        }}
        title="Execute Bulk Operation"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Warning</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This operation will affect approximately {selectedOperation?.estimatedAffectedCount || 0}{' '}
                  records. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="generateReport"
              checked={generateReport}
              onChange={(e) => setGenerateReport(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="generateReport" className="text-sm text-gray-700">
              Generate confirmation report
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowExecuteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleExecute} disabled={executeOperation.isPending} variant="danger">
              {executeOperation.isPending ? 'Executing...' : 'Execute Operation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

