'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { KYCScreeningDashboard } from '@/components/features/KYCScreeningDashboard';
import { PrivacyConsentDashboard } from '@/components/features/PrivacyConsentDashboard';
import { AuditTrailDashboard } from '@/components/features/AuditTrailDashboard';
import { DocumentRetentionDashboard } from '@/components/features/DocumentRetentionDashboard';
import { RegTechDashboard } from '@/components/features/RegTechDashboard';
import {
  Shield,
  Lock,
  FileSearch,
  Archive,
  BarChart3,
} from 'lucide-react';

type ComplianceTab = 'overview' | 'kyc-screening' | 'privacy' | 'audit' | 'retention' | 'regtech';

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('overview');

  const tabs = [
    { id: 'overview' as ComplianceTab, name: 'Overview', icon: Shield },
    { id: 'kyc-screening' as ComplianceTab, name: 'KYC/AML Screening', icon: Shield },
    { id: 'privacy' as ComplianceTab, name: 'Privacy & Consent', icon: Lock },
    { id: 'audit' as ComplianceTab, name: 'Audit Trail', icon: FileSearch },
    { id: 'retention' as ComplianceTab, name: 'Document Retention', icon: Archive },
    { id: 'regtech' as ComplianceTab, name: 'RegTech Automation', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('kyc-screening')}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-10 h-10 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">KYC/AML Screening</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Screen applications against OFAC, sanctions lists, and PEP databases
                    </p>
                    <div className="text-sm text-blue-600 font-medium">View Dashboard →</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('privacy')}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Lock className="w-10 h-10 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy & Consent</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage privacy consents and handle GDPR/CCPA requests
                    </p>
                    <div className="text-sm text-blue-600 font-medium">View Dashboard →</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('audit')}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <FileSearch className="w-10 h-10 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit Trail</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Review comprehensive audit logs and user activity
                    </p>
                    <div className="text-sm text-blue-600 font-medium">View Dashboard →</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('retention')}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Archive className="w-10 h-10 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Retention</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage document retention periods and legal holds
                    </p>
                    <div className="text-sm text-blue-600 font-medium">View Dashboard →</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'kyc-screening' && <KYCScreeningDashboard />}
        {activeTab === 'privacy' && <PrivacyConsentDashboard />}
        {activeTab === 'audit' && <AuditTrailDashboard />}
        {activeTab === 'retention' && <DocumentRetentionDashboard />}
        {activeTab === 'regtech' && <RegTechDashboard />}
      </div>
    </div>
  );
}

