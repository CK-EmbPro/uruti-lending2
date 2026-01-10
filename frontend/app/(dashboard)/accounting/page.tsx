'use client';

import { useState } from 'react';
import { JournalEntryList } from '@/components/features/JournalEntryList';
import { JournalEntryDetail } from '@/components/features/JournalEntryDetail';
import { CreateJournalEntryModal } from '@/components/features/CreateJournalEntryModal';
import { ChartOfAccounts } from '@/components/features/ChartOfAccounts';
import type { JournalEntry } from '@/lib/api/accounting';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<'journal' | 'accounts'>('journal');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companyId, setCompanyId] = useState('default-company-id'); // TODO: Get from context

  const handleViewDetail = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEntry(null);
  };

  if (viewMode === 'detail' && selectedEntry && activeTab === 'journal') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBackToList}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <JournalEntryDetail entryId={selectedEntry.id} onClose={handleBackToList} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('journal');
              setViewMode('list');
            }}
            className={`${
              activeTab === 'journal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <FileText className="w-4 h-4" />
            Journal Entries
          </button>
          <button
            onClick={() => {
              setActiveTab('accounts');
              setViewMode('list');
            }}
            className={`${
              activeTab === 'accounts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <BookOpen className="w-4 h-4" />
            Chart of Accounts
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'journal' ? (
        <>
          <JournalEntryList
            onViewDetail={handleViewDetail}
            onCreateNew={() => setShowCreateModal(true)}
          />
          <CreateJournalEntryModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        </>
      ) : (
        <ChartOfAccounts companyId={companyId} />
      )}
    </div>
  );
}

