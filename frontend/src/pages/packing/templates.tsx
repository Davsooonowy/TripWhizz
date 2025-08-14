import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTripContext } from '@/components/util/trip-context';
import { ArrowLeft } from 'lucide-react';

export default function PackingTemplatesPage() {
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
        <h1 className="text-3xl font-bold mb-2">Packing Templates</h1>
        <p className="text-muted-foreground">
          Use pre-made templates for <span className="font-semibold">{selectedTrip.name}</span>
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-gray-600 dark:text-gray-300">
          The packing templates feature is being developed. You'll be able to:
        </p>
        <ul className="list-disc list-inside mt-2 text-gray-600 dark:text-gray-300">
          <li>Choose from pre-made templates for beach trips, city breaks, camping, etc.</li>
          <li>Customize templates to fit your needs</li>
          <li>Save your own templates for future use</li>
          <li>Share templates with friends</li>
        </ul>
      </div>
    </div>
  );
} 