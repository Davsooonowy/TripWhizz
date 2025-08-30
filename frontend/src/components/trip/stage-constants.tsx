import { Bed, Car, Camera, MapPin, Palmtree, Plane, Ship, Ticket, Train, Utensils } from 'lucide-react';

export const stageCategories: Array<{
  id: string;
  name: string;
  icon: any;
  color: string;
}> = [
  { id: 'accommodation', name: 'Accommodation', icon: Bed, color: 'bg-blue-500' },
  { id: 'transport', name: 'Transport', icon: Car, color: 'bg-green-500' },
  { id: 'flight', name: 'Flight', icon: Plane, color: 'bg-purple-500' },
  { id: 'dining', name: 'Dining', icon: Utensils, color: 'bg-amber-500' },
  { id: 'activity', name: 'Activity', icon: Camera, color: 'bg-pink-500' },
  { id: 'attraction', name: 'Attraction', icon: MapPin, color: 'bg-teal-500' },
  { id: 'event', name: 'Event', icon: Ticket, color: 'bg-red-500' },
  { id: 'cruise', name: 'Cruise', icon: Ship, color: 'bg-indigo-500' },
  { id: 'train', name: 'Train', icon: Train, color: 'bg-cyan-500' },
  { id: 'relaxation', name: 'Relaxation', icon: Palmtree, color: 'bg-orange-500' },
];


