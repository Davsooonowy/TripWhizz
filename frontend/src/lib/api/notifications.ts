import { BaseApiClient } from '@/lib/api/base.ts';
import { API_URL } from '@/lib/config.ts';
import type { User } from '@/lib/api/users.ts';

export interface Notification {
  id: number;
  sender: User | null;
  notification_type:
    | 'friend_request'
    | 'friend_accept'
    | 'trip_invite'
    | 'trip_update'
    | 'expense_update';
  title: string;
  message: string;
  is_read: boolean;
  related_object_id: number | null;
  created_at: string;
}

export class NotificationsApiClient extends BaseApiClient {
  async getNotifications() {
    const response = await fetch(`${API_URL}/notifications/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as Notification[];
  }

  async getUnreadCount() {
    const response = await fetch(`${API_URL}/notifications/count/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as { count: number };
  }

  async markAsRead(notificationId: number) {
    const response = await fetch(
      `${API_URL}/notifications/read/${notificationId}/`,
      {
        ...this._requestConfiguration(true),
        method: 'PUT',
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as Notification;
  }

  async markAllAsRead() {
    const response = await fetch(`${API_URL}/notifications/read/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as { message: string };
  }
}
