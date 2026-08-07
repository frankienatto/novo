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
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Correlation-ID': correlationId,
      'X-Organization-ID': dynamicHeaders['org-id'] || 'org_dev_default',
      'X-Property-ID': dynamicHeaders['property-id'] || 'prop_dev_default',
      ...dynamicHeaders,
      ...customHeaders,
    };
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
    const orgId = localStorage.getItem('synapse_org_id') || 'org_dev_default';
    const propertyId = localStorage.getItem('synapse_prop_id') || 'prop_dev_default';
    return {
      'org-id': orgId,
      'property-id': propertyId,
    };
  }
});
