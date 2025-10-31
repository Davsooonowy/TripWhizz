import TripMaps from '@/components/itinerary/maps';
import { useTripContext } from '@/components/util/trip-context';

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function TripMapsPage() {
  const { tripId } = useParams();
  const { selectedTrip } = useTripContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedTrip?.id && tripId && selectedTrip.id.toString() !== tripId) {
      navigate(`/trip/${selectedTrip.id}/maps`, { replace: true });
    }
  }, [selectedTrip?.id, tripId, navigate]);

  return <TripMaps tripId={tripId} />;
}
