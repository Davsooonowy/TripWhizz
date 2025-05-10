import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getInitials } from '@/components/util/avatar-utils';
import { FriendsApiClient } from '@/lib/api/friends';
import { authenticationProviderInstance } from '@/lib/authentication-provider';
import {
  Search,
  UserPlus,
  Users,
  Clock,
  Check,
  X,
  UserMinus,
  AlertCircle,
  Send,
  UserCheck,
} from 'lucide-react';
import type { User } from '@/lib/api/users';
import type { FriendRequest } from '@/lib/api/friends';
import { useLocation, useNavigate } from 'react-router-dom';

export default function FriendsView() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tabFromQuery = queryParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabFromQuery || 'friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }>({ sent: [], received: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const newParams = new URLSearchParams(location.search);
    if (activeTab !== 'friends') {
      newParams.set('tab', activeTab);
    } else {
      newParams.delete('tab');
    }

    const newSearch = newParams.toString();
    const newPath = newSearch
      ? `${location.pathname}?${newSearch}`
      : location.pathname;

    if (location.search !== `?${newSearch}` && (newSearch || location.search)) {
      navigate(newPath, { replace: true });
    }
  }, [activeTab, location, navigate]);

  useEffect(() => {
    const fetchFriendsData = async () => {
      try {
        const friendsApiClient = new FriendsApiClient(
          authenticationProviderInstance,
        );
        const [friendsData, requestsData] = await Promise.all([
          friendsApiClient.getFriends(),
          friendsApiClient.getFriendRequests(),
        ]);

        setFriends(friendsData);
        setFriendRequests(requestsData);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load friends data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriendsData();
  }, [toast]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const friendsApiClient = new FriendsApiClient(
        authenticationProviderInstance,
      );
      const results = await friendsApiClient.searchUsers(searchQuery);
      setSearchResults(results);
    } catch {
      toast({
        title: 'Search Failed',
        description: 'Could not complete the search. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId: number) => {
    try {
      const friendsApiClient = new FriendsApiClient(
        authenticationProviderInstance,
      );
      const request = await friendsApiClient.sendFriendRequest(userId);

      setFriendRequests((prev) => ({
        ...prev,
        sent: [...prev.sent, request],
      }));

      setSearchResults((prev) => prev.filter((user) => user.id !== userId));

      toast({
        title: 'Friend Request Sent',
        description: 'Your friend request has been sent successfully.',
      });
    } catch {
      toast({
        title: 'Request Failed',
        description: 'Could not send friend request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRespondToRequest = async (
    requestId: number,
    action: 'accept' | 'reject',
  ) => {
    try {
      const friendsApiClient = new FriendsApiClient(
        authenticationProviderInstance,
      );
      const updatedRequest = await friendsApiClient.respondToFriendRequest(
        requestId,
        action,
      );

      setFriendRequests((prev) => ({
        ...prev,
        received: prev.received.filter((req) => req.id !== requestId),
      }));

      if (action === 'accept') {
        setFriends((prev) => [...prev, updatedRequest.sender]);
      }

      toast({
        title:
          action === 'accept'
            ? 'Friend Request Accepted'
            : 'Friend Request Rejected',
        description:
          action === 'accept'
            ? 'You are now friends!'
            : 'The friend request has been rejected.',
      });
    } catch {
      toast({
        title: 'Action Failed',
        description: `Could not ${action} the friend request. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      const friendsApiClient = new FriendsApiClient(
        authenticationProviderInstance,
      );
      await friendsApiClient.removeFriend(friendId);

      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));

      toast({
        title: 'Friend Removed',
        description: 'The friend has been removed from your friends list.',
      });
    } catch {
      toast({
        title: 'Action Failed',
        description: 'Could not remove friend. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      const friendsApiClient = new FriendsApiClient(
        authenticationProviderInstance,
      );
      await friendsApiClient.removeFriend(requestId);

      setFriendRequests((prev) => ({
        ...prev,
        sent: prev.sent.filter((req) => req.id !== requestId),
      }));

      toast({
        title: 'Request Cancelled',
        description: 'Your friend request has been cancelled.',
      });
    } catch {
      toast({
        title: 'Action Failed',
        description: 'Could not cancel the friend request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>My Friends</span>
              {friends.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Requests</span>
              {friendRequests.received.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {friendRequests.received.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Add Friends</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle>My Friends</CardTitle>
                <CardDescription>
                  {friends.length > 0
                    ? 'Manage your friends and travel companions'
                    : "You don't have any friends yet. Add some friends to start planning trips together!"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {friends.length > 0 ? (
                  <div className="space-y-4">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-lg">
                            <AvatarImage
                              src={friend.avatar_url || undefined}
                              alt={friend.username}
                            />
                            <AvatarFallback className="rounded-lg">
                              {getInitials(
                                friend.first_name && friend.last_name
                                  ? `${friend.first_name} ${friend.last_name}`
                                  : friend.username,
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {friend.first_name && friend.last_name
                                ? `${friend.first_name} ${friend.last_name}`
                                : friend.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {friend.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No friends found
                    </p>
                    <Button onClick={() => setActiveTab('add')}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Friends
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
                <CardDescription>
                  Manage your incoming and outgoing friend requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">
                      Received Requests
                    </h3>
                    {friendRequests.received.length > 0 ? (
                      <div className="space-y-3">
                        {friendRequests.received.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 rounded-lg">
                                <AvatarImage
                                  src={request.sender.avatar_url || undefined}
                                  alt={request.sender.username}
                                />
                                <AvatarFallback className="rounded-lg">
                                  {getInitials(
                                    request.sender.first_name &&
                                      request.sender.last_name
                                      ? `${request.sender.first_name} ${request.sender.last_name}`
                                      : request.sender.username,
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {request.sender.first_name &&
                                  request.sender.last_name
                                    ? `${request.sender.first_name} ${request.sender.last_name}`
                                    : request.sender.username}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {request.sender.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRespondToRequest(request.id, 'accept')
                                }
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRespondToRequest(request.id, 'reject')
                                }
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-lg">
                        <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground">
                          No pending requests
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-3">Sent Requests</h3>
                    {friendRequests.sent.length > 0 ? (
                      <div className="space-y-3">
                        {friendRequests.sent.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 rounded-lg">
                                <AvatarImage
                                  src={request.receiver.avatar_url || undefined}
                                  alt={request.receiver.username}
                                />
                                <AvatarFallback className="rounded-lg">
                                  {getInitials(
                                    request.receiver.first_name &&
                                      request.receiver.last_name
                                      ? `${request.receiver.first_name} ${request.receiver.last_name}`
                                      : request.receiver.username,
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {request.receiver.first_name &&
                                  request.receiver.last_name
                                    ? `${request.receiver.first_name} ${request.receiver.last_name}`
                                    : request.receiver.username}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {request.receiver.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelRequest(request.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-lg">
                        <Send className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground">
                          No sent requests
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add Friends</CardTitle>
                <CardDescription>
                  Search for users to add as friends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Search
                    </Button>
                  </div>

                  {isSearching ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-lg">
                              <AvatarImage
                                src={user.avatar_url || undefined}
                                alt={user.username}
                              />
                              <AvatarFallback className="rounded-lg">
                                {getInitials(
                                  user.first_name && user.last_name
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.username,
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.username}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendFriendRequest(user.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Friend
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground mb-2">
                        No users found matching "{searchQuery}"
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try a different search term
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <UserCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Search for users to add as friends
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You can search by name or email
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
