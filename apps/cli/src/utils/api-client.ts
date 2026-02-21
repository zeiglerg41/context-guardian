import axios, { AxiosInstance } from 'axios';
import { GeneratePlaybookRequest, GeneratePlaybookResponse } from '../types';
import { getConfig } from './config';

/**
 * API client for communicating with Context Guardian cloud services
 */
export class ApiClient {
  private client: AxiosInstance;
  private apiKey?: string;

  constructor(apiUrl?: string, apiKey?: string) {
    const config = getConfig();

    this.client = axios.create({
      baseURL: apiUrl || config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `context-guardian-cli/${require('../../package.json').version}`,
      },
    });

    this.apiKey = apiKey || config.apiKey;

    // Add auth header if API key is present
    if (this.apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.apiKey}`;
    }
  }

  /**
   * Generates a playbook by sending analysis payload to the API
   */
  async generatePlaybook(payload: GeneratePlaybookRequest): Promise<GeneratePlaybookResponse> {
    try {
      const response = await this.client.post<GeneratePlaybookResponse>(
        '/api/v1/generate-playbook',
        payload
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(
            `API error (${error.response.status}): ${error.response.data?.message || error.message}`
          );
        } else if (error.request) {
          throw new Error('Unable to reach Context Guardian API. Check your internet connection.');
        }
      }
      throw error;
    }
  }

  /**
   * Health check to verify API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
