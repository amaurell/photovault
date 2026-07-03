let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

function getBaseUrl(): string {
  return '/api';
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBaseUrl();
  }

  private getHeaders(contentType?: boolean): Record<string, string> {
    const headers: Record<string, string> = {};
    if (contentType !== false) headers['Content-Type'] = 'application/json';
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const hasJsonBody = body !== undefined && body !== null && !(body instanceof FormData);
    const options: RequestInit = {
      method,
      headers: this.getHeaders(hasJsonBody),
      credentials: 'include',
    };

    if (hasJsonBody) {
      options.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      options.body = body;
    }

    let response = await fetch(url, options);

    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        const retryOptions: RequestInit = {
          method,
          headers: this.getHeaders(hasJsonBody),
          credentials: 'include',
        };
        if (hasJsonBody) retryOptions.body = JSON.stringify(body);
        else if (body instanceof FormData) retryOptions.body = body;
        response = await fetch(url, retryOptions);
      }
    }

    if (response.status === 401) {
      accessToken = null;
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) return false;

        const data = await response.json();
        accessToken = data.accessToken;
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  async refreshOnInit(): Promise<boolean> {
    if (accessToken) return true;
    return this.tryRefreshToken();
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body?: any) { return this.request<T>('POST', path, body); }
  put<T>(path: string, body?: any) { return this.request<T>('PUT', path, body); }
  patch<T>(path: string, body?: any) { return this.request<T>('PATCH', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }
  upload<T>(path: string, formData: FormData) { return this.request<T>('POST', path, formData); }
}

export const api = new ApiClient();
