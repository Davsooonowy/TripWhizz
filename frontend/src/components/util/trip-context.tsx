import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { TripsApiClient, type TripData } from "@/lib/api/trips"
import { authenticationProviderInstance } from "@/lib/authentication-provider"

interface TripContextType {
  trips: TripData[]
  selectedTrip: TripData | null
  isLoading: boolean
  error: string | null
  setSelectedTrip: (trip: TripData) => void
  refreshTrips: () => Promise<void>
}

const TripContext = createContext<TripContextType | undefined>(undefined)

export const useTripContext = () => {
  const context = useContext(TripContext)
  if (!context) {
    throw new Error("useTripContext must be used within a TripProvider")
  }
  return context
}

// Modify the TripProvider to remove router dependencies:
export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<TripData[]>([])
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrips = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const tripsApiClient = new TripsApiClient(authenticationProviderInstance)
      const fetchedTrips = await tripsApiClient.getTrips()
      setTrips(fetchedTrips)

      // First check localStorage for stored trip ID
      const storedTripId = localStorage.getItem("selectedTripId")

      if (storedTripId) {
        // Find the trip in the fetched trips
        const foundTrip = fetchedTrips.find((trip) => trip.id?.toString() === storedTripId)
        if (foundTrip) {
          // Immediately fetch full trip details
          try {
            const details = await tripsApiClient.getTripDetails(foundTrip.id)
            setSelectedTrip({ ...foundTrip, ...details })
          } catch (err) {
            console.error("Error fetching stored trip details:", err)
            setSelectedTrip(foundTrip)
          }
        } else if (fetchedTrips.length > 0) {
          // If stored trip not found but trips exist, select the first one
          try {
            const details = await tripsApiClient.getTripDetails(fetchedTrips[0].id)
            setSelectedTrip({ ...fetchedTrips[0], ...details })
            localStorage.setItem("selectedTripId", fetchedTrips[0].id?.toString() || "")
          } catch (err) {
            console.error("Error fetching first trip details:", err)
            setSelectedTrip(fetchedTrips[0])
          }
        }
      } else if (fetchedTrips.length > 0) {
        // If no stored trip but trips exist, select the first one
        try {
          const details = await tripsApiClient.getTripDetails(fetchedTrips[0].id)
          setSelectedTrip({ ...fetchedTrips[0], ...details })
          localStorage.setItem("selectedTripId", fetchedTrips[0].id?.toString() || "")
        } catch (err) {
          console.error("Error fetching first trip details:", err)
          setSelectedTrip(fetchedTrips[0])
        }
      }
    } catch (err) {
      console.error("Error fetching trips:", err)
      setError("Failed to load trips. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch of trips
  useEffect(() => {
    fetchTrips()
  }, [])

  // Remove the useEffect that listens for URL changes

  // Enhanced to support data refreshing without URL updates
  const handleSetSelectedTrip = async (trip: TripData) => {
    // Set loading state for smoother transitions
    setIsLoading(true)

    // First, immediately update the UI with the basic trip info
    setSelectedTrip(trip)
    localStorage.setItem("selectedTripId", trip.id?.toString() || "")

    // Then fetch the full details and update again
    try {
      const tripsApiClient = new TripsApiClient(authenticationProviderInstance)
      const details = await tripsApiClient.getTripDetails(trip.id)

      // Update with full details
      setSelectedTrip((prevTrip) => {
        if (prevTrip?.id === trip.id) {
          return { ...prevTrip, ...details }
        }
        return prevTrip
      })
    } catch (err) {
      console.error("Error fetching trip details:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshTrips = async () => {
    await fetchTrips()
  }

  return (
    <TripContext.Provider
      value={{
        trips,
        selectedTrip,
        isLoading,
        error,
        setSelectedTrip: (trip) => handleSetSelectedTrip(trip),
        refreshTrips,
      }}
    >
      {children}
    </TripContext.Provider>
  )
}
