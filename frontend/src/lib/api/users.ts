import { BaseApiClient } from "@/lib/api/base.ts";
import { API_URL } from "@/lib/config.ts";

export interface BasicUserData {
    email: string;
    password: string;
}

export interface RegisterUserResponse {
    message: string;
    user_id: number;
    token: string;
}

export interface UserData {
    username: string;
    email: string;
    avatar: string;
}

export class UsersApiClient extends BaseApiClient {
    async createUser(user : BasicUserData): Promise<RegisterUserResponse> {
        const response = await fetch(`${API_URL}/user/`, {
            ...this._requestConfiguration(false),
            method: "POST",
            body: JSON.stringify(user)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        return await response.json();
    }

    async loginUser(user : BasicUserData): Promise<RegisterUserResponse> {
        const response = await fetch(`${API_URL}/user/login/`, {
            ...this._requestConfiguration(false),
            method: "POST",
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            throw new Error("Invalid credentials");
        }

        return response.json();
    }
}
