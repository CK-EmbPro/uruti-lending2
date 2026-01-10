'use client';

import { useState, useEffect } from 'react';
import { useUnreadNotifications, useMarkAsRead } from '@/lib/hooks/useNotifications';
import { useNotificationWebSocket } from '@/lib/hooks/useNotificationWebSocket';
import { NotificationLog, NotificationType, NotificationStatus } from '@/lib/api/notifications';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Bell,
  Check,
  X,
  Mail,
  MessageSquare,
  Smartphone,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  userId: string;
  onNotificationClick?: (notification: NotificationLog) => void;
}

export function NotificationCenter({ userId, onNotificationClick }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const { data: unreadNotifications = [], isLoading, refetch } = useUnreadNotifications(userId);
  const markAsRead = useMarkAsRead();

  // WebSocket for real-time notifications
  const { isConnected, unreadCount: wsUnreadCount } = useNotificationWebSocket({
    enabled: true,
    onNotification: (notification) => {
      // Add new notification to list
      setNotifications((prev) => [notification as NotificationLog, ...prev]);
      // Refetch to get updated list
      refetch();
    },
    onUnreadCountUpdate: () => {
      // Refetch when unread count updates
      refetch();
    },
  });

  // Sync notifications from API with WebSocket updates
  useEffect(() => {
    if (unreadNotifications.length > 0) {
      setNotifications(unreadNotifications);
    }
  }, [unreadNotifications]);

  const unreadCount = wsUnreadCount > 0 ? wsUnreadCount : unreadNotifications.length;

  const handleNotificationClick = async (notification: NotificationLog) => {
    if (notification.status !== NotificationStatus.READ) {
      await markAsRead.mutateAsync(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
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

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-red-100 text-red-800">{unreadCount} new</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : unreadNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {unreadNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.notificationType);
                    const colorClass = getNotificationColor(notification.notificationType);

                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.subject}
                              </p>
                              {notification.status !== NotificationStatus.READ && (
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {notification.body}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>
                                {notification.createdAt
                                  ? formatDistanceToNow(new Date(notification.createdAt), {
                                      addSuffix: true,
                                    })
                                  : 'Just now'}
                              </span>
                              <Badge className="text-xs" variant="default">
                                {notification.channel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = '/notifications';
                }}
              >
                View all notifications
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

