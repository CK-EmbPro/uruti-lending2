'use client';

import { useEffect, useState } from 'react';
import { integrationAdminApi, CreatePlatformDto, UpdatePlatformDto, ThirdPartyPlatform } from '@/lib/api/integration-admin';
import toast from 'react-hot-toast';
import { X, Save, CheckCircle } from 'lucide-react';

interface PlatformModalProps {
  platform: ThirdPartyPlatform | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper functions for validation
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export function PlatformModal({ platform, onClose, onSuccess }: PlatformModalProps) {
  const isEditing = !!platform;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePlatformDto>({
    platformCode: '',
    platformName: '',
    description: '',
    status: 'Active',
    webhookUrl: '',
    canCreateCustomers: true,
    canCreateApplications: true,
    canPostRepayments: true,
    canQueryLoanStatus: true,
    rateLimitPerMinute: 1000,
    contactEmail: '',
    contactPhone: '',
  });

  useEffect(() => {
    if (platform) {
      setFormData({
        platformName: platform.platformName,
        description: platform.description || '',
        status: platform.status,
        webhookUrl: platform.webhookUrl || '',
        webhookSecret: platform.webhookSecret || '',
        canCreateCustomers: platform.canCreateCustomers,
        canCreateApplications: platform.canCreateApplications,
        canPostRepayments: platform.canPostRepayments,
        canQueryLoanStatus: platform.canQueryLoanStatus,
        rateLimitPerMinute: platform.rateLimitPerMinute,
        contactEmail: platform.contactEmail || '',
        contactPhone: platform.contactPhone || '',
      });
    }
  }, [platform]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!isEditing && !formData.platformCode?.trim()) {
        toast.error('Platform Code is required');
        setIsLoading(false);
        return;
      }

      if (!formData.platformName?.trim()) {
        toast.error('Platform Name is required');
        setIsLoading(false);
        return;
      }

      // Validate webhook URL format if provided
      if (formData.webhookUrl?.trim() && !isValidUrl(formData.webhookUrl.trim())) {
        toast.error('Webhook URL must be a valid URL');
        setIsLoading(false);
        return;
      }

      // Validate email format if provided
      if (formData.contactEmail?.trim() && !isValidEmail(formData.contactEmail.trim())) {
        toast.error('Contact Email must be a valid email address');
        setIsLoading(false);
        return;
      }

      // Clean up form data: remove empty strings for optional fields
      const cleanedData = { ...formData };
      
      // Remove empty strings for optional fields (convert to undefined)
      if (!cleanedData.description?.trim()) cleanedData.description = undefined;
      if (!cleanedData.webhookUrl?.trim()) cleanedData.webhookUrl = undefined;
      if (!cleanedData.webhookSecret?.trim()) cleanedData.webhookSecret = undefined;
      if (!cleanedData.contactEmail?.trim()) cleanedData.contactEmail = undefined;
      if (!cleanedData.contactPhone?.trim()) cleanedData.contactPhone = undefined;

      if (isEditing) {
        await integrationAdminApi.updatePlatform(platform!.id, cleanedData as UpdatePlatformDto);
        toast.success('Platform updated successfully');
      } else {
        await integrationAdminApi.createPlatform(cleanedData);
        toast.success('Platform created successfully');
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.join(', ') ||
                          error.message ||
                          `Failed to ${isEditing ? 'update' : 'create'} platform`;
      toast.error(errorMessage);
      console.error('Platform operation error:', error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Platform' : 'Create New Platform'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.platformCode}
                onChange={(e) => setFormData({ ...formData, platformCode: e.target.value.toUpperCase() })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="URUTIX"
                pattern="[A-Z0-9_-]+"
                title="Only uppercase letters, numbers, hyphens, and underscores"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Unique identifier (uppercase letters, numbers, hyphens, underscores only)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Platform Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.platformName}
              onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="UrutiX Platform"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Platform description and purpose..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="https://platform.com/webhooks/lending"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              URL where webhook notifications will be sent
            </p>
          </div>

          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Webhook Secret
              </label>
              <input
                type="text"
                value={formData.webhookSecret || ''}
                onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Leave empty to keep current secret"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Secret for webhook signature verification (leave empty to keep current)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permissions
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.canCreateCustomers}
                  onChange={(e) => setFormData({ ...formData, canCreateCustomers: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Can Create Customers</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.canCreateApplications}
                  onChange={(e) => setFormData({ ...formData, canCreateApplications: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Can Create Loan Applications</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.canPostRepayments}
                  onChange={(e) => setFormData({ ...formData, canPostRepayments: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Can Post Repayments</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.canQueryLoanStatus}
                  onChange={(e) => setFormData({ ...formData, canQueryLoanStatus: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Can Query Loan Status</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rate Limit (per minute)
            </label>
            <input
              type="number"
              value={formData.rateLimitPerMinute}
              onChange={(e) => setFormData({ ...formData, rateLimitPerMinute: parseInt(e.target.value) || 1000 })}
              min={1}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="contact@platform.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Platform' : 'Create Platform')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

