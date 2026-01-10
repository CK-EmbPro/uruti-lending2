'use client';

import React, { useState } from 'react';
import { useUserPreferences, useBulkUpdatePreferences } from '@/lib/hooks/useNotifications';
import { NotificationChannel, NotificationType } from '@/lib/api/notifications';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Bell, Mail, MessageSquare, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationPreferencesProps {
  userId: string;
}

const notificationTypes: NotificationType[] = [
  NotificationType.APPLICATION_SUBMITTED,
  NotificationType.APPLICATION_APPROVED,
  NotificationType.APPLICATION_REJECTED,
  NotificationType.LOAN_DISBURSED,
  NotificationType.LOAN_OVERDUE,
  NotificationType.PAYMENT_DUE,
  NotificationType.PAYMENT_REMINDER,
  NotificationType.PAYMENT_RECEIVED,
  NotificationType.DELINQUENCY_NOTICE,
  NotificationType.COLLECTION_NOTICE,
];

const channels: NotificationChannel[] = [
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
  NotificationChannel.IN_APP,
];

const channelIcons = {
  [NotificationChannel.EMAIL]: Mail,
  [NotificationChannel.SMS]: MessageSquare,
  [NotificationChannel.PUSH]: Smartphone,
  [NotificationChannel.IN_APP]: Bell,
};

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const { data: preferences = [], isLoading } = useUserPreferences(userId);
  const bulkUpdate = useBulkUpdatePreferences();
  const [localPreferences, setLocalPreferences] = useState<Record<string, boolean>>({});

  // Initialize local preferences from API data
  React.useEffect(() => {
    if (preferences.length > 0) {
      const prefs: Record<string, boolean> = {};
      preferences.forEach((pref) => {
        const key = `${pref.notificationType || 'GLOBAL'}_${pref.channel}`;
        prefs[key] = pref.enabled;
      });
      setLocalPreferences(prefs);
    }
  }, [preferences]);

  const isEnabled = (notificationType: NotificationType | 'GLOBAL', channel: NotificationChannel): boolean => {
    const key = `${notificationType}_${channel}`;
    if (key in localPreferences) {
      return localPreferences[key];
    }
    // Default: check if there's a preference, otherwise default to true
    const pref = preferences.find(
      (p) =>
        (p.notificationType === notificationType || (!p.notificationType && notificationType === 'GLOBAL')) &&
        p.channel === channel,
    );
    return pref ? pref.enabled : true;
  };

  const togglePreference = (notificationType: NotificationType | 'GLOBAL', channel: NotificationChannel) => {
    const key = `${notificationType}_${channel}`;
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: !isEnabled(notificationType, channel),
    }));
  };

  const handleSave = async () => {
    const updates: Array<{ notificationType?: string | null; channel: string; enabled: boolean }> = [];

    // Add global preferences
    channels.forEach((channel) => {
      updates.push({
        notificationType: null,
        channel,
        enabled: isEnabled('GLOBAL', channel),
      });
    });

    // Add type-specific preferences
    notificationTypes.forEach((type) => {
      channels.forEach((channel) => {
        updates.push({
          notificationType: type,
          channel,
          enabled: isEnabled(type, channel),
        });
      });
    });

    try {
      await bulkUpdate.mutateAsync({ userId, preferences: updates });
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose how you want to receive notifications
            </p>
          </div>
          <Button onClick={handleSave} disabled={bulkUpdate.isPending}>
            {bulkUpdate.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>

        {/* Global Preferences */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Default Channels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map((channel) => {
              const Icon = channelIcons[channel];
              const enabled = isEnabled('GLOBAL', channel);

              return (
                <div
                  key={channel}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{channel}</p>
                      <p className="text-xs text-gray-500">Default for all notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePreference('GLOBAL', channel)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type-Specific Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Notification Types</h3>
          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-900">{type}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {channels.map((channel) => {
                    const Icon = channelIcons[channel];
                    const enabled = isEnabled(type, channel);

                    return (
                      <div
                        key={channel}
                        className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50"
                      >
                        <Icon className="w-4 h-4 text-gray-600" />
                        <button
                          onClick={() => togglePreference(type, channel)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            enabled ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              enabled ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

