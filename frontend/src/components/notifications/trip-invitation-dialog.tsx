import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/use-toast';
import { TripsApiClient } from '@/lib/api/trips';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import * as React from 'react';

import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Check, MapPin, Users, X } from 'lucide-react';

interface TripInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: {
    id: number;
    title: string;
    message: string;
    related_object_id: number;
    sender?: {
      id: number;
      username: string;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
  } | null;
  onResponse?: () => void;
}

export function TripInvitationDialog({
  open,
  onOpenChange,
  notification,
  onResponse,
}: TripInvitationDialogProps) {
  const [isResponding, setIsResponding] = React.useState(false);
  const { toast } = useToast();

  const handleResponse = async (action: 'accept' | 'reject') => {
    if (!notification?.related_object_id) return;

    setIsResponding(true);
    try {
      const tripsApiClient = new TripsApiClient(authenticationProviderInstance);
      await tripsApiClient.respondToInvitation(
        notification.related_object_id,
        action,
      );

      const tripName = extractTripNameFromMessage(notification.message);

      toast({
        title:
          action === 'accept' ? 'Invitation Accepted' : 'Invitation Rejected',
        description:
          action === 'accept'
            ? `You've joined ${tripName ? `"${tripName}"` : 'the trip'}!`
            : `You've declined the invitation${tripName ? ` to "${tripName}"` : ''}.`,
      });

      onResponse?.();
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('expired')) {
        toast({
          title: 'Invitation Expired',
          description:
            'This invitation has expired. Please ask for a new invitation.',
          variant: 'destructive',
        });
        onResponse?.();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description:
            error.message ||
            'Failed to respond to invitation. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsResponding(false);
    }
  };

  const extractTripNameFromMessage = (message: string): string | null => {
    const match = message.match(/join "([^"]+)"/);
    return match ? match[1] : null;
  };

  const getInviterName = () => {
    if (!notification?.sender) return 'Someone';

    if (notification.sender.first_name && notification.sender.last_name) {
      return `${notification.sender.first_name} ${notification.sender.last_name}`;
    }
    if (notification.sender.first_name) {
      return notification.sender.first_name;
    }
    return notification.sender.username;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!notification) {
    return null;
  }

  const tripName = extractTripNameFromMessage(notification.message);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Trip Invitation
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4"
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {tripName || 'Trip Invitation'}
              </h3>
              <p className="text-muted-foreground">
                You've been invited to join this trip
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-muted/30 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={
                  notification.sender?.avatar_url ||
                  '/placeholder.svg?height=40&width=40'
                }
                alt={getInviterName()}
              />
              <AvatarFallback className="bg-primary text-white">
                {getInitials(getInviterName())}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-medium">{getInviterName()}</p>
              <p className="text-sm text-muted-foreground">invited you</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              This invitation expires in 7 days
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-muted/30 rounded-lg">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Group Trip</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Adventure Awaits</p>
            </div>
          </div>
        </motion.div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => handleResponse('reject')}
            disabled={isResponding}
            className="flex-1 gap-2"
          >
            {isResponding ? (
              <LoadingSpinner size="sm" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Decline
          </Button>
          <Button
            onClick={() => handleResponse('accept')}
            disabled={isResponding}
            className="flex-1 gap-2"
          >
            {isResponding ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
