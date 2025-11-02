import { BaseApiClient } from '@/lib/api/base.ts';
import { API_URL } from '@/lib/config.ts';

const AUTH_API_URL = `${API_URL}/auth/user`;

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
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  onboarding_complete?: boolean;
}

export class UsersApiClient extends BaseApiClient {
  async createUser(user: BasicUserData): Promise<RegisterUserResponse> {
    const response = await fetch(`${AUTH_API_URL}/`, {
      ...this._requestConfiguration(false),
      method: 'POST',
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return (await response.json()) as Promise<RegisterUserResponse>;
  }

  async loginUser(user: BasicUserData): Promise<RegisterUserResponse> {
    const response = await fetch(`${AUTH_API_URL}/login/`, {
      ...this._requestConfiguration(false),
      method: 'POST',
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    return (await response.json()) as Promise<RegisterUserResponse>;
  }

  async getActiveUser(): Promise<User> {
    const response = await fetch(`${AUTH_API_URL}/me/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return (await response.json()) as Promise<User>;
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const response = await fetch(`${AUTH_API_URL}/password-reset/`, {
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
      `${AUTH_API_URL}/password-reset-confirm/${uid}/${token}/`,
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

  async updateUser(
    userData: Partial<User> & { avatar?: File | null | undefined },
  ): Promise<User> {
    // Create FormData for multipart/form-data requests (needed for file uploads)
    const formData = new FormData();

    // Add all user data to FormData
    if (userData.first_name) formData.append('first_name', userData.first_name);
    if (userData.last_name) formData.append('last_name', userData.last_name);
    if (userData.username) formData.append('username', userData.username);
    if (userData.onboarding_complete !== undefined)
      formData.append(
        'onboarding_complete',
        String(userData.onboarding_complete),
      );

    if (userData.avatar && typeof userData.avatar !== 'string') {
      const avatarFile = userData.avatar as File;
      if (avatarFile instanceof File) {
        formData.append('avatar', avatarFile);
      }
    }

    // Send the request
    const response = await fetch(`${AUTH_API_URL}/me/`, {
      headers: {
        Authorization: `Token ${this.authenticationProvider.token}`,
      },
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update user data');
    }

    return await response.json();
  }

  async verifyOtp(
    email: string | null,
    code: string,
  ): Promise<RegisterUserResponse> {
    const response = await fetch(`${AUTH_API_URL}/verify/`, {
      ...this._requestConfiguration(false),
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify OTP');
    }

    return (await response.json()) as Promise<RegisterUserResponse>;
  }

  async resendOtp(email: string | null): Promise<void> {
    const response = await fetch(`${AUTH_API_URL}/resend-otp/`, {
      ...this._requestConfiguration(false),
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to resend OTP');
    }
  }

  async deleteAccount(userId: number): Promise<void> {
    const response = await fetch(`${AUTH_API_URL}/${userId}/`, {
      ...this._requestConfiguration(true),
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete account');
    }
  }
}
