import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserSearchInput } from '@/components/util/user-search-input';
import { FriendsApiClient } from '@/lib/api/friends';
import { TripsApiClient } from '@/lib/api/trips';
import type { User } from '@/lib/api/users';
import { authenticationProviderInstance } from '@/lib/authentication-provider';
import { cn } from '@/lib/utils';

import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface InviteFriendsProps {
  tripType: 'private' | 'public';
}

export default function InviteFriends({ tripType }: InviteFriendsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const tripData = location.state?.tripData || {};
  const tripId = location.state?.tripId;

  const [searchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [recentContacts, setRecentContacts] = useState<User[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriendsData();
  }, [tripId]);

  const loadFriendsData = async () => {
    try {
      setLoading(true);
      const friendsApiClient = new FriendsApiClient(
        authenticationProviderInstance,
      );

      const friendsData = await friendsApiClient.getFriends();
      setFriends(friendsData);

      setRecentContacts(friendsData.slice(0, 3));
    } catch (error) {
      toast({
        title: 'Failed to load friends',
        description: 'Could not load your friends list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.first_name &&
        friend.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (friend.last_name &&
        friend.last_name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleFriendSelect = (friend: User) => {
    setSelectedFriends((prev) => {
      const isAlreadySelected = prev.some((f) => f.id === friend.id);
      if (isAlreadySelected) {
        return prev.filter((f) => f.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleUserSearchSelect = (user: User) => {
    handleFriendSelect(user);
  };

  const handleSubmit = async () => {
    if (selectedFriends.length === 0) {
      toast({
        title: 'No friends selected',
        description: 'Please select at least one friend to invite.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tripsApiClient = new TripsApiClient(authenticationProviderInstance);

      // Send invitations to all selected friends
      const invitationPromises = selectedFriends.map((friend) =>
        tripsApiClient.inviteToTrip(tripId, friend.id),
      );

      await Promise.all(invitationPromises);

      toast({
        title: 'Invitations sent!',
        description: `Successfully sent ${selectedFriends.length} invitation${selectedFriends.length > 1 ? 's' : ''}.`,
      });

      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to send invitations:', error);
      toast({
        title: 'Failed to send invitations',
        description: 'Some invitations could not be sent. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/trip/new/${tripType}/stages`, {
      state: {
        tripData: tripData,
        tripId: tripId,
      },
    });
  };

  const finishAndGoHome = () => {
    navigate('/');
  };

  const getDisplayName = (user: User): string => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    return user.username;
  };

  const getInitials = (user: User): string => {
    const name = getDisplayName(user);
    return name
      .split(' ')
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-20">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading friends...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Invite Friends to Your Trip
          </h1>
          <p className="text-muted-foreground">
            Share your adventure to {tripData.destination || 'your destination'}{' '}
            with friends and family
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="shadow-md mb-6">
            <CardHeader>
              <CardTitle>Share Your Trip</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Search and Invite</h3>
                  <UserSearchInput
                    placeholder="Search for friends to invite..."
                    onUserSelect={handleUserSearchSelect}
                    excludeUserIds={selectedFriends.map((f) => f.id)}
                  />
                </div>

                {selectedFriends.length > 0 && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">
                        Selected ({selectedFriends.length})
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFriends([])}
                        className="h-7 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedFriends.map((friend) => (
                        <Badge
                          key={friend.id}
                          variant="secondary"
                          className="pl-1 pr-1 py-1 gap-1"
                        >
                          <Avatar className="h-5 w-5 rounded-lg">
                            <AvatarImage
                              src={friend.avatar_url || '/placeholder.svg'}
                              alt={getDisplayName(friend)}
                            />
                            <AvatarFallback className="rounded-lg">
                              {getInitials(friend)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">
                            {getDisplayName(friend)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-transparent"
                            onClick={() => handleFriendSelect(friend)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {recentContacts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Recent Contacts</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {recentContacts.map((contact) => (
                        <Button
                          key={contact.id}
                          variant={
                            selectedFriends.some((f) => f.id === contact.id)
                              ? 'default'
                              : 'outline'
                          }
                          className="justify-start gap-2 h-auto py-2"
                          onClick={() => handleFriendSelect(contact)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={contact.avatar_url || '/placeholder.svg'}
                              alt={getDisplayName(contact)}
                            />
                            <AvatarFallback>
                              {getInitials(contact)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm">
                            {getDisplayName(contact)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Your Friends</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {filteredFriends.length > 0 ? (
                      filteredFriends.map((friend) => {
                        const isSelected = selectedFriends.some(
                          (f) => f.id === friend.id,
                        );
                        return (
                          <div
                            key={friend.id}
                            className={cn(
                              'flex items-center justify-between p-2 rounded-lg transition-colors',
                              isSelected
                                ? 'bg-primary/10 border border-primary/30'
                                : 'hover:bg-muted border border-transparent',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 relative rounded-lg">
                                <AvatarImage
                                  src={friend.avatar_url || '/placeholder.svg'}
                                  alt={getDisplayName(friend)}
                                />
                                <AvatarFallback className="rounded-lg">
                                  {getInitials(friend)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {getDisplayName(friend)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {friend.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant={isSelected ? 'default' : 'ghost'}
                              size="sm"
                              className="gap-1"
                              onClick={() => handleFriendSelect(friend)}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  <span className="sr-md:not-sr-only sr-only">
                                    Selected
                                  </span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4" />
                                  <span className="sr-md:not-sr-only sr-only">
                                    Invite
                                  </span>
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>
                          {searchQuery
                            ? `No friends found matching "${searchQuery}"`
                            : 'No friends found. Add some friends first!'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedFriends.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending Invites...
                  </>
                ) : (
                  <>
                    Send Invitations ({selectedFriends.length})
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            You can always invite more people later from the trip dashboard.
          </p>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitations Sent Successfully!</DialogTitle>
            <DialogDescription>
              Your friends have been invited to join your trip to{' '}
              {tripData.destination || 'your destination'}. They will receive
              email notifications and can accept the invitations in the app.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={finishAndGoHome} className="w-full">
              Go to My Trips
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
