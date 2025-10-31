import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useTripContext } from '@/components/util/trip-context';
import {
  PackingApiClient,
  type PackingItem,
  type PackingList,
} from '@/lib/api/packing';
import { type TripParticipant, TripsApiClient } from '@/lib/api/trips';
import { UsersApiClient } from '@/lib/api/users';
import { authenticationProviderInstance } from '@/lib/authentication-provider';
import { PACKING_CATEGORIES } from '@/lib/data/packing-static-data';

import { useEffect, useMemo, useState } from 'react';

import { ArrowLeft, Plus, Trash2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LocalNewItem {
  name: string;
  category: string;
  quantity: number;
  notes?: string;
  assigned_to_id?: number | null;
}

export default function SharedPackingPage() {
  const { selectedTrip, trips, isLoading } = useTripContext();
  const [list, setList] = useState<PackingList | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [participants, setParticipants] = useState<TripParticipant[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [assigningItemId, setAssigningItemId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { toast } = useToast();

  const [newItem, setNewItem] = useState<LocalNewItem>({
    name: '',
    category: PACKING_CATEGORIES[0] || 'Clothing',
    quantity: 1,
    notes: '',
    assigned_to_id: undefined,
  });

  const api = useMemo(
    () => new PackingApiClient(authenticationProviderInstance),
    [],
  );
  const tripsApi = useMemo(
    () => new TripsApiClient(authenticationProviderInstance),
    [],
  );
  const usersApi = useMemo(
    () => new UsersApiClient(authenticationProviderInstance),
    [],
  );

  const fetchUserId = async () => {
    try {
      const user = await usersApi.getActiveUser();
      setCurrentUserId(user.id);
    } catch (e) {
      console.debug('fetchUserId error', e);
      toast({
        title: 'Error',
        description: 'Failed to fetch active user',
        variant: 'destructive',
      });
    }
  };

  fetchUserId();

  useEffect(() => {
    const bootstrap = async () => {
      if (!selectedTrip?.id) return;
      setIsBusy(true);
      try {
        // ensure shared list exists
        const lists = await api.listPackingLists(selectedTrip.id, 'shared');
        let current = lists[0];
        if (!current) {
          current = await api.createPackingList(selectedTrip.id, {
            name: 'Shared Items',
            description: 'Shared packing list',
            list_type: 'shared',
          });
        }
        setList(current);
        const fetched = await api.listItems(selectedTrip.id, current.id);
        setItems(fetched);
        // participants for assignment
        const details = await tripsApi.getTripDetails(selectedTrip.id);
        setParticipants(details.participants || []);
      } finally {
        setIsBusy(false);
      }
    };
    bootstrap();
  }, [api, tripsApi, selectedTrip]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Loading trip information...</p>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trips Available</h1>
          <p className="text-muted-foreground mb-6">
            Create a trip to access shared packing.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedTrip || !list) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trip Selected</h1>
          <p className="text-muted-foreground mb-6">
            Select a trip from the switcher.
          </p>
        </div>
      </div>
    );
  }

  const addItem = async () => {
    if (!newItem.name.trim()) return;
    setIsBusy(true);
    try {
      const created = await api.createItem(selectedTrip.id!, list.id!, {
        name: newItem.name.trim(),
        description: newItem.notes?.trim() || undefined,
        category: newItem.category,
        priority: 'medium',
        quantity: newItem.quantity,
        assigned_to_id: newItem.assigned_to_id,
      });
      setItems((prev) => [created, ...prev]);
      setNewItem({
        name: '',
        category: PACKING_CATEGORIES[0] || 'Clothing',
        quantity: 1,
        notes: '',
        assigned_to_id: undefined,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const togglePacked = async (id: number) => {
    const item = items.find((it) => it.id === id);
    if (item?.assigned_to && item.assigned_to.id !== currentUserId) {
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, is_packed: !it.is_packed } : it,
      ),
    );
    try {
      await api.togglePacked(selectedTrip.id!, list.id!, id);
    } catch {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, is_packed: !it.is_packed } : it,
        ),
      );
    }
  };

  const deleteItem = async (id: number) => {
    const snapshot = items;
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      await api.deleteItem(selectedTrip.id!, list.id!, id);
    } catch {
      setItems(snapshot);
    }
  };

  const assignItem = async (itemId: number, participantId: number) => {
    setIsBusy(true);
    try {
      const updatedItem = await api.updateItem(
        selectedTrip.id!,
        list.id!,
        itemId,
        {
          assigned_to_id: participantId,
        },
      );
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? updatedItem : it)),
      );
      setAssigningItemId(null);
    } finally {
      setIsBusy(false);
    }
  };

  const grouped = items.reduce(
    (acc, item) => {
      const key = item.category || 'Other';
      if (!acc[key]) acc[key] = [] as PackingItem[];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, PackingItem[]>,
  );

  const packedCount = items.filter((i) => i.is_packed).length;
  const totalCount = items.length;

  const getUserInitials = (user: {
    first_name?: string;
    last_name?: string;
    username: string;
  }) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link
          to={`/trip/${selectedTrip.id}/packing`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Packing List
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shared Packing Items</h1>
        <p className="text-muted-foreground">
          Collaborate with your companions for{' '}
          <span className="font-semibold">{selectedTrip.name}</span>
        </p>
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {packedCount} of {totalCount} items packed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${totalCount > 0 ? (packedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add Shared Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Item name..."
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((s) => ({ ...s, name: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
              />
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem((s) => ({ ...s, category: e.target.value }))
                }
              >
                {PACKING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem((s) => ({
                    ...s,
                    quantity: Number.parseInt(e.target.value) || 1,
                  }))
                }
                className="text-center"
              />
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={newItem.assigned_to_id ?? ''}
                onChange={(e) =>
                  setNewItem((s) => ({
                    ...s,
                    assigned_to_id: e.target.value
                      ? Number.parseInt(e.target.value)
                      : undefined,
                  }))
                }
              >
                <option value="">Unassigned</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Input
              placeholder="Notes (optional)"
              value={newItem.notes}
              onChange={(e) =>
                setNewItem((s) => ({ ...s, notes: e.target.value }))
              }
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
          </div>
          <Button
            onClick={addItem}
            className="mt-4"
            disabled={!newItem.name.trim() || isBusy}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{category}</span>
                <Badge variant="secondary" className="ml-auto">
                  {categoryItems.filter((item) => item.is_packed).length}/
                  {categoryItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryItems.map((item) => {
                  const canTogglePacked =
                    !item.assigned_to || item.assigned_to.id === currentUserId;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative">
                        <Checkbox
                          checked={item.is_packed}
                          onCheckedChange={() => togglePacked(item.id)}
                          disabled={!canTogglePacked}
                          className={`data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 ${
                            !canTogglePacked
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        />
                        {!canTogglePacked && (
                          <div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white"
                            title="Only the assigned person can mark this as packed"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${item.is_packed ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {item.name}
                          </span>
                          {item.quantity > 1 && (
                            <Badge variant="outline" className="text-xs">
                              x{item.quantity}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            {item.created_by && item.assigned_to && (
                              <div className="flex gap-6">
                                <div className="flex items-center justify-between min-w-[120px] flex-1">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    Added by
                                  </span>
                                  <Avatar className="h-6 w-6 ml-3">
                                    <AvatarImage
                                      src={
                                        item.created_by.avatar_url || undefined
                                      }
                                    />
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                      {getUserInitials(item.created_by)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="flex items-center justify-between min-w-[120px] flex-1">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    Assigned to
                                  </span>
                                  <Avatar className="h-6 w-6 ml-3">
                                    <AvatarImage
                                      src={
                                        item.assigned_to.avatar_url || undefined
                                      }
                                    />
                                    <AvatarFallback className="text-xs bg-green-100 text-green-700">
                                      {getUserInitials(item.assigned_to)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              </div>
                            )}

                            {item.created_by && !item.assigned_to && (
                              <div className="flex items-center justify-between min-w-[120px]">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Added by
                                </span>
                                <Avatar className="h-6 w-6 ml-3">
                                  <AvatarImage
                                    src={
                                      item.created_by.avatar_url || undefined
                                    }
                                  />
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                    {getUserInitials(item.created_by)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}

                            {!item.created_by && item.assigned_to && (
                              <div className="flex items-center justify-between min-w-[120px]">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Assigned to
                                </span>
                                <Avatar className="h-6 w-6 ml-3">
                                  <AvatarImage
                                    src={
                                      item.assigned_to.avatar_url || undefined
                                    }
                                  />
                                  <AvatarFallback className="text-xs bg-green-100 text-green-700">
                                    {getUserInitials(item.assigned_to)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}

                            {!item.assigned_to && (
                              <div className="flex items-center justify-between min-w-[120px]">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Unassigned
                                </span>
                                {assigningItemId === item.id ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      className="text-xs px-2 py-1 border border-input rounded bg-background"
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          assignItem(
                                            item.id,
                                            Number.parseInt(e.target.value),
                                          );
                                        }
                                      }}
                                      defaultValue=""
                                    >
                                      <option value="">Select person...</option>
                                      {participants.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.username}
                                        </option>
                                      ))}
                                    </select>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => setAssigningItemId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs bg-transparent ml-3"
                                    onClick={() => setAssigningItemId(item.id)}
                                  >
                                    <User className="h-3 w-3 mr-1" />
                                    Assign
                                  </Button>
                                )}
                              </div>
                            )}

                            {item.packed_by && (
                              <div className="flex items-center justify-between min-w-[120px]">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Packed by
                                </span>
                                <Avatar className="h-6 w-6 ml-3">
                                  <AvatarImage
                                    src={item.packed_by.avatar_url || undefined}
                                  />
                                  <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                                    {getUserInitials(item.packed_by)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
