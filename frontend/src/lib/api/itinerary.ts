import { BaseApiClient } from '@/lib/api/base';
import { API_URL } from '@/lib/config';

const ITINERARY_API_URL = `${API_URL}/trips/trip`;

export interface ItineraryEventDto {
  id?: number;
  date: string;
  title: string;
  description?: string;
  start_minutes: number;
  end_minutes: number;
  color?: string | null;
}

export class ItineraryApiClient extends BaseApiClient {
  async listEvents(tripId: number, date?: string) {
    const url = new URL(`${ITINERARY_API_URL}/${tripId}/itinerary/events/`);
    if (date) url.searchParams.set('date', date);
    const response = await fetch(url.toString(), {
      ...this._requestConfiguration(true),
      method: 'GET',
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return (await response.json()) as ItineraryEventDto[];
  }

  async createEvent(tripId: number, data: ItineraryEventDto) {
    const response = await fetch(
      `${ITINERARY_API_URL}/${tripId}/itinerary/events/`,
      {
        ...this._requestConfiguration(true),
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return (await response.json()) as ItineraryEventDto;
  }

  async updateEvent(
    tripId: number,
    eventId: number,
    data: Partial<ItineraryEventDto>,
  ) {
    const response = await fetch(
      `${ITINERARY_API_URL}/${tripId}/itinerary/events/${eventId}/`,
      {
        ...this._requestConfiguration(true),
        method: 'PUT',
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return (await response.json()) as ItineraryEventDto;
  }

  async deleteEvent(tripId: number, eventId: number) {
    const response = await fetch(
      `${ITINERARY_API_URL}/${tripId}/itinerary/events/${eventId}/`,
      {
        ...this._requestConfiguration(true),
        method: 'DELETE',
      },
    );
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return true;
  }
}
