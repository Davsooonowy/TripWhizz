import ActivitiesList from '@/components/itinerary/activities-list';

import { useParams } from 'react-router-dom';

export default function TripItineraryActivitiesPage() {
  const { tripId } = useParams();
  return <ActivitiesList tripId={tripId} />;
}
