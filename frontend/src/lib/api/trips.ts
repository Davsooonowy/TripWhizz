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

export interface TripParticipant {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
  invitation_status?: 'accepted' | 'pending' | 'rejected';
}

export interface TripOwner {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
}

export interface TripInvitation {
  id: number;
  trip: number;
  trip_name: string;
  inviter: TripOwner;
  invitee: TripParticipant;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at?: string;
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
  owner?: TripOwner;
  participants?: TripParticipant[];
  stages?: TripStage[];
  created_at?: string;
  updated_at?: string;
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

  async inviteToTrip(tripId: number, inviteeId: number) {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/invite/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify({ invitee_id: inviteeId }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async removeParticipant(tripId: number, participantId: number) {
    const response = await fetch(
      `${TRIP_API_URL}/${tripId}/participants/${participantId}/`,
      {
        ...this._requestConfiguration(true),
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async respondToInvitation(invitationId: number, action: 'accept' | 'reject') {
    const response = await fetch(
      `${API_URL}/trips/invitation/${invitationId}/respond/`,
      {
        ...this._requestConfiguration(true),
        method: 'PUT',
        body: JSON.stringify({ action }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error HTTP: ${response.status}`);
    }

    return await response.json();
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

export interface TripMapPin {
  id: number;
  trip: number;
  created_by: TripOwner;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TripMapSettings {
  default_latitude?: number | null;
  default_longitude?: number | null;
  default_zoom?: number | null;
}

export class TripMapsApiClient extends BaseApiClient {
  async getPins(tripId: number): Promise<TripMapPin[]> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/maps/pins/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  }

  async createPin(tripId: number, data: Partial<TripMapPin>): Promise<TripMapPin> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/maps/pins/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  }

  async updatePin(tripId: number, pinId: number, data: Partial<TripMapPin>): Promise<TripMapPin> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/maps/pins/${pinId}/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  }

  async deletePin(tripId: number, pinId: number): Promise<void> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/maps/pins/${pinId}/`, {
      ...this._requestConfiguration(true),
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  }

  async getSettings(tripId: number): Promise<TripMapSettings> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/maps/settings/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  }

  async updateSettings(tripId: number, data: Partial<TripMapSettings>): Promise<TripMapSettings> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/maps/settings/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  }
}