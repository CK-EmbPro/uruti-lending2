'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PortfolioPerformanceDashboard } from '@/components/features/PortfolioPerformanceDashboard';
import { ReportDesigner } from '@/components/features/ReportDesigner';
import { QRCodeGenerator } from '@/components/features/QRCodeGenerator';
import { FileText, TrendingUp, AlertCircle, DollarSign, BarChart3, Scale, Shield, Palette, QrCode } from 'lucide-react';

type ReportTab = 'portfolio-performance' | 'regulatory' | 'roll-rate' | 'fair-lending' | 'standard' | 'designer' | 'qrcode';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('portfolio-performance');

  const tabs = [
    { id: 'portfolio-performance' as ReportTab, name: 'Portfolio Performance', icon: BarChart3 },
    { id: 'regulatory' as ReportTab, name: 'Regulatory Reports', icon: Shield },
    { id: 'roll-rate' as ReportTab, name: 'Roll Rate Analysis', icon: TrendingUp },
    { id: 'fair-lending' as ReportTab, name: 'Fair Lending', icon: Scale },
    { id: 'standard' as ReportTab, name: 'Standard Reports', icon: FileText },
    { id: 'designer' as ReportTab, name: 'Report Designer', icon: Palette },
    { id: 'qrcode' as ReportTab, name: 'QR Code Generator', icon: QrCode },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
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
        {activeTab === 'portfolio-performance' && (
          <PortfolioPerformanceDashboard />
        )}

        {activeTab === 'regulatory' && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Regulatory Reports</h2>
              <p className="text-gray-600">Regulatory report generation coming soon...</p>
            </div>
          </Card>
        )}

        {activeTab === 'roll-rate' && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Roll Rate Analysis</h2>
              <p className="text-gray-600">Roll rate analysis coming soon...</p>
            </div>
          </Card>
        )}

        {activeTab === 'fair-lending' && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Fair Lending Analysis</h2>
              <p className="text-gray-600">Fair lending analysis coming soon...</p>
            </div>
          </Card>
        )}

        {activeTab === 'standard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Portfolio Report</h3>
                  <p className="text-sm text-gray-600 mb-4">Overview of all loans in the portfolio</p>
                  <Button variant="outline" size="sm">View Report</Button>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">NPA Report</h3>
                  <p className="text-sm text-gray-600 mb-4">Non-performing assets analysis</p>
                  <Button variant="outline" size="sm">View Report</Button>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <DollarSign className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Collection Report</h3>
                  <p className="text-sm text-gray-600 mb-4">Loan collection and repayment analysis</p>
                  <Button variant="outline" size="sm">View Report</Button>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <TrendingUp className="w-8 h-8 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Disbursement Report</h3>
                  <p className="text-sm text-gray-600 mb-4">Loan disbursement trends and analysis</p>
                  <Button variant="outline" size="sm">View Report</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'designer' && <ReportDesigner />}

        {activeTab === 'qrcode' && <QRCodeGenerator />}
      </div>
    </div>
  );
}

