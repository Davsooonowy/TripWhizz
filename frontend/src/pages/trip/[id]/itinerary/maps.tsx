import TripMaps from '@/components/itinerary/maps';

import { useParams } from 'react-router-dom';

export default function TripMapsPage() {
  const { tripId } = useParams();
  return <TripMaps tripId={tripId} />;
}
