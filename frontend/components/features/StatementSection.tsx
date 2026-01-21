'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import {
  useStatementsForLoan,
  useGenerateStatement,
  useSendStatement,
} from '@/lib/hooks/useAccountManagement';
import {
  FileText,
  Download,
  Send,
  Loader2,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface StatementSectionProps {
  loanId: string;
}

export function StatementSection({ loanId }: StatementSectionProps) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [statementType, setStatementType] = useState<'Monthly' | 'Annual' | 'On-Demand'>('On-Demand');
  const [statementDate, setStatementDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: statements, isLoading } = useStatementsForLoan(loanId);
  const generateStatement = useGenerateStatement();
  const sendStatement = useSendStatement();

  const handleGenerate = async () => {
    try {
      await generateStatement.mutateAsync({
        loanId,
        statementType,
        statementDate,
      });
      setShowGenerateModal(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSend = async (statementId: string) => {
    try {
      await sendStatement.mutateAsync(statementId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      Generated: { label: 'Generated', variant: 'info' },
      Sent: { label: 'Sent', variant: 'success' },
      Delivered: { label: 'Delivered', variant: 'success' },
      Failed: { label: 'Failed', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card title="Statements">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card title="Statements">
      <div className="space-y-4">
        {/* Generate Button */}
        <Button
          variant="outline"
          onClick={() => setShowGenerateModal(true)}
          className="w-full flex items-center gap-1"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Statement
        </Button>

        {/* Statements List */}
        {statements && statements.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">Statement History</div>
            {statements.map((statement) => (
              <div
                key={statement.id}
                className="p-3 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-sm">{statement.statementType} Statement</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(statement.statementDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(statement.status)}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Period: {format(new Date(statement.periodStartDate), 'MMM dd')} -{' '}
                  {format(new Date(statement.periodEndDate), 'MMM dd, yyyy')}
                </div>
                <div className="flex gap-2">
                  {statement.fileUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <a href={statement.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </a>
                    </Button>
                  )}
                  {statement.status === 'Generated' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSend(statement.id)}
                      disabled={sendStatement.isPending}
                    >
                      {sendStatement.isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" />
                          Send
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="info" title="No Statements">
            No statements have been generated yet. Generate a statement to view your loan activity.
          </Alert>
        )}

        {/* Generate Modal */}
        <Modal
          isOpen={showGenerateModal}
          onClose={() => {
            setShowGenerateModal(false);
            setStatementType('On-Demand');
            setStatementDate(format(new Date(), 'yyyy-MM-dd'));
          }}
          title="Generate Statement"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGenerateModal(false);
                  setStatementType('On-Demand');
                  setStatementDate(format(new Date(), 'yyyy-MM-dd'));
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={generateStatement.isPending}>
                {generateStatement.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Statement
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Generate a statement to view your loan activity, payments, and balances for a specific period.
            </Alert>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Statement Type
              </label>
              <select
                value={statementType}
                onChange={(e) => setStatementType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="On-Demand">On-Demand (Last 30 days)</option>
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Statement Date
              </label>
              <input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </Modal>
      </div>
    </Card>
  );
}

