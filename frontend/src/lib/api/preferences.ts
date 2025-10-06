import { BaseApiClient } from '@/lib/api/base';
import { API_URL } from '@/lib/config';

export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'trip_invite'
  | 'trip_update'
  | 'expense_update'
  | 'comment_mention'
  | 'trip_invitation_reminder'
  | 'packing_changes'
  | 'itinerary_changes';

export interface UserPreferencesDTO {
  id?: number;
  data: {
    notifications?:
      | (Partial<Record<NotificationType, boolean>> & {
          push_enabled?: boolean;
          email_enabled?: boolean;
          digest_enabled?: boolean;
          quiet_hours?: { start: string; end: string };
          friend_acceptance?: boolean;
          expense_added?: boolean;
          packing_list_added?: boolean;
          document_added?: boolean;
        })
      | undefined;
    trip_sort?: 'name' | 'date';
    privacy?: {
      profile_visible?: boolean;
      show_online_status?: boolean;
    };
    appearance?: {
      dark_mode?: boolean;
      preset?: 'default' | 'rose' | 'emerald' | 'slate';
    };
  };
  created_at?: string;
  updated_at?: string;
}

const PREFS_URL = `${API_URL}/auth/user/preferences/`;

export class PreferencesApiClient extends BaseApiClient {
  async getPreferences(): Promise<UserPreferencesDTO> {
    const response = await fetch(PREFS_URL, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return (await response.json()) as UserPreferencesDTO;
  }

  async updatePreferences(payload: Partial<UserPreferencesDTO>): Promise<UserPreferencesDTO> {
    const response = await fetch(PREFS_URL, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return (await response.json()) as UserPreferencesDTO;
  }
}


