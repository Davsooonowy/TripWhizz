import { AuthenticationProvider } from "@/lib/authentication-provider.ts";

export abstract class BaseApiClient {
  constructor(protected readonly authenticationProvider: AuthenticationProvider) {}

  _requestConfiguration(authRequired = true): RequestInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authRequired && this.authenticationProvider.isAuthenticated()) {
      headers["Authorization"] = `Token ${this.authenticationProvider.token}`;
    }

    return { headers };
  }
}