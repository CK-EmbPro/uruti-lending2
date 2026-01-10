'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useCreateJournalEntry } from '@/lib/hooks/useAccounting';
import { Plus, X } from 'lucide-react';
import type { CreateGlEntryDto, VoucherType } from '@/lib/api/accounting';

interface CreateJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateJournalEntryModal({
  isOpen,
  onClose,
}: CreateJournalEntryModalProps) {
  const [voucherType, setVoucherType] = useState<VoucherType>('Journal Entry');
  const [companyId, setCompanyId] = useState('');
  const [postingDate, setPostingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [valueDate, setValueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState('');
  const [referenceType, setReferenceType] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [glEntries, setGlEntries] = useState<CreateGlEntryDto[]>([
    { account: '', debit: 0, credit: 0 },
  ]);

  const createEntry = useCreateJournalEntry();

  const addGlEntry = () => {
    setGlEntries([...glEntries, { account: '', debit: 0, credit: 0 }]);
  };

  const removeGlEntry = (index: number) => {
    setGlEntries(glEntries.filter((_, i) => i !== index));
  };

  const updateGlEntry = (index: number, field: keyof CreateGlEntryDto, value: any) => {
    const updated = [...glEntries];
    updated[index] = { ...updated[index], [field]: value };
    setGlEntries(updated);
  };

  const calculateTotals = () => {
    const totalDebit = glEntries.reduce(
      (sum, entry) => sum + (Number(entry.debit) || 0),
      0
    );
    const totalCredit = glEntries.reduce(
      (sum, entry) => sum + (Number(entry.credit) || 0),
      0
    );
    return { totalDebit, totalCredit };
  };

  const isBalanced = () => {
    const { totalDebit, totalCredit } = calculateTotals();
    return Math.abs(totalDebit - totalCredit) < 0.01;
  };

  const handleSubmit = () => {
    if (!companyId) {
      alert('Please enter Company ID');
      return;
    }

    if (glEntries.length < 2) {
      alert('Please add at least 2 GL entries');
      return;
    }

    if (!isBalanced()) {
      alert('Debit and Credit totals must be equal');
      return;
    }

    const hasEmptyAccount = glEntries.some((entry) => !entry.account);
    if (hasEmptyAccount) {
      alert('Please fill in all account codes');
      return;
    }

    createEntry.mutate(
      {
        voucherType,
        companyId,
        postingDate,
        valueDate,
        glEntries: glEntries.map((entry) => ({
          ...entry,
          debit: Number(entry.debit) || 0,
          credit: Number(entry.credit) || 0,
        })),
        remarks: remarks || undefined,
        referenceType: referenceType || undefined,
        referenceId: referenceId || undefined,
        costCenter: costCenter || undefined,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setVoucherType('Journal Entry');
    setCompanyId('');
    setPostingDate(new Date().toISOString().split('T')[0]);
    setValueDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setReferenceType('');
    setReferenceId('');
    setCostCenter('');
    setGlEntries([{ account: '', debit: 0, credit: 0 }]);
    onClose();
  };

  const { totalDebit, totalCredit } = calculateTotals();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Journal Entry"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-600">Total Debit: </span>
              <span
                className={`font-medium ${
                  isBalanced() ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${totalDebit.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Total Credit: </span>
              <span
                className={`font-medium ${
                  isBalanced() ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${totalCredit.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {!isBalanced() && (
              <span className="text-xs text-red-600">
                (Difference: ${Math.abs(totalDebit - totalCredit).toFixed(2)})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isBalanced() || createEntry.isPending}
            >
              {createEntry.isPending ? 'Creating...' : 'Create Entry'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Voucher Type"
            value={voucherType}
            onChange={(e) => setVoucherType(e.target.value as VoucherType)}
            required
            options={[
              { value: 'Journal Entry', label: 'Journal Entry' },
              { value: 'Disbursement', label: 'Disbursement' },
              { value: 'Repayment', label: 'Repayment' },
              { value: 'Write Off', label: 'Write Off' },
              { value: 'Refund', label: 'Refund' },
              { value: 'Adjustment', label: 'Adjustment' },
            ]}
          />
          <Input
            label="Company ID"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
            placeholder="Enter company ID"
          />
          <Input
            label="Posting Date"
            type="date"
            value={postingDate}
            onChange={(e) => setPostingDate(e.target.value)}
            required
          />
          <Input
            label="Value Date"
            type="date"
            value={valueDate}
            onChange={(e) => setValueDate(e.target.value)}
            required
          />
          <Input
            label="Reference Type"
            value={referenceType}
            onChange={(e) => setReferenceType(e.target.value)}
            placeholder="e.g., Loan, Loan Disbursement"
          />
          <Input
            label="Reference ID"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="Enter reference ID"
          />
          <Input
            label="Cost Center"
            value={costCenter}
            onChange={(e) => setCostCenter(e.target.value)}
            placeholder="Enter cost center"
          />
        </div>

        <Textarea
          label="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter remarks (optional)"
          rows={3}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">GL Entries</h3>
            <Button variant="outline" size="sm" onClick={addGlEntry}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {glEntries.map((entry, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Entry #{index + 1}
                  </span>
                  {glEntries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGlEntry(index)}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Account Code"
                    value={entry.account}
                    onChange={(e) =>
                      updateGlEntry(index, 'account', e.target.value)
                    }
                    required
                    placeholder="ACC-001"
                  />
                  <Input
                    label="Account Name"
                    value={entry.accountName || ''}
                    onChange={(e) =>
                      updateGlEntry(index, 'accountName', e.target.value)
                    }
                    placeholder="Account Name (optional)"
                  />
                  <Input
                    label="Against Account"
                    value={entry.againstAccount || ''}
                    onChange={(e) =>
                      updateGlEntry(index, 'againstAccount', e.target.value)
                    }
                    placeholder="Against Account (optional)"
                  />
                  <Input
                    label="Party Type"
                    value={entry.partyType || ''}
                    onChange={(e) =>
                      updateGlEntry(index, 'partyType', e.target.value)
                    }
                    placeholder="e.g., Customer, Employee"
                  />
                  <Input
                    label="Party ID"
                    value={entry.party || ''}
                    onChange={(e) =>
                      updateGlEntry(index, 'party', e.target.value)
                    }
                    placeholder="Party ID (optional)"
                  />
                  <Input
                    label="Cost Center"
                    value={entry.costCenter || ''}
                    onChange={(e) =>
                      updateGlEntry(index, 'costCenter', e.target.value)
                    }
                    placeholder="Cost Center (optional)"
                  />
                  <Input
                    label="Debit Amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={entry.debit || ''}
                    onChange={(e) =>
                      updateGlEntry(index, 'debit', e.target.value)
                    }
                    placeholder="0.00"
                  />
                  <Input
                    label="Credit Amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={entry.credit || ''}
                    onChange={(e) =>
                      updateGlEntry(index, 'credit', e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="mt-3">
                  <Input
                    label="Remarks"
                    value={entry.remarks || ''}
                    onChange={(e) =>
                      updateGlEntry(index, 'remarks', e.target.value)
                    }
                    placeholder="Entry remarks (optional)"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

