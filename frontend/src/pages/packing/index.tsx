import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTripContext } from '@/components/util/trip-context';
import { Button } from '@/components/ui/button';
import { Package, Plus, Users, FileText } from 'lucide-react';

export default function PackingListPage() {
  const { selectedTrip, trips, isLoading } = useTripContext();

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
            You don't have any trips yet. Create a trip first to access the packing list.
          </p>
        </div>
      </div>
    );
  }

  // Check if a trip is selected
  if (!selectedTrip) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trip Selected</h1>
          <p className="text-muted-foreground mb-6">
            Please select a trip from the trip switcher to view its packing list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Packing List</h1>
        <p className="text-muted-foreground">
          Organize your travel essentials for <span className="font-semibold">{selectedTrip.name}</span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* My Items Card */}
        <Link to={`/trip/${selectedTrip.id}/packing/items`} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-8 w-8 text-blue-500" />
              <h2 className="text-xl font-semibold">My Items</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Manage your personal packing items for this trip
            </p>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Manage Items
            </Button>
          </div>
        </Link>

        {/* Shared Items Card */}
        <Link to={`/trip/${selectedTrip.id}/packing/shared`} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-8 w-8 text-green-500" />
              <h2 className="text-xl font-semibold">Shared Items</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Collaborate with travel companions on shared items
            </p>
            <Button variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              View Shared
            </Button>
          </div>
        </Link>

        {/* Templates Card */}
        <Link to={`/trip/${selectedTrip.id}/packing/templates`} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-purple-500" />
              <h2 className="text-xl font-semibold">Templates</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Use pre-made templates for different trip types
            </p>
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Browse Templates
            </Button>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Items Packed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Shared Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Templates Used</div>
          </div>
        </div>
      </div>
    </div>
  );
} 