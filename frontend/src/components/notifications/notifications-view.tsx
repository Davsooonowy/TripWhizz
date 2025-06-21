import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { TripInvitationDialog } from "@/components/notifications/trip-invitation-dialog"
import { NotificationsApiClient } from "@/lib/api/notifications"
import { authenticationProviderInstance } from "@/lib/authentication-provider"

import * as React from "react"

import { motion } from "framer-motion"
import { Bell, Clock, MapPin, Users } from "lucide-react"

interface Notification {
  id: number
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
  sender?: {
    id: number
    username: string
    first_name?: string
    last_name?: string
    avatar_url?: string
  }
  related_object_id?: number
}

export default function NotificationsView() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedInvitation, setSelectedInvitation] = React.useState<Notification | null>(null)
  const [invitationDialogOpen, setInvitationDialogOpen] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const notificationsApiClient = new NotificationsApiClient(authenticationProviderInstance)
      const data = await notificationsApiClient.getNotifications()
      setNotifications(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notifications.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const notificationsApiClient = new NotificationsApiClient(authenticationProviderInstance)
      await notificationsApiClient.markAsRead(notificationId)

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, is_read: true } : notification,
        ),
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      })
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    if (notification.notification_type === "trip_invite") {
      setSelectedInvitation(notification)
      setInvitationDialogOpen(true)
    }
  }

  const handleInvitationResponse = () => {
    fetchNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "trip_invite":
        return <MapPin className="h-4 w-4 text-blue-500" />
      case "trip_update":
        return <Users className="h-4 w-4 text-green-500" />
      case "friend_request":
        return <Users className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getSenderName = (sender?: Notification["sender"]) => {
    if (!sender) return "System"
    if (sender.first_name && sender.last_name) {
      return `${sender.first_name} ${sender.last_name}`
    }
    if (sender.first_name) return sender.first_name
    return sender.username
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            {notifications.filter((n) => !n.is_read).length} unread
          </div>
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center">
                You're all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.is_read ? "border-primary/50 bg-primary/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {notification.sender ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={notification.sender.avatar_url || "/placeholder.svg?height=40&width=40"}
                                alt={getSenderName(notification.sender)}
                              />
                            </Avatar>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              {getNotificationIcon(notification.notification_type)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getNotificationIcon(notification.notification_type)}
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            {!notification.is_read && <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />}
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notification.created_at)}
                          </div>
                        </div>

                        {notification.notification_type === "trip_invite" && (
                          <div className="flex-shrink-0">
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <TripInvitationDialog
        open={invitationDialogOpen}
        onOpenChange={setInvitationDialogOpen}
        notification={selectedInvitation}
        onResponse={handleInvitationResponse}
      />
    </>
  )
}
