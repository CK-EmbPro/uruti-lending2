'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Settings,
  FileText,
  DollarSign,
  Shield,
  Package,
  Code,
  Receipt,
} from 'lucide-react';
import { UserAccountManagementDashboard } from '@/components/features/UserAccountManagementDashboard';
import { ProductConfigurationDashboard } from '@/components/features/ProductConfigurationDashboard';
import { LoanProductManagement } from '@/components/features/LoanProductManagement';
import { BusinessRulesDashboard } from '@/components/features/BusinessRulesDashboard';
import { FeeScheduleDashboard } from '@/components/features/FeeScheduleDashboard';
import { RolePermissionManagementDashboard } from '@/components/features/RolePermissionManagementDashboard';

export default function AdministrationPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'products' | 'loanProducts' | 'rules' | 'fees' | 'roles'>('users');

  const tabs = [
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'products', label: 'Product Config', icon: Package },
    { id: 'loanProducts', label: 'Loan Products', icon: DollarSign },
    { id: 'rules', label: 'Business Rules', icon: Code },
    { id: 'fees', label: 'Fee Schedules', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-600 mt-1">Manage users, products, business rules, and fee schedules</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('users')}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">User Accounts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">UC-051</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('roles')}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Roles & Permissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">RBAC</p>
              </div>
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('products')}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Product Config</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">UC-052</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('loanProducts')}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Loan Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">Config</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('rules')}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Business Rules</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">UC-053</p>
              </div>
              <Code className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('fees')}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fee Schedules</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">UC-054</p>
              </div>
              <Receipt className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && <UserAccountManagementDashboard />}
        {activeTab === 'roles' && <RolePermissionManagementDashboard />}
        {activeTab === 'products' && <ProductConfigurationDashboard />}
        {activeTab === 'loanProducts' && <LoanProductManagement />}
        {activeTab === 'rules' && <BusinessRulesDashboard />}
        {activeTab === 'fees' && <FeeScheduleDashboard />}
      </div>
    </div>
  );
}

