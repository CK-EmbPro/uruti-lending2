'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UnderwritingReview } from '@/lib/api/credit-assessment';
import { FileText, Clock, CheckCircle, AlertCircle, User, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';

interface UnderwritingReviewCardProps {
  review: UnderwritingReview;
  onStart?: () => void;
  onComplete?: () => void;
  onEscalate?: () => void;
  showActions?: boolean;
}

export function UnderwritingReviewCard({
  review,
  onStart,
  onComplete,
  onEscalate,
  showActions = false,
}: UnderwritingReviewCardProps) {
  const getStatusIcon = () => {
    switch (review.status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'In Progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Escalated':
        return <ArrowUp className="w-5 h-5 text-orange-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusVariant = (): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (review.status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'info';
      case 'Escalated':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = () => {
    switch (review.priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Underwriting Review</h3>
            <p className="text-sm text-gray-600">
              {review.assignedDate
                ? `Assigned: ${format(new Date(review.assignedDate), 'PPp')}`
                : `Created: ${format(new Date(review.createdAt), 'PPp')}`}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={getStatusVariant()}>{review.status}</Badge>
          <Badge className={getPriorityColor()}>{review.priority} Priority</Badge>
        </div>
      </div>

      {review.financialAnalysis && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Financial Analysis</h4>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            {review.financialAnalysis}
          </p>
        </div>
      )}

      {review.riskAssessment && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Risk Assessment</h4>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            {review.riskAssessment}
          </p>
        </div>
      )}

      {review.additionalInfoRequested && review.additionalInfoRequested.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Information Requested</h4>
          <ul className="list-disc list-inside space-y-1">
            {review.additionalInfoRequested.map((info, index) => (
              <li key={index} className="text-sm text-gray-600">{info}</li>
            ))}
          </ul>
        </div>
      )}

      {review.decision && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Decision</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-semibold text-gray-900 mb-1">{review.decision}</p>
            {review.decisionRationale && (
              <p className="text-sm text-gray-600">{review.decisionRationale}</p>
            )}
          </div>
        </div>
      )}

      {review.escalationReason && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-orange-700 mb-2">Escalation Reason</h4>
          <p className="text-sm text-orange-800 bg-orange-50 rounded-lg p-3">
            {review.escalationReason}
          </p>
        </div>
      )}

      {review.requiresPeerReview && (
        <div className="mb-4">
          <Badge variant="info" className="text-xs">
            <User className="w-3 h-3 mr-1" />
            Peer Review Required
          </Badge>
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {review.status === 'Pending' && onStart && (
            <Button variant="primary" onClick={onStart} className="flex-1">
              Start Review
            </Button>
          )}
          {review.status === 'In Progress' && (
            <>
              {onComplete && (
                <Button variant="primary" onClick={onComplete} className="flex-1">
                  Complete Review
                </Button>
              )}
              {onEscalate && (
                <Button variant="outline" onClick={onEscalate} className="flex-1">
                  Escalate
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

