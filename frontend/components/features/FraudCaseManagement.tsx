'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fraudDetectionApi, FraudCase, FraudCaseType } from '@/lib/api/fraud-detection';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import {
  Shield,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface FraudCaseManagementProps {
  companyId?: string;
}

const caseTypeLabels: Record<FraudCaseType, string> = {
  [FraudCaseType.IDENTITY_THEFT]: 'Identity Theft',
  [FraudCaseType.DOCUMENT_FRAUD]: 'Document Fraud',
  [FraudCaseType.APPLICATION_FRAUD]: 'Application Fraud',
  [FraudCaseType.ACCOUNT_TAKEOVER]: 'Account Takeover',
  [FraudCaseType.SYNTHETIC_IDENTITY]: 'Synthetic Identity',
  [FraudCaseType.COLLUSION]: 'Collusion',
  [FraudCaseType.OTHER]: 'Other',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  INVESTIGATING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ESCALATED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function FraudCaseManagement({ companyId }: FraudCaseManagementProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Note: This would need a backend endpoint to fetch cases
  // For now, showing the UI structure
  const cases: FraudCase[] = []; // Would come from API

  const filteredCases = cases.filter((case_) => {
    if (statusFilter !== 'all' && case_.status !== statusFilter) return false;
    if (typeFilter !== 'all' && case_.caseType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Fraud Case Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and investigate fraud cases
          </p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Case Type
            </label>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              {Object.entries(caseTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}>
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Cases List */}
      <Card className="p-6">
        {filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No fraud cases found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Cases will appear here when fraud is detected
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((case_) => (
              <div
                key={case_.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {case_.caseNumber}
                      </h3>
                      <Badge className={statusColors[case_.status] || ''}>{case_.status}</Badge>
                      <Badge variant="outline">{caseTypeLabels[case_.caseType]}</Badge>
                      {case_.priority <= 2 && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Priority {case_.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {case_.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      {case_.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Assigned to: {case_.assignedTo}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {format(new Date(case_.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {case_.relatedApplications.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{case_.relatedApplications.length} related application(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

