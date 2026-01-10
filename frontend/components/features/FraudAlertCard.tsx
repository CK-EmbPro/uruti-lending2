'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FraudAlert } from '@/lib/api/credit-assessment';
import { AlertTriangle, Shield, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface FraudAlertCardProps {
  alert: FraudAlert;
  onAssign?: () => void;
  onResolve?: () => void;
  showActions?: boolean;
}

export function FraudAlertCard({ alert, onAssign, onResolve, showActions = false }: FraudAlertCardProps) {
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'Critical':
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

  const getStatusIcon = () => {
    switch (alert.status) {
      case 'Resolved':
      case 'False Positive':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Confirmed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Investigating':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusVariant = (): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (alert.status) {
      case 'Resolved':
      case 'False Positive':
        return 'success';
      case 'Confirmed':
        return 'error';
      case 'Investigating':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Card className={`border-l-4 ${alert.severity === 'Critical' ? 'border-l-red-500' : alert.severity === 'High' ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getSeverityColor()}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{alert.alertType}</h3>
            <p className="text-sm text-gray-600">
              Detected: {format(new Date(alert.detectedDate), 'PPp')}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={getSeverityColor()}>{alert.severity}</Badge>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={getStatusVariant()}>{alert.status}</Badge>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700">{alert.description}</p>
      </div>

      {alert.detectedPatterns && Object.keys(alert.detectedPatterns).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Detected Patterns</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <ul className="space-y-1">
              {Object.entries(alert.detectedPatterns).map(([key, value]) => (
                <li key={key} className="text-xs text-gray-600">
                  <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {alert.investigationNotes && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Investigation Notes</h4>
          <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
            {alert.investigationNotes}
          </p>
        </div>
      )}

      {alert.resolution && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Resolution</h4>
          <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3">
            {alert.resolution}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {alert.identityVerified && (
          <Badge variant="success" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Identity Verified
          </Badge>
        )}
        {alert.reportedToLawEnforcement && (
          <Badge variant="error" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Reported to Law Enforcement
          </Badge>
        )}
      </div>

      {showActions && alert.status === 'Pending' && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {onAssign && (
            <Button variant="outline" onClick={onAssign} className="flex-1">
              Assign to Analyst
            </Button>
          )}
          {onResolve && (
            <Button variant="primary" onClick={onResolve} className="flex-1">
              Resolve Alert
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

