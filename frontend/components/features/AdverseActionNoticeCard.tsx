'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdverseActionNotice } from '@/lib/api/credit-assessment';
import { FileText, Mail, CheckCircle, Clock, Download, Send } from 'lucide-react';
import { format } from 'date-fns';

interface AdverseActionNoticeCardProps {
  notice: AdverseActionNotice;
  onSend?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
}

export function AdverseActionNoticeCard({
  notice,
  onSend,
  onDownload,
  showActions = false,
}: AdverseActionNoticeCardProps) {
  const getStatusIcon = () => {
    switch (notice.status) {
      case 'Delivered':
      case 'Acknowledged':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Sent':
        return <Send className="w-5 h-5 text-blue-600" />;
      case 'Generated':
        return <FileText className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusVariant = (): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (notice.status) {
      case 'Delivered':
      case 'Acknowledged':
        return 'success';
      case 'Sent':
        return 'info';
      case 'Generated':
        return 'default';
      default:
        return 'warning';
    }
  };

  return (
    <Card className="border-l-4 border-l-red-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Adverse Action Notice</h3>
            <p className="text-sm text-gray-600">
              Notice #: {notice.noticeNumber}
            </p>
            <p className="text-xs text-gray-500">
              Generated: {format(new Date(notice.generatedDate), 'PPp')}
            </p>
          </div>
        </div>
        <Badge variant={getStatusVariant()}>{notice.status}</Badge>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Reason for Decline</h4>
        <p className="text-sm text-gray-900 bg-red-50 rounded-lg p-3 font-medium">
          {notice.reasonForDecline}
        </p>
      </div>

      {notice.creditScore && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Credit Score</h4>
          <p className="text-lg font-semibold text-gray-900">
            {notice.creditScore}
          </p>
        </div>
      )}

      {notice.adverseFactors && notice.adverseFactors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Adverse Factors</h4>
          <ul className="list-disc list-inside space-y-1">
            {notice.adverseFactors.map((factor, index) => (
              <li key={index} className="text-sm text-gray-600">{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {notice.counteroffer && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-green-700 mb-2">Counteroffer</h4>
          <p className="text-sm text-green-800 bg-green-50 rounded-lg p-3">
            {notice.counteroffer}
          </p>
        </div>
      )}

      {notice.reconsiderationInstructions && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-blue-700 mb-2">Reconsideration Instructions</h4>
          <p className="text-sm text-blue-800 bg-blue-50 rounded-lg p-3">
            {notice.reconsiderationInstructions}
          </p>
        </div>
      )}

      {notice.creditBureauInfo && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Credit Bureau Information</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(notice.creditBureauInfo).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium text-gray-700">{key}:</span>{' '}
                  <span className="text-gray-600">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {notice.deliveryMethod && (
        <div className="mb-4">
          <Badge variant="info" className="text-xs">
            <Mail className="w-3 h-3 mr-1" />
            Delivery Method: {notice.deliveryMethod}
          </Badge>
          {notice.sentDate && (
            <p className="text-xs text-gray-500 mt-1">
              Sent: {format(new Date(notice.sentDate), 'PPp')}
            </p>
          )}
        </div>
      )}

      {notice.complianceLogged && (
        <div className="mb-4">
          <Badge variant="success" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Compliance Logged
          </Badge>
          {notice.complianceLogDate && (
            <p className="text-xs text-gray-500 mt-1">
              Logged: {format(new Date(notice.complianceLogDate), 'PPp')}
            </p>
          )}
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {notice.status === 'Generated' && onSend && (
            <Button variant="primary" onClick={onSend} className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Send Notice
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" onClick={onDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

