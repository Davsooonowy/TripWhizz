import { BaseApiClient } from '@/lib/api/base.ts';
import { API_URL } from '@/lib/config.ts';

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

export interface Trip {
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
  async getTrips(): Promise<Trip[]> {
    const response = await fetch(`${API_URL}/api/trip/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as Trip[];
  }

  async createTrip(tripData: {
    name: string;
    destination: string;
    description: string;
    trip_type: 'private' | 'public';
    icon: string;
    icon_color: string;
    tags: string[];
    invite_permission: string
  }): Promise<Trip> {
      if (!this.authenticationProvider.isAuthenticated()) {
    console.error("User is not authenticated");
    throw new Error("Authentication required to create a trip");
  }
    const formattedData = {
      ...tripData
      // start_date: tripData.start_date
      //   ? new Date(tripData.start_date).toISOString().split('T')[0]
      //   : undefined,
      // end_date: tripData.end_date
      //   ? new Date(tripData.end_date).toISOString().split('T')[0]
      //   : undefined,
    };

    const response = await fetch(`${API_URL}/api/trip/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as Trip;
  }

  async getTripDetails(tripId: number): Promise<Trip> {
    const response = await fetch(`${API_URL}/api/trip/${tripId}/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as Trip;
  }

  async updateTrip(tripId: number, tripData: Partial<Trip>): Promise<Trip> {
    const formattedData = {
      ...tripData,
      start_date: tripData.start_date
        ? new Date(tripData.start_date).toISOString().split('T')[0]
        : undefined,
      end_date: tripData.end_date
        ? new Date(tripData.end_date).toISOString().split('T')[0]
        : undefined,
    };

    const response = await fetch(`${API_URL}/api/trip/${tripId}/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as Trip;
  }

  async deleteTrip(tripId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/trip/${tripId}/`, {
      ...this._requestConfiguration(true),
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
  }

  async createStages(tripId: number, stages: TripStage[]): Promise<TripStage[]> {
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
      `${API_URL}/api/trip/${tripId}/batch-create-stages/`,
      {
        ...this._requestConfiguration(true),
        method: 'POST',
        body: JSON.stringify({ stages: formattedStages }),
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as TripStage[];
  }

  async reorderStages(tripId: number, stageIds: string[]): Promise<void> {
    const response = await fetch(`${API_URL}/api/trip/${tripId}/reorder-stages/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify({ stage_ids: stageIds }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
  }
}
