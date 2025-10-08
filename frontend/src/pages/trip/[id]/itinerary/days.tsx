import DayPlanner from '@/components/itinerary/day-planner';

import { useParams } from 'react-router-dom';

export default function TripItineraryDaysPage() {
  const { id } = useParams();
  return <DayPlanner tripId={id} />;
}
