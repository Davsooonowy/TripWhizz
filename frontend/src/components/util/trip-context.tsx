import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { TripsApiClient, type TripData } from '@/lib/api/trips';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

interface TripContextType {
  trips: TripData[];
  selectedTrip: TripData | null;
  isLoading: boolean;
  error: string | null;
  setSelectedTrip: (trip: TripData) => void;
  refreshTrips: () => Promise<void>;
  refreshContent: () => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within a TripProvider');
  }
  return context;
};

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tripsApiClient = new TripsApiClient(authenticationProviderInstance);
      const fetchedTrips = await tripsApiClient.getTrips();
      setTrips(fetchedTrips);

      const storedTripId = localStorage.getItem('selectedTripId');

      if (storedTripId) {
        const foundTrip = fetchedTrips.find(
          (trip) => trip.id?.toString() === storedTripId,
        );
        if (foundTrip) {
          try {
            const details = await tripsApiClient.getTripDetails(foundTrip.id);
            setSelectedTrip({ ...foundTrip, ...details });
          } catch (err) {
            console.error('Error fetching stored trip details:', err);
            setSelectedTrip(foundTrip);
          }
        } else if (fetchedTrips.length > 0) {
          try {
            const details = await tripsApiClient.getTripDetails(
              fetchedTrips[0].id,
            );
            setSelectedTrip({ ...fetchedTrips[0], ...details });
            localStorage.setItem(
              'selectedTripId',
              fetchedTrips[0].id?.toString() || '',
            );
          } catch (err) {
            console.error('Error fetching first trip details:', err);
            setSelectedTrip(fetchedTrips[0]);
          }
        }
      } else if (fetchedTrips.length > 0) {
        try {
          const details = await tripsApiClient.getTripDetails(
            fetchedTrips[0].id,
          );
          setSelectedTrip({ ...fetchedTrips[0], ...details });
          localStorage.setItem(
            'selectedTripId',
            fetchedTrips[0].id?.toString() || '',
          );
        } catch (err) {
          console.error('Error fetching first trip details:', err);
          setSelectedTrip(fetchedTrips[0]);
        }
      }
    } catch {
      setError('Failed to load trips. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleSetSelectedTrip = async (trip: TripData) => {
    setIsLoading(true);

    setSelectedTrip(trip);
    localStorage.setItem('selectedTripId', trip.id?.toString() || '');

    try {
      const tripsApiClient = new TripsApiClient(authenticationProviderInstance);
      const details = await tripsApiClient.getTripDetails(trip.id);

      setSelectedTrip((prevTrip) => {
        if (prevTrip?.id === trip.id) {
          return { ...prevTrip, ...details };
        }
        return prevTrip;
      });
    } catch (err) {
      console.error('Error fetching trip details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTrips = async () => {
    await fetchTrips();
  };

  const refreshContent = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        selectedTrip,
        isLoading,
        error,
        setSelectedTrip: (trip) => handleSetSelectedTrip(trip),
        refreshTrips,
        refreshContent,
      }}
    >
      <div key={refreshKey}>{children}</div>
    </TripContext.Provider>
  );
};
