import { BaseApiClient } from '@/lib/api/base.ts';
import { API_URL } from '@/lib/config.ts';

export interface BasicUserData {
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  message: string;
  user_id: number;
  token: string;
  onboarding_complete: boolean;
}

export interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  surname?: string;
  avatar?: File | null;
  onboarding_complete?: boolean;
}

export class UsersApiClient extends BaseApiClient {
  async createUser(user: BasicUserData): Promise<RegisterUserResponse> {
    const response = await fetch(`${API_URL}/user/`, {
      ...this._requestConfiguration(false),
      method: 'POST',
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async loginUser(user: BasicUserData): Promise<RegisterUserResponse> {
    const response = await fetch(`${API_URL}/user/login/`, {
      ...this._requestConfiguration(false),
      method: 'POST',
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    return response.json();
  }

  async getActiveUser(): Promise<User> {
    const response = await fetch(`${API_URL}/user/me/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return response.json();
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const response = await fetch(`${API_URL}/user/password-reset/`, {
      ...this._requestConfiguration(false),
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to send password reset email');
    }
  }

  async resetPassword(
    uid: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/user/password-reset-confirm/${uid}/${token}/`,
      {
        ...this._requestConfiguration(false),
        method: 'POST',
        body: JSON.stringify({
          new_password: newPassword,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to reset password');
    }
  }

  async updateUser(user: Partial<User>): Promise<void> {
    const payload = {
      first_name: user.name,
      last_name: user.surname,
      username: user.username,
      avatar: user.avatar,
      onboarding_complete: user.onboarding_complete,
    };

    const response = await fetch(`${API_URL}/user/me/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to update user data');
    }
  }
}
