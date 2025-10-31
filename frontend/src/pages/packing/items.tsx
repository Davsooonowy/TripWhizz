import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useTripContext } from '@/components/util/trip-context';
import {
  PackingApiClient,
  type PackingItem,
  type PackingList,
} from '@/lib/api/packing';
import { authenticationProviderInstance } from '@/lib/authentication-provider';
import { PACKING_CATEGORIES } from '@/lib/data/packing-static-data';

import * as React from 'react';
import { useEffect, useState } from 'react';

import { ArrowLeft, Package, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LocalNewItem {
  name: string;
  category: string;
  quantity: number;
  notes?: string;
}

export default function PackingItemsPage() {
  const { selectedTrip, trips, isLoading } = useTripContext();
  const [list, setList] = useState<PackingList | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [newItem, setNewItem] = useState<LocalNewItem>({
    name: '',
    category: PACKING_CATEGORIES[0] || 'Clothing',
    quantity: 1,
    notes: '',
  });

  const api = React.useMemo(
    () => new PackingApiClient(authenticationProviderInstance),
    [],
  );

  useEffect(() => {
    const bootstrap = async () => {
      if (!selectedTrip?.id) return;
      setIsLoadingItems(true);
      try {
        // Ensure a default private list exists
        const lists = await api.listPackingLists(selectedTrip.id, 'private');
        let current = lists[0];
        if (!current) {
          current = await api.createPackingList(selectedTrip.id, {
            name: 'My Items',
            description: 'Default private packing list',
            list_type: 'private',
          });
        }
        setList(current);
        const fetched = await api.listItems(selectedTrip.id, current.id);
        setItems(fetched);
      } finally {
        setIsLoadingItems(false);
      }
    };
    bootstrap();
  }, [api, selectedTrip]);

  // Show loading state while trips are being fetched
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

  // Check if we have any trips at all
  if (trips.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trips Available</h1>
          <p className="text-muted-foreground mb-6">
            You don't have any trips yet. Create a trip first to access the
            packing list.
          </p>
        </div>
      </div>
    );
  }

  // Check if a trip is selected
  if (!selectedTrip || !list) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trip Selected</h1>
          <p className="text-muted-foreground mb-6">
            Please select a trip from the trip switcher to view its packing
            list.
          </p>
        </div>
      </div>
    );
  }

  const addItem = async () => {
    if (!newItem.name.trim()) return;
    setIsLoadingItems(true);
    try {
      const created = await api.createItem(selectedTrip.id!, list.id, {
        name: newItem.name.trim(),
        description: newItem.notes?.trim() || undefined,
        category: newItem.category,
        priority: 'medium',
        quantity: newItem.quantity,
      });
      setItems((prev) => [created, ...prev]);
      setNewItem({ name: '', category: PACKING_CATEGORIES[0] || 'Clothing', quantity: 1, notes: '' });
    } finally {
      setIsLoadingItems(false);
    }
  };

  const togglePacked = async (id: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, is_packed: !it.is_packed } : it,
      ),
    );
    try {
      await api.togglePacked(selectedTrip.id!, list.id, id);
    } catch {
      // revert on failure
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
      await api.deleteItem(selectedTrip.id!, list.id, id);
    } catch {
      setItems(snapshot);
    }
  };

  const groupedItems = items.reduce(
    (acc, item) => {
      const key = item.category || 'Other';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, PackingItem[]>,
  );

  const packedCount = items.filter((item) => item.is_packed).length;
  const totalCount = items.length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          to={`/trip/${selectedTrip.id}/packing`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Packing List
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Packing Items</h1>
        <p className="text-muted-foreground">
          Organize your travel essentials for{' '}
          <span className="font-semibold">{selectedTrip.name}</span>
        </p>

        {/* Progress Bar */}
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

      {/* Add New Item Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {PACKING_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
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
                    quantity: parseInt(e.target.value) || 1,
                  }))
                }
                className="text-center"
              />
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
            disabled={!newItem.name.trim() || isLoadingItems}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Packing List by Category */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
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
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={item.is_packed}
                      onCheckedChange={() => togglePacked(item.id)}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
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
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!isLoadingItems && items.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Your packing list is empty
            </h3>
            <p className="text-muted-foreground mb-4">
              Start adding items to your packing list to get organized for your
              trip
            </p>
            <Button
              onClick={() => setNewItem((s) => ({ ...s, name: 'Passport', category: PACKING_CATEGORIES[0] || 'Clothing' }))}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
