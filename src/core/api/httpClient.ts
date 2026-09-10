import { ApiResponse } from '../../types/synapseTypes';
import { auth } from '../../../services/firebase';

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

  private async buildHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const dynamicHeaders = this.getHeaders ? this.getHeaders() : {};
    const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Correlation-ID': correlationId,
      ...dynamicHeaders,
      ...customHeaders,
    };

    const firebaseToken = await auth.currentUser?.getIdToken().catch(() => undefined);
    if (firebaseToken) headers.Authorization = `Bearer ${firebaseToken}`;
    return headers;
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'GET',
      headers: await this.buildHeaders(headers),
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
      headers: await this.buildHeaders(headers),
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
      headers: await this.buildHeaders(headers),
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

// A identidade Firebase atual é a única autoridade de bearer; uma sessão
// serializada no navegador nunca pode manter um token ou tenant obsoleto.
export const httpClient = new HttpClient();
