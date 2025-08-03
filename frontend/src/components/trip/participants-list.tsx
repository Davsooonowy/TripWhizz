import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserSearchInput } from '@/components/util/user-search-input';
import { TripsApiClient } from '@/lib/api/trips';
import type { TripOwner, TripParticipant } from '@/lib/api/trips';
import { User, UsersApiClient } from '@/lib/api/users';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import * as React from 'react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { AlertTriangle, Clock, UserMinus, UserPlus } from 'lucide-react';

interface ParticipantsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: TripParticipant[];
  tripId?: number;
  tripOwner?: TripOwner;
  currentUserId?: number;
  onParticipantsUpdate?: () => void;
}

export function ParticipantsList({
  open,
  onOpenChange,
  participants,
  tripId,
  tripOwner,
  onParticipantsUpdate,
}: ParticipantsListProps) {
  const [addCompanionOpen, setAddCompanionOpen] = React.useState(false);
  const [isInviting, setIsInviting] = React.useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [participantToRemove, setParticipantToRemove] =
    React.useState<TripParticipant | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const { toast } = useToast();

  const isCurrentUserOwner = React.useMemo(() => {
    return tripOwner && currentUserId && tripOwner.id === currentUserId;
  }, [tripOwner, currentUserId]);

  const handleInviteUser = async (user: User) => {
    if (!tripId) return;

    setIsInviting(true);
    try {
      const tripsApiClient = new TripsApiClient(authenticationProviderInstance);
      await tripsApiClient.inviteToTrip(tripId, user.id);

      onParticipantsUpdate?.();

      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${getDisplayName(user)} successfully.`,
      });

      setAddCompanionOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to Send Invitation',
        description: 'Could not send the invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveParticipant = async () => {
    if (!tripId || !participantToRemove) return;

    setIsRemoving(true);
    try {
      const tripsApiClient = new TripsApiClient(authenticationProviderInstance);
      await tripsApiClient.removeParticipant(tripId, participantToRemove.id);

      onParticipantsUpdate?.();

      toast({
        title: 'Participant Removed',
        description: `${getDisplayName(participantToRemove)} has been removed from the trip.`,
      });

      setRemoveDialogOpen(false);
      setParticipantToRemove(null);
    } catch (error) {
      toast({
        title: 'Failed to Remove Participant',
        description: 'Could not remove the participant. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddCompanionClick = () => {
    setAddCompanionOpen(true);
  };

  const handleRemoveClick = (participant: TripParticipant) => {
    setParticipantToRemove(participant);
    setRemoveDialogOpen(true);
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const usersApiClient = new UsersApiClient(
          authenticationProviderInstance,
        );
        const activeUser = await usersApiClient.getActiveUser();
        setCurrentUserId(activeUser.id);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trip Companions ({participants.length})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            {participants.map((participant) => (
              <ParticipantItem
                key={participant.id}
                participant={participant}
                isOwner={tripOwner?.id === participant.id}
                canRemove={
                  !!(isCurrentUserOwner && tripOwner?.id !== participant.id)
                }
                onRemove={() => handleRemoveClick(participant)}
              />
            ))}
          </div>
          <DialogFooter className="flex justify-between items-center">
            {tripId && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleAddCompanionClick}
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Companion</span>
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Companion Dialog */}
      <Dialog open={addCompanionOpen} onOpenChange={setAddCompanionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite Companion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <UserSearchInput
              placeholder="Search users to invite..."
              onUserSelect={handleInviteUser}
              excludeUserIds={participants.map((p) => p.id)}
              disabled={isInviting}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddCompanionOpen(false)}
              disabled={isInviting}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Participant
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>
                {participantToRemove ? getDisplayName(participantToRemove) : ''}
              </strong>{' '}
              from this trip? They will lose access to the trip and receive a
              notification about being removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveParticipant}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ParticipantItemProps {
  participant: TripParticipant;
  isOwner?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
}

function ParticipantItem({
  participant,
  isOwner,
  canRemove,
  onRemove,
}: ParticipantItemProps) {
  const displayName = getDisplayName(participant);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center space-x-3 rounded-lg p-2 hover:bg-muted"
    >
      <div className="relative">
        <Avatar className="h-10 w-10 rounded-lg">
          <AvatarImage
            src={
              participant.avatar_url || '/placeholder.svg?height=40&width=40'
            }
            alt={displayName}
            className="rounded-lg"
          />
          <AvatarFallback className="rounded-lg bg-primary text-white">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {participant.invitation_status === 'pending' && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center">
            <Clock className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{displayName}</p>
          {isOwner && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              Owner
            </span>
          )}
          {participant.invitation_status === 'pending' && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              Pending
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{participant.email}</p>
      </div>
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
}

function getDisplayName(participant: TripParticipant | User): string {
  if (participant.first_name && participant.last_name) {
    return `${participant.first_name} ${participant.last_name}`;
  }
  if (participant.first_name) {
    return participant.first_name;
  }
  return participant.username;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
