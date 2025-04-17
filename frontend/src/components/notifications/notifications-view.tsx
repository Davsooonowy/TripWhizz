import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getInitials } from '@/components/util/avatar-utils';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  NotificationsApiClient,
  type Notification,
} from '@/lib/api/notifications';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const notificationsApiClient = new NotificationsApiClient(
        authenticationProviderInstance,
      );
      const notificationsData = await notificationsApiClient.getNotifications();
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const notificationsApiClient = new NotificationsApiClient(
        authenticationProviderInstance,
      );
      await notificationsApiClient.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const notificationsApiClient = new NotificationsApiClient(
        authenticationProviderInstance,
      );
      await notificationsApiClient.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true })),
      );

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read.',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: Notification['notification_type']) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accept':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'trip_invite':
      case 'trip_update':
        return <Bell className="h-4 w-4 text-green-500" />;
      case 'expense_update':
        return <Bell className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.notification_type) {
      case 'friend_request':
        return '/friends?tab=requests';
      case 'friend_accept':
        return '/friends';
      case 'trip_invite':
      case 'trip_update':
        return '/';
      case 'expense_update':
        return '/';
      default:
        return '/';
    }
  };

  const displayedNotifications = unreadOnly
    ? notifications.filter((notification) => !notification.is_read)
    : notifications;

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pb-20 md:pb-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnreadOnly(!unreadOnly)}
            >
              {unreadOnly ? 'Show All' : 'Unread Only'}
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                <Check className="mr-1 h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Notifications</span>
              {unreadCount > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {unreadCount} unread
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-250px)] pr-4">
              {displayedNotifications.length > 0 ? (
                <div className="space-y-1">
                  {displayedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg transition-colors ${!notification.is_read ? 'bg-muted/50' : 'hover:bg-muted/20'}`}
                      onClick={() => {
                        if (!notification.is_read) {
                          handleMarkAsRead(notification.id);
                        }
                        navigate(getNotificationLink(notification));
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {notification.sender ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={notification.sender.avatar_url || undefined}
                            />
                            <AvatarFallback>
                              {getInitials(
                                notification.sender.first_name &&
                                  notification.sender.last_name
                                  ? `${notification.sender.first_name} ${notification.sender.last_name}`
                                  : notification.sender.username,
                              )}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {getNotificationIcon(
                              notification.notification_type,
                            )}
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium leading-none">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary"></span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              { addSuffix: true },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No notifications to display
                  </p>
                  {unreadOnly && notifications.length > 0 && (
                    <Button
                      variant="link"
                      onClick={() => setUnreadOnly(false)}
                      className="mt-2"
                    >
                      Show all notifications
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          {notifications.length > 0 && (
            <CardFooter className="flex justify-center border-t py-4">
              <p className="text-sm text-muted-foreground">
                You've reached the end of your notifications
              </p>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
