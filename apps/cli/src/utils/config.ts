import { GuardianConfig } from '../types';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: GuardianConfig = {
  apiUrl: process.env.GUARDIAN_API_URL || 'https://api.contextguardian.dev',
  apiKey: process.env.GUARDIAN_API_KEY,
  offlineMode: false,
  verbose: false,
};

/**
 * Gets the current configuration
 * 
 * Priority:
 * 1. Environment variables
 * 2. Default values
 * 
 * @returns Current configuration
 */
export function getConfig(): GuardianConfig {
  return {
    ...DEFAULT_CONFIG,
    apiUrl: process.env.GUARDIAN_API_URL || DEFAULT_CONFIG.apiUrl,
    apiKey: process.env.GUARDIAN_API_KEY || DEFAULT_CONFIG.apiKey,
    offlineMode: process.env.GUARDIAN_OFFLINE === 'true',
    verbose: process.env.GUARDIAN_VERBOSE === 'true',
  };
}

/**
 * Validates the configuration
 * 
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: GuardianConfig): void {
  if (!config.apiUrl && !config.offlineMode) {
    throw new Error('API URL is required when not in offline mode');
  }

  if (config.apiUrl && !isValidUrl(config.apiUrl)) {
    throw new Error(`Invalid API URL: ${config.apiUrl}`);
  }
}

/**
 * Checks if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
