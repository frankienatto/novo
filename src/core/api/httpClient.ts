import { ApiResponse } from '../../types/synapseTypes';

export interface HttpClientConfig {
  baseUrl?: string;
  getHeaders?: () => Record<string, string>;
}

class HttpClient {
  private baseUrl: string;
  private getHeaders?: () => Record<string, string>;

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.getHeaders = config.getHeaders;
  }

  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const dynamicHeaders = this.getHeaders ? this.getHeaders() : {};
    const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Correlation-ID': correlationId,
      ...dynamicHeaders,
      ...customHeaders,
    };

    return headers;
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'GET',
      headers: this.buildHeaders(headers),
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMessage = errorData.message;
        if (errorData.error?.message) errorMessage = errorData.error.message;
      } catch {
        // Ignora falha de parse
      }
      throw new Error(errorMessage);
    }

    const json = await response.json();
    return json as T;
  }

  async post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers: this.buildHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMessage = errorData.message;
        if (errorData.error?.message) errorMessage = errorData.error.message;
      } catch {
        // Ignora falha de parse
      }
      throw new Error(errorMessage);
    }

    const json = await response.json();
    return json as T;
  }

  async put<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'PUT',
      headers: this.buildHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMessage = errorData.message;
      } catch {
        // Ignora
      }
      throw new Error(errorMessage);
    }

    const json = await response.json();
    return json as T;
  }
}

export const httpClient = new HttpClient({
  getHeaders: () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return {};
    }
    const headers: Record<string, string> = {};
    try {
      const sessionRaw = localStorage.getItem('synapse_hospitality_session');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session && typeof session.token === 'string' && session.token.startsWith('ey')) {
          headers['Authorization'] = `Bearer ${session.token}`;
        }
      }
    } catch {
      // Ignora erro de parse da sessão
    }
    return headers;
  }
});
