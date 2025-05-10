import { BaseApiClient } from '@/lib/api/base.ts';
import { API_URL } from '@/lib/config.ts';

const TRIP_API_URL = `${API_URL}/trips/trip`;

export interface TripStage {
  id?: string;
  name: string;
  category: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  order: number;
  is_custom_category?: boolean;
  custom_category_color?: string;
}

export interface TripData {
  id?: number;
  name: string;
  destination: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  trip_type: 'private' | 'public';
  icon?: string;
  icon_color?: string;
  tags?: string[];
  invite_permission?: 'admin-only' | 'members-can-invite';
}

export class TripsApiClient extends BaseApiClient {
  async getTrips() {
    const response = await fetch(`${TRIP_API_URL}/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async createTrip(tripData: TripData) {
    // Convert date objects to ISO strings if they exist
    const formattedData = {
      ...tripData,
      start_date: tripData.start_date
        ? new Date(tripData.start_date).toISOString().split('T')[0]
        : undefined,
      end_date: tripData.end_date
        ? new Date(tripData.end_date).toISOString().split('T')[0]
        : undefined,
    };

    const response = await fetch(`${TRIP_API_URL}/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async getTripDetails(tripId: number) {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async updateTrip(tripId: number, tripData: Partial<TripData>) {
    // Convert date objects to ISO strings if they exist
    const formattedData = {
      ...tripData,
      start_date: tripData.start_date
        ? new Date(tripData.start_date).toISOString().split('T')[0]
        : undefined,
      end_date: tripData.end_date
        ? new Date(tripData.end_date).toISOString().split('T')[0]
        : undefined,
    };

    const response = await fetch(`${TRIP_API_URL}/${tripId}/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async deleteTrip(tripId: number) {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/`, {
      ...this._requestConfiguration(true),
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return true;
  }

  async createStages(tripId: number, stages: TripStage[]) {
    // Format dates for each stage
    const formattedStages = stages.map((stage) => ({
      ...stage,
      start_date: stage.start_date
        ? new Date(stage.start_date).toISOString().split('T')[0]
        : undefined,
      end_date: stage.end_date
        ? new Date(stage.end_date).toISOString().split('T')[0]
        : undefined,
    }));

    const response = await fetch(
      `${TRIP_API_URL}/${tripId}/batch-create-stages/`,
      {
        ...this._requestConfiguration(true),
        method: 'POST',
        body: JSON.stringify({ stages: formattedStages }),
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async reorderStages(tripId: number, stageIds: string[]) {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/reorder-stages/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify({ stage_ids: stageIds }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }
}
