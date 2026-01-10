'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ConcentrationRiskDashboard } from '@/components/features/ConcentrationRiskDashboard';
import { StressTestingDashboard } from '@/components/features/StressTestingDashboard';
import { EarlyWarningSignalsDashboard } from '@/components/features/EarlyWarningSignalsDashboard';
import {
  AlertTriangle,
  TrendingDown,
  Shield,
  BarChart3,
} from 'lucide-react';

type RiskTab = 'concentration' | 'stress-testing' | 'early-warning' | 'overview';

export default function RiskManagementPage() {
  const [activeTab, setActiveTab] = useState<RiskTab>('overview');

  const tabs = [
    { id: 'overview' as RiskTab, name: 'Overview', icon: BarChart3 },
    { id: 'concentration' as RiskTab, name: 'Concentration Risk', icon: AlertTriangle },
    { id: 'stress-testing' as RiskTab, name: 'Stress Testing', icon: TrendingDown },
    { id: 'early-warning' as RiskTab, name: 'Early Warning Signals', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Risk Management</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('concentration')}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-10 h-10 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Concentration Risk</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Monitor portfolio concentration by geography, industry, product, or customer segment
                    </p>
                    <div className="text-sm text-blue-600 font-medium">View Dashboard →</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('stress-testing')}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <TrendingDown className="w-10 h-10 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Stress Testing</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Run stress scenarios to evaluate portfolio resilience and capital adequacy
                    </p>
                    <div className="text-sm text-blue-600 font-medium">View Dashboard →</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('early-warning')}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-10 h-10 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Early Warning Signals</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Monitor accounts for risk signals and payment pattern changes
                    </p>
                    <div className="text-sm text-blue-600 font-medium">View Dashboard →</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'concentration' && <ConcentrationRiskDashboard />}
        {activeTab === 'stress-testing' && <StressTestingDashboard />}
        {activeTab === 'early-warning' && <EarlyWarningSignalsDashboard />}
      </div>
    </div>
  );
}

