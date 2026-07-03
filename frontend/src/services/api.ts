declare const API_URL: string;

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  return API_URL || 'http://localhost:3001';
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBaseUrl();
  }

  private getHeaders(contentType?: boolean): Record<string, string> {
    const headers: Record<string, string> = {};
    if (contentType !== false) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const hasJsonBody = body !== undefined && body !== null && !(body instanceof FormData);
    const options: RequestInit = {
      method,
      headers: this.getHeaders(hasJsonBody),
    };

    if (hasJsonBody) {
      options.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      options.body = body;
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        const retryOptions: RequestInit = {
          method,
          headers: this.getHeaders(hasJsonBody),
        };
        if (hasJsonBody) retryOptions.body = JSON.stringify(body);
        else if (body instanceof FormData) retryOptions.body = body;
        const retryResponse = await fetch(url, retryOptions);
        if (!retryResponse.ok) {
          const err = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || 'Request failed');
        }
        return retryResponse.json();
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body?: any) { return this.request<T>('POST', path, body); }
  put<T>(path: string, body?: any) { return this.request<T>('PUT', path, body); }
  patch<T>(path: string, body?: any) { return this.request<T>('PATCH', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }
  upload<T>(path: string, formData: FormData) { return this.request<T>('POST', path, formData); }
}

export const api = new ApiClient();
