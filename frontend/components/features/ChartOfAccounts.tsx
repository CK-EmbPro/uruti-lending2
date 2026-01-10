'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  useAccounts,
  useAccountTree,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/lib/hooks/useAccounting';
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  DollarSign,
} from 'lucide-react';
import type { Account, AccountType, RootType, CreateAccountDto } from '@/lib/api/accounting';

interface ChartOfAccountsProps {
  companyId: string;
}

export function ChartOfAccounts({ companyId }: ChartOfAccountsProps) {
  const [selectedRootType, setSelectedRootType] = useState<RootType | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form state
  const [accountCode, setAccountCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Asset');
  const [rootType, setRootType] = useState<RootType>('Asset');
  const [parentAccountId, setParentAccountId] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [description, setDescription] = useState('');

  const { data: accounts, isLoading } = useAccountTree(
    companyId,
    selectedRootType || undefined
  );
  const { data: allAccounts } = useAccounts({ companyId });
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const handleCreate = () => {
    if (!accountCode || !accountName) {
      alert('Please fill in account code and name');
      return;
    }

    const createDto: CreateAccountDto = {
      accountCode,
      accountName,
      accountType: accountType as AccountType,
      rootType: rootType as RootType,
      companyId,
      parentAccountId: parentAccountId || undefined,
      isGroup,
      openingBalance: openingBalance ? Number(openingBalance) : undefined,
      description: description || undefined,
    };

    createAccount.mutate(createDto, {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
      },
    });
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setAccountName(account.accountName);
    setDescription(account.description || '');
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!editingAccount) return;

    updateAccount.mutate(
      {
        id: editingAccount.id,
        dto: {
          accountName,
          description: description || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditingAccount(null);
          resetForm();
        },
      }
    );
  };

  const handleDelete = (account: Account) => {
    if (confirm(`Are you sure you want to delete account ${account.accountCode}?`)) {
      deleteAccount.mutate(account.id);
    }
  };

  const resetForm = () => {
    setAccountCode('');
    setAccountName('');
    setAccountType('Asset');
    setRootType('Asset');
    setParentAccountId('');
    setIsGroup(false);
    setOpeningBalance('');
    setDescription('');
  };

  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case 'Asset':
        return 'text-blue-600';
      case 'Liability':
        return 'text-red-600';
      case 'Income':
        return 'text-green-600';
      case 'Expense':
        return 'text-orange-600';
      case 'Equity':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderAccountTree = (accountList: Account[], level: number = 0) => {
    return accountList.map((account) => {
      const hasChildren = account.childAccounts && account.childAccounts.length > 0;
      const isExpanded = expandedAccounts.has(account.id);
      const indent = level * 24;

      return (
        <div key={account.id}>
          <div
            className={`flex items-center py-2 px-4 hover:bg-gray-50 border-b border-gray-100`}
            style={{ paddingLeft: `${16 + indent}px` }}
          >
            <div className="flex items-center flex-1">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(account.id)}
                  className="mr-2 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-6 mr-2" />
              )}
              <div className="flex items-center mr-3">
                {account.isGroup ? (
                  isExpanded ? (
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Folder className="w-5 h-5 text-blue-500" />
                  )
                ) : (
                  <DollarSign className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{account.accountCode}</span>
                  <span className="text-gray-700">{account.accountName}</span>
                  <Badge variant="info" className={getAccountTypeColor(account.accountType)}>
                    {account.accountType}
                  </Badge>
                  {account.isGroup && (
                    <Badge variant="default">Group</Badge>
                  )}
                  {!account.isActive && (
                    <Badge variant="error">Inactive</Badge>
                  )}
                  {account.isFrozen && (
                    <Badge variant="warning">Frozen</Badge>
                  )}
                </div>
                {account.description && (
                  <div className="text-sm text-gray-500 mt-1">{account.description}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Balance: ${account.openingBalance.toLocaleString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(account)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(account)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>
              {renderAccountTree(account.childAccounts || [], level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chart of Accounts</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your company's chart of accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedRootType}
            onChange={(e) => setSelectedRootType(e.target.value as RootType || '')}
            className="w-48"
            options={[
              { value: '', label: 'All Types' },
              { value: 'Asset', label: 'Assets' },
              { value: 'Liability', label: 'Liabilities' },
              { value: 'Income', label: 'Income' },
              { value: 'Expense', label: 'Expenses' },
              { value: 'Equity', label: 'Equity' },
            ]}
          />
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No accounts found</p>
          <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Account
          </Button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {renderAccountTree(accounts)}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Account"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createAccount.isPending}>
              {createAccount.isPending ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Account Code"
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value)}
              required
              placeholder="ACC-001"
            />
            <Input
              label="Account Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              placeholder="Loan Account"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Account Type"
              value={accountType}
              onChange={(e) => {
                const type = e.target.value as AccountType;
                setAccountType(type);
                setRootType(type as RootType);
              }}
              required
              options={[
                { value: 'Asset', label: 'Asset' },
                { value: 'Liability', label: 'Liability' },
                { value: 'Income', label: 'Income' },
                { value: 'Expense', label: 'Expense' },
                { value: 'Equity', label: 'Equity' },
              ]}
            />
            <Select
              label="Root Type"
              value={rootType}
              onChange={(e) => setRootType(e.target.value as RootType)}
              required
              options={[
                { value: 'Asset', label: 'Asset' },
                { value: 'Liability', label: 'Liability' },
                { value: 'Income', label: 'Income' },
                { value: 'Expense', label: 'Expense' },
                { value: 'Equity', label: 'Equity' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Parent Account"
              value={parentAccountId}
              onChange={(e) => setParentAccountId(e.target.value)}
              options={[
                { value: '', label: 'None (Root Account)' },
                ...(allAccounts?.filter((a) => a.isGroup && a.isActive) || []).map((acc) => ({
                  value: acc.id,
                  label: `${acc.accountCode} - ${acc.accountName}`,
                })),
              ]}
            />
            <div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="isGroup"
                checked={isGroup}
                onChange={(e) => setIsGroup(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="isGroup" className="text-sm font-medium text-gray-700">
                Is Group Account
              </label>
            </div>
          </div>
          <Input
            label="Opening Balance"
            type="number"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="0.00"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Account description (optional)"
            rows={3}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAccount(null);
          resetForm();
        }}
        title="Edit Account"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingAccount(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateAccount.isPending}>
              {updateAccount.isPending ? 'Updating...' : 'Update Account'}
            </Button>
          </div>
        }
      >
        {editingAccount && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Code</p>
              <p className="font-medium">{editingAccount.accountCode}</p>
            </div>
            <Input
              label="Account Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Account description (optional)"
              rows={3}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
}

