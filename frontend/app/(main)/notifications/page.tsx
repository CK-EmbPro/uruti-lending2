'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserNotifications, useMarkAsRead } from '@/lib/hooks/useNotifications';
import { NotificationLog, NotificationStatus, NotificationType } from '@/lib/api/notifications';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NotificationPreferences } from '@/components/features/NotificationPreferences';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'preferences'>('all');
  const [filterType, setFilterType] = useState<NotificationType | ''>('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useUserNotifications(user?.id || '', limit, page * limit);
  const markAsRead = useMarkAsRead();

  const notifications = data?.notifications || [];
  const total = data?.total || 0;

  const filteredNotifications =
    filterType && filterType !== ''
      ? notifications.filter((n) => n.notificationType === filterType)
      : notifications;

  const unreadNotifications = filteredNotifications.filter(
    (n) => n.status !== NotificationStatus.READ && n.channel === 'In-App',
  );

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    for (const notification of unreadNotifications) {
      await markAsRead.mutateAsync(notification.id);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    if (type.includes('Payment')) return CheckCircle;
    if (type.includes('Loan') && type.includes('Disbursed')) return CheckCircle;
    if (type.includes('Loan') && type.includes('Overdue')) return AlertCircle;
    if (type.includes('Application') && type.includes('Approved')) return CheckCircle;
    if (type.includes('Application') && type.includes('Rejected')) return XCircle;
    if (type.includes('Collection') || type.includes('Delinquency')) return AlertCircle;
    return Info;
  };

  const getNotificationColor = (type: NotificationType) => {
    if (type.includes('Payment') && type.includes('Received')) return 'text-green-600';
    if (type.includes('Loan') && type.includes('Disbursed')) return 'text-green-600';
    if (type.includes('Application') && type.includes('Approved')) return 'text-green-600';
    if (type.includes('Application') && type.includes('Rejected')) return 'text-red-600';
    if (type.includes('Loan') && type.includes('Overdue')) return 'text-red-600';
    if (type.includes('Collection') || type.includes('Delinquency')) return 'text-orange-600';
    return 'text-blue-600';
  };

  if (!user) {
    return <div>Please log in to view notifications</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Manage your notifications and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Bell className="w-4 h-4" />
            All Notifications
            {unreadNotifications.length > 0 && (
              <Badge className="bg-blue-100 text-blue-800">{unreadNotifications.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`${
              activeTab === 'unread'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <AlertCircle className="w-4 h-4" />
            Unread
            {unreadNotifications.length > 0 && (
              <Badge className="bg-red-100 text-red-800">{unreadNotifications.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Bell className="w-4 h-4" />
            Preferences
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'preferences' ? (
        <NotificationPreferences userId={user.id} />
      ) : (
        <>
          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as NotificationType | '')}
                className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {Object.values(NotificationType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            {unreadNotifications.length > 0 && activeTab === 'all' && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <Card className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (activeTab === 'unread' ? unreadNotifications : filteredNotifications).length ===
              0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {activeTab === 'unread'
                    ? 'No unread notifications'
                    : 'No notifications found'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(activeTab === 'unread' ? unreadNotifications : filteredNotifications).map(
                  (notification) => {
                    const Icon = getNotificationIcon(notification.notificationType);
                    const colorClass = getNotificationColor(notification.notificationType);
                    const isUnread = notification.status !== NotificationStatus.READ;

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg ${
                          isUnread ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {notification.subject}
                              </p>
                              {isUnread && (
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.body}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {notification.createdAt
                                    ? formatDistanceToNow(new Date(notification.createdAt), {
                                        addSuffix: true,
                                      })
                                    : 'Just now'}
                                </span>
                              </div>
                              <Badge className="text-xs">{notification.channel}</Badge>
                              <Badge className="text-xs" variant="default">
                                {notification.notificationType}
                              </Badge>
                            </div>
                          </div>
                          {isUnread && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="flex-shrink-0"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}

            {/* Pagination */}
            {total > limit && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * limit >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

