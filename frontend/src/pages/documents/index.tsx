import { Button } from '@/components/ui/button';
import { useTripContext } from '@/components/util/trip-context';

import * as React from 'react';

import { FileText, FolderOpen, Plus, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DocumentsPage() {
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
            You don't have any trips yet. Create a trip first to access the
            documents section.
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
            Please select a trip from the trip switcher to view its documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Documents</h1>
        <p className="text-muted-foreground">
          Manage and organize documents for{' '}
          <span className="font-semibold">{selectedTrip.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* All Documents Card */}
        <Link to={`/trip/${selectedTrip.id}/documents`} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-blue-500" />
              <h2 className="text-xl font-semibold">All Documents</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              View and manage all documents for this trip
            </p>
            <Button className="w-full">
              <FolderOpen className="h-4 w-4 mr-2" />
              Browse Documents
            </Button>
          </div>
        </Link>

        {/* Shared Documents Card */}
        <Link to={`/trip/${selectedTrip.id}/documents?visibility=shared`} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-8 w-8 text-green-500" />
              <h2 className="text-xl font-semibold">Shared Documents</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Documents visible to all trip members
            </p>
            <Button variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              View Shared
            </Button>
          </div>
        </Link>

        {/* Private Documents Card */}
        <Link to={`/trip/${selectedTrip.id}/documents?visibility=private`} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-purple-500" />
              <h2 className="text-xl font-semibold">Private Documents</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your personal documents only visible to you
            </p>
            <Button variant="outline" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              View Private
            </Button>
          </div>
        </Link>

        {/* Upload Document Card */}
        <Link to={`/trip/${selectedTrip.id}/documents/upload`} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-200">
            <div className="flex items-center gap-3 mb-4">
              <Plus className="h-8 w-8 text-orange-500" />
              <h2 className="text-xl font-semibold">Upload Document</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Add new documents to your trip collection
            </p>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Documents
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Shared Documents
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Private Documents
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Comments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
