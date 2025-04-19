import { useState, useEffect } from 'react';
import { Bell, Check, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { getInitials } from '@/components/util/avatar-utils';
import {
  NotificationsApiClient,
  type Notification,
} from '@/lib/api/notifications';
import { authenticationProviderInstance } from '@/lib/authentication-provider';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const notificationsApiClient = new NotificationsApiClient(
        authenticationProviderInstance,
      );
      const [notificationsData, countData] = await Promise.all([
        notificationsApiClient.getNotifications(),
        notificationsApiClient.getUnreadCount(),
      ]);
      setNotifications(notificationsData);
      setUnreadCount(countData.count);
    }  finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const notificationsApiClient = new NotificationsApiClient(
          authenticationProviderInstance,
        );
        const countData = await notificationsApiClient.getUnreadCount();
        setUnreadCount(countData.count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const notificationsApiClient = new NotificationsApiClient(
        authenticationProviderInstance,
      );
      await notificationsApiClient.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const notificationsApiClient = new NotificationsApiClient(
        authenticationProviderInstance,
      );
      await notificationsApiClient.markAllAsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true })),
      );
      setUnreadCount(0);

      toast({
        title: 'All notifications marked as read',
        description: 'Your notifications have been cleared',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
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

  const handleBellClick = () => {
    if (isMobile) {
      navigate('/notifications');
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <DropdownMenu open={isMobile ? false : isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={handleBellClick}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-2 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <ScrollArea className="max-h-80">
            <DropdownMenuGroup>
              {notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  asChild
                  className={`p-3 ${!notification.is_read ? 'bg-muted/50' : ''}`}
                >
                  <Link
                    to={getNotificationLink(notification)}
                    onClick={() =>
                      !notification.is_read && handleMarkAsRead(notification.id)
                    }
                  >
                    <div className="flex items-start gap-3">
                      {notification.sender ? (
                        <Avatar className="h-8 w-8">
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          {getNotificationIcon(notification.notification_type)}
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            { addSuffix: true },
                          )}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div
                          className="h-2 w-2 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
              {notifications.length > 5 && (
                <DropdownMenuItem
                  asChild
                  className="justify-center py-2 font-medium text-primary"
                >
                  <Link to="/notifications">See all notifications</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </ScrollArea>
        ) : (
          <div className="py-6 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
