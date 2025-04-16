import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Search,
  Share2,
  UserPlus,
  Users,
  X,
  CheckCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Mock data for friends - in a real app, this would come from an API
const mockFriends = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: '/placeholder.svg?height=40&width=40',
    status: 'online',
  },
  {
    id: 2,
    name: 'Sarah Miller',
    email: 'sarah@example.com',
    avatar: '/placeholder.svg?height=40&width=40',
    status: 'offline',
  },
  {
    id: 3,
    name: 'James Wilson',
    email: 'james@example.com',
    avatar: '/placeholder.svg?height=40&width=40',
    status: 'online',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@example.com',
    avatar: '/placeholder.svg?height=40&width=40',
    status: 'offline',
  },
  {
    id: 5,
    name: 'David Brown',
    email: 'david@example.com',
    avatar: '/placeholder.svg?height=40&width=40',
    status: 'online',
  },
];

// Mock data for recent contacts
const mockRecentContacts = [
  {
    id: 6,
    name: 'Michael Scott',
    email: 'michael@example.com',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    id: 7,
    name: 'Pam Beesly',
    email: 'pam@example.com',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    id: 8,
    name: 'Jim Halpert',
    email: 'jim@example.com',
    avatar: '/placeholder.svg?height=40&width=40',
  },
];

interface InviteFriendsProps {
  tripType: 'private' | 'public';
}

export default function InviteFriends({ tripType }: InviteFriendsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const tripData = location.state?.tripData || {};
  const tripId = location.state?.tripId;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    // Generate a mock invite link
    setInviteLink(
      `https://tripwhizz.com/join/${tripId}/${Math.random().toString(36).substring(2, 10)}`,
    );
  }, [tripId]);

  const filteredFriends = mockFriends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleFriendSelect = (friendId: number) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Link copied!',
      description: 'Invite link has been copied to clipboard',
      duration: 3000,
    });
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    // Simulate API call to send invitations
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessDialog(true);
    }, 1500);
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
    navigate('/trip');
  };

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
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Button
                  className="flex-1 gap-2"
                  variant="outline"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Invite Link</span>
                </Button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search friends..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                      {selectedFriends.map((id) => {
                        const friend = mockFriends.find((f) => f.id === id);
                        if (!friend) return null;
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="pl-1 pr-1 py-1 gap-1"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={friend.avatar || '/placeholder.svg'}
                                alt={friend.name}
                              />
                              <AvatarFallback>{friend.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{friend.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1 hover:bg-transparent"
                              onClick={() => handleFriendSelect(id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Recent Contacts</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mockRecentContacts.map((contact) => (
                      <Button
                        key={contact.id}
                        variant="outline"
                        className="justify-start gap-2 h-auto py-2"
                        onClick={() => handleFriendSelect(contact.id)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={contact.avatar || '/placeholder.svg'}
                            alt={contact.name}
                          />
                          <AvatarFallback>{contact.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">{contact.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Friends</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {filteredFriends.length > 0 ? (
                      filteredFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className={cn(
                            'flex items-center justify-between p-2 rounded-lg transition-colors',
                            selectedFriends.includes(friend.id)
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-muted border border-transparent',
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 relative">
                              <AvatarImage
                                src={friend.avatar || '/placeholder.svg'}
                                alt={friend.name}
                              />
                              <AvatarFallback>{friend.name[0]}</AvatarFallback>
                              <div
                                className={cn(
                                  'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
                                  friend.status === 'online'
                                    ? 'bg-green-500'
                                    : 'bg-gray-400',
                                )}
                              />
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {friend.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {friend.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={
                              selectedFriends.includes(friend.id)
                                ? 'default'
                                : 'ghost'
                            }
                            size="sm"
                            className="gap-1"
                            onClick={() => handleFriendSelect(friend.id)}
                          >
                            {selectedFriends.includes(friend.id) ? (
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
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No friends found matching "{searchQuery}"</p>
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
                    Send Invitations
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitations Sent Successfully!</DialogTitle>
            <DialogDescription>
              Your friends have been invited to join your trip to{' '}
              {tripData.destination || 'your destination'}
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

      {/* Share Link Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Trip Invite Link</DialogTitle>
            <DialogDescription>
              Anyone with this link can request to join your trip
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                defaultValue={inviteLink}
                readOnly
                className="font-mono text-sm"
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="submit" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              This link expires in 7 days
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
