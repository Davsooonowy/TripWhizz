import { BaseApiClient } from '@/lib/api/base.ts';
import { API_URL } from '@/lib/config.ts';
import type { User } from '@/lib/api/users.ts';

export interface FriendRequest {
  id: number;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface FriendRequestsResponse {
  sent: FriendRequest[];
  received: FriendRequest[];
}

export class FriendsApiClient extends BaseApiClient {
  async getFriends() {
    const response = await fetch(`${API_URL}/friends/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as User[];
  }

  async getFriendRequests() {
    const response = await fetch(`${API_URL}/friends/requests/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as FriendRequestsResponse;
  }

  async sendFriendRequest(receiverId: number) {
    const response = await fetch(`${API_URL}/friends/request/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as FriendRequest;
  }

  async respondToFriendRequest(requestId: number, action: 'accept' | 'reject') {
    const response = await fetch(`${API_URL}/friends/request/${requestId}/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as FriendRequest;
  }

  async searchUsers(query: string) {
    const response = await fetch(
      `${API_URL}/friends/search/?search=${encodeURIComponent(query)}`,
      {
        ...this._requestConfiguration(true),
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as User[];
  }

  async removeFriend(friendId: number) {
    const response = await fetch(`${API_URL}/friends/${friendId}/`, {
      ...this._requestConfiguration(true),
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return true;
  }
}
