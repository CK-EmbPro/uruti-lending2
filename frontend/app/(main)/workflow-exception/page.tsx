'use client';

import { useState } from 'react';
import { TaskManagementDashboard } from '@/components/features/TaskManagementDashboard';
import { SLATrackingDashboard } from '@/components/features/SLATrackingDashboard';
import { BulkOperationsDashboard } from '@/components/features/BulkOperationsDashboard';

export default function WorkflowExceptionPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'sla' | 'bulk'>('tasks');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow & Exception Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage tasks, SLA tracking, and bulk operations
          </p>
        </div>
      </div>

      <div className="flex rounded-lg border border-gray-300 p-1 bg-white">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sla'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          SLA Tracking
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'bulk'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Bulk Operations
        </button>
      </div>

      <div>
        {activeTab === 'tasks' && <TaskManagementDashboard />}
        {activeTab === 'sla' && <SLATrackingDashboard />}
        {activeTab === 'bulk' && <BulkOperationsDashboard />}
      </div>
    </div>
  );
}

