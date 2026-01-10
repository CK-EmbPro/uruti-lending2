'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  openBankingApi,
  BankAccount,
  Provider,
  BankAccountType,
  CreateLinkTokenDto,
  LinkBankAccountDto,
} from '@/lib/api/open-banking';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  Building2,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface BankAccountLinkingProps {
  applicationId?: string;
  customerId?: string;
  onAccountLinked?: (account: BankAccount) => void;
}

const providerLabels: Record<Provider, string> = {
  [Provider.PLAID]: 'Plaid',
  [Provider.YODLEE]: 'Yodlee',
  [Provider.TINK]: 'Tink',
  [Provider.MANUAL]: 'Manual Entry',
};

const accountTypeLabels: Record<BankAccountType, string> = {
  [BankAccountType.CHECKING]: 'Checking',
  [BankAccountType.SAVINGS]: 'Savings',
  [BankAccountType.CREDIT_CARD]: 'Credit Card',
  [BankAccountType.INVESTMENT]: 'Investment',
  [BankAccountType.OTHER]: 'Other',
};

const statusColors: Record<string, string> = {
  CONNECTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  DISCONNECTED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  EXPIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-blue-200',
};

export function BankAccountLinking({
  applicationId,
  customerId,
  onAccountLinked,
}: BankAccountLinkingProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider>(Provider.PLAID);
  const [isLinking, setIsLinking] = useState(false);
  const queryClient = useQueryClient();

  // Fetch connected accounts
  const { data: accounts, isLoading } = useQuery<BankAccount[]>({
    queryKey: ['bankAccounts', applicationId, customerId],
    queryFn: () => openBankingApi.getConnectedAccounts(applicationId, customerId),
  });

  // Create link token mutation
  const createLinkTokenMutation = useMutation({
    mutationFn: (dto: CreateLinkTokenDto) => openBankingApi.createLinkToken(dto),
    onSuccess: async (data) => {
      // In production, this would open the provider's OAuth flow
      // For now, we'll simulate account linking
      toast.success('Link token created. Opening bank connection...');
      
      // Simulate linking (in production, this would be handled by provider SDK)
      setTimeout(() => {
        handleLinkAccount({
          provider: selectedProvider,
          applicationId,
          publicToken: data.linkToken,
          metadata: {
            institutionName: 'Mock Bank',
            accountNumber: '****1234',
            accountName: 'Primary Checking',
          },
        });
      }, 1000);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create link token');
    },
  });

  // Link account mutation
  const linkAccountMutation = useMutation({
    mutationFn: (dto: LinkBankAccountDto) => openBankingApi.linkBankAccount(dto),
    onSuccess: (account) => {
      toast.success('Bank account linked successfully!');
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      setIsLinking(false);
      if (onAccountLinked) {
        onAccountLinked(account);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to link bank account');
      setIsLinking(false);
    },
  });

  // Sync transactions mutation
  const syncTransactionsMutation = useMutation({
    mutationFn: (accountId: string) => openBankingApi.syncTransactions(accountId),
    onSuccess: (data) => {
      toast.success(`Synced ${data.count} transactions`);
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to sync transactions');
    },
  });

  // Disconnect account mutation
  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) => openBankingApi.disconnectAccount(accountId),
    onSuccess: () => {
      toast.success('Bank account disconnected');
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to disconnect account');
    },
  });

  const handleCreateLinkToken = () => {
    setIsLinking(true);
    createLinkTokenMutation.mutate({
      applicationId,
      provider: selectedProvider,
    });
  };

  const handleLinkAccount = (dto: LinkBankAccountDto) => {
    linkAccountMutation.mutate(dto);
  };

  const handleSync = (accountId: string) => {
    syncTransactionsMutation.mutate(accountId);
  };

  const handleDisconnect = (accountId: string) => {
    if (window.confirm('Are you sure you want to disconnect this bank account?')) {
      disconnectMutation.mutate(accountId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Link New Account */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Link Bank Account
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider
            </label>
            <Select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as Provider)}
              disabled={isLinking}
            >
              {Object.entries(providerLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={handleCreateLinkToken}
            disabled={isLinking}
            className="w-full"
          >
            {isLinking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Connect Bank Account
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Connected Accounts
        </h3>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {account.accountType === BankAccountType.CHECKING ? (
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Wallet className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {account.accountName || account.institutionName || 'Bank Account'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {account.institutionName} • {accountTypeLabels[account.accountType]}
                          {account.accountNumber && ` • ${account.accountNumber}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={statusColors[account.status] || ''}>
                        {account.status}
                      </Badge>
                      {account.isPrimary && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Primary
                        </Badge>
                      )}
                      {account.lastSyncedAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Last synced: {format(new Date(account.lastSyncedAt), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.status === 'CONNECTED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(account.id)}
                        disabled={syncTransactionsMutation.isPending}
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${syncTransactionsMutation.isPending ? 'animate-spin' : ''}`}
                        />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(account.id)}
                      disabled={disconnectMutation.isPending}
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No bank accounts connected</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Link a bank account to enable income verification and cash flow analysis
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

