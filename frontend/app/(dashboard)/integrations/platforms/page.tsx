'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { integrationAdminApi, ThirdPartyPlatform } from '@/lib/api/integration-admin';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Key,
  Webhook,
  Eye,
  EyeOff,
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { PlatformModal } from '@/components/admin/PlatformModal';
import { useAuth } from '@/contexts/AuthContext';

export default function IntegrationPlatformsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<ThirdPartyPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<ThirdPartyPlatform | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<ThirdPartyPlatform | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [statistics, setStatistics] = useState<Record<string, any>>({});

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setIsLoading(true);
      const data = await integrationAdminApi.getAllPlatforms();
      setPlatforms(data);
      
      // Load statistics for each platform
      const statsPromises = data.map(async (platform) => {
        try {
          const stats = await integrationAdminApi.getPlatformStatistics(platform.id);
          return { [platform.id]: stats };
        } catch (error) {
          return { [platform.id]: null };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap = Object.assign({}, ...statsResults);
      setStatistics(statsMap);
    } catch (error: any) {
      toast.error('Failed to load platforms');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlatform(null);
    setIsModalOpen(true);
  };

  const handleEdit = (platform: ThirdPartyPlatform) => {
    setEditingPlatform(platform);
    setIsModalOpen(true);
  };

  const handleDelete = async (platform: ThirdPartyPlatform) => {
    if (!confirm(`Are you sure you want to delete platform "${platform.platformName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await integrationAdminApi.deletePlatform(platform.id);
      toast.success('Platform deleted successfully');
      loadPlatforms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete platform');
    }
  };

  const handleRegenerateApiKey = async (platform: ThirdPartyPlatform) => {
    if (!confirm('Are you sure you want to regenerate the API key? The old key will no longer work.')) {
      return;
    }

    try {
      const result = await integrationAdminApi.regenerateApiKey(platform.id);
      toast.success('API key regenerated successfully');
      
      // Update platform with new key
      const updated = await integrationAdminApi.getPlatformById(platform.id);
      setPlatforms((prev) => prev.map((p) => (p.id === platform.id ? updated : p)));
      
      // Show new credentials
      alert(`New API Key: ${result.apiKey}\nNew API Secret: ${result.apiSecret}\n\nPlease save these credentials securely!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to regenerate API key');
    }
  };

  const handleRegenerateWebhookSecret = async (platform: ThirdPartyPlatform) => {
    if (!confirm('Are you sure you want to regenerate the webhook secret? The old secret will no longer work.')) {
      return;
    }

    try {
      const result = await integrationAdminApi.regenerateWebhookSecret(platform.id);
      toast.success('Webhook secret regenerated successfully');
      
      // Update platform
      const updated = await integrationAdminApi.getPlatformById(platform.id);
      setPlatforms((prev) => prev.map((p) => (p.id === platform.id ? updated : p)));
      
      alert(`New Webhook Secret: ${result.webhookSecret}\n\nPlease update your webhook endpoint with this new secret!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to regenerate webhook secret');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleSecret = (platformId: string, field: 'apiKey' | 'apiSecret' | 'webhookSecret') => {
    setShowSecrets((prev) => ({
      ...prev,
      [`${platformId}-${field}`]: !prev[`${platformId}-${field}`],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            <XCircle className="w-3 h-3" />
            Inactive
          </span>
        );
      case 'Suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertCircle className="w-3 h-3" />
            Suspended
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading platforms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Third-Party Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage external platform integrations like Trip Financing</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Platform
        </button>
      </div>

      {platforms.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No platforms configured</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by adding your first third-party integration platform
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Platform
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {platforms.map((platform) => {
            const stats = statistics[platform.id];
            return (
              <div
                key={platform.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {platform.platformName}
                        </h3>
                        {getStatusBadge(platform.status)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Code: <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{platform.platformCode}</code>
                      </p>
                      {platform.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{platform.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(platform)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit platform"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(platform)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete platform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Statistics */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Applications</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stats.totalApplications} ({stats.activeApplications} active)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Repayments</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stats.totalRepayments} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRepaymentAmount)})
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Permissions */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {platform.canCreateCustomers && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                          Create Customers
                        </span>
                      )}
                      {platform.canCreateApplications && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          Create Applications
                        </span>
                      )}
                      {platform.canPostRepayments && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                          Post Repayments
                        </span>
                      )}
                      {platform.canQueryLoanStatus && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                          Query Status
                        </span>
                      )}
                    </div>
                  </div>

                  {/* API Credentials */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono truncate">
                          {showSecrets[`${platform.id}-apiKey`] ? platform.apiKey : '•'.repeat(64)}
                        </code>
                        <button
                          onClick={() => toggleSecret(platform.id, 'apiKey')}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {showSecrets[`${platform.id}-apiKey`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(platform.apiKey, 'API Key')}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRegenerateApiKey(platform)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Regenerate API Key"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {platform.webhookUrl && (
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Webhook URL
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono truncate">
                            {platform.webhookUrl}
                          </code>
                          <a
                            href={platform.webhookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {platform.webhookSecret && (
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Webhook Secret
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono truncate">
                            {showSecrets[`${platform.id}-webhookSecret`] ? platform.webhookSecret : '•'.repeat(64)}
                          </code>
                          <button
                            onClick={() => toggleSecret(platform.id, 'webhookSecret')}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {showSecrets[`${platform.id}-webhookSecret`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(platform.webhookSecret!, 'Webhook Secret')}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRegenerateWebhookSecret(platform)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Regenerate Webhook Secret"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  {(platform.contactEmail || platform.contactPhone) && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {platform.contactEmail && <p>Email: {platform.contactEmail}</p>}
                      {platform.contactPhone && <p>Phone: {platform.contactPhone}</p>}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <p>Created: {format(new Date(platform.createdAt), 'MMM d, yyyy')}</p>
                    {platform.updatedAt && (
                      <p>Updated: {format(new Date(platform.updatedAt), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <PlatformModal
          platform={editingPlatform}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPlatform(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingPlatform(null);
            loadPlatforms();
          }}
        />
      )}
    </div>
  );
}

