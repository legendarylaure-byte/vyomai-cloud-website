/**
 * Base API Client for Social Media Platforms
 * Provides common functionality for OAuth and API key authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { encrypt, decrypt } from '../crypto-utils.js';
import { storage } from '../storage.js';

export type AuthMethod = 'oauth' | 'api_key';

export interface PlatformConfig {
    platform: string;
    authMethod: AuthMethod;
    // OAuth fields
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    // API Key fields
    apiKey?: string;
    // Common fields
    accountId?: string;
    accountName?: string;
}

export interface SyncResult {
    success: boolean;
    platform: string;
    metricsUpdated: string[];
    error?: string;
}

/**
 * Base class for all social media API clients
 */
export abstract class BaseSocialMediaClient {
    protected platform: string;
    protected authMethod: AuthMethod;
    protected httpClient: AxiosInstance;
    protected config?: PlatformConfig;

    constructor(platform: string) {
        this.platform = platform;
        this.authMethod = 'oauth'; // Default, can be overridden

        this.httpClient = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Load configuration from database
     */
    async loadConfig(): Promise<void> {
        try {
            const apiConfig = await storage.getSocialMediaApiConfig(this.platform);
            const integration = await storage.getSocialMediaIntegration(this.platform);

            if (!apiConfig && !integration) {
                throw new Error(`No configuration found for ${this.platform}`);
            }

            // Decrypt sensitive data
            this.config = {
                platform: this.platform,
                authMethod: apiConfig?.apiKey ? 'api_key' : 'oauth',
                clientId: apiConfig?.clientId,
                clientSecret: apiConfig?.clientSecret ? decrypt(apiConfig.clientSecret) : undefined,
                accessToken: integration?.accessToken ? decrypt(integration.accessToken) : undefined,
                refreshToken: integration?.refreshToken ? decrypt(integration.refreshToken) : undefined,
                apiKey: apiConfig?.apiKey ? decrypt(apiConfig.apiKey) : undefined,
                accountId: integration?.accountId,
                accountName: integration?.accountName,
            };

            // @ts-ignore - Adding extra fields to config for internal use
            this.config.isManualMode = apiConfig?.isManualMode || false;
            // @ts-ignore
            this.config.autoSyncEnabled = apiConfig?.autoSyncEnabled || false;

            this.authMethod = this.config.authMethod;
        } catch (error) {
            console.error(`Failed to load config for ${this.platform}:`, error);
            throw error;
        }
    }

    /**
     * Check if the client is properly configured
     */
    isConfigured(): boolean {
        if (!this.config) return false;

        if (this.authMethod === 'oauth') {
            return !!(this.config.accessToken || this.config.refreshToken);
        } else {
            return !!this.config.apiKey;
        }
    }

    /**
     * Refresh OAuth access token (to be implemented by subclasses)
     */
    protected abstract refreshAccessToken(): Promise<void>;

    /**
     * Fetch analytics data (to be implemented by subclasses)
     */
    abstract fetchAnalytics(): Promise<any>;

    /**
     * Sync analytics data to database
     */
    async sync(): Promise<SyncResult> {
        const startTime = Date.now();
        const metricsUpdated: string[] = [];

        try {
            // Load configuration
            await this.loadConfig();

            // Skip sync if platform is in manual mode
            // @ts-ignore
            if (this.config?.isManualMode) {
                console.log(`ℹ️ Skipping sync for ${this.platform} (Manual Mode enabled)`);
                return {
                    success: true,
                    platform: this.platform,
                    metricsUpdated: [],
                };
            }

            if (!this.isConfigured()) {
                throw new Error(`${this.platform} is not properly configured`);
            }

            // Fetch analytics from platform
            const analytics = await this.fetchAnalytics();

            // Update database - now using numbers for integer fields
            await storage.updateSocialMediaAnalytics(this.platform, {
                followersCount: analytics.followers || 0,
                engagementRate: analytics.engagementRate || 0,
                impressions: analytics.impressions || 0,
                likes: analytics.likes || 0,
                shares: analytics.shares || 0,
                comments: analytics.comments || 0,
                postsCount: analytics.posts || 0,
            });

            // Track which metrics were updated
            if (analytics.followers) metricsUpdated.push('followers');
            if (analytics.engagementRate) metricsUpdated.push('engagement');
            if (analytics.impressions) metricsUpdated.push('impressions');
            if (analytics.likes) metricsUpdated.push('likes');
            if (analytics.shares) metricsUpdated.push('shares');
            if (analytics.comments) metricsUpdated.push('comments');

            // Log successful sync
            await storage.createSocialMediaSyncLog({
                platform: this.platform,
                syncType: 'auto',
                status: 'success',
                metricsUpdated,
            });

            // Update last sync time
            await storage.updateSocialMediaApiConfig(this.platform, {
                lastSyncAt: new Date(),
            });

            const duration = Date.now() - startTime;
            console.log(`✅ ${this.platform} sync completed in ${duration}ms`);

            return {
                success: true,
                platform: this.platform,
                metricsUpdated,
            };
        } catch (error: any) {
            console.error(`❌ ${this.platform} sync failed:`, error);

            // Log failed sync
            await storage.createSocialMediaSyncLog({
                platform: this.platform,
                syncType: 'auto',
                status: 'failed',
                errorMessage: error.message || 'Unknown error',
                metricsUpdated: [],
            });

            return {
                success: false,
                platform: this.platform,
                metricsUpdated: [],
                error: error.message || 'Unknown error',
            };
        }
    }

    /**
     * Make an authenticated API request
     */
    protected async makeRequest<T>(config: AxiosRequestConfig): Promise<T> {
        try {
            // Add authentication headers
            if (this.authMethod === 'oauth' && this.config?.accessToken) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${this.config.accessToken}`,
                };
            } else if (this.authMethod === 'api_key' && this.config?.apiKey) {
                // API key authentication (varies by platform)
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${this.config.apiKey}`,
                };
            }

            const response = await this.httpClient.request<T>(config);
            return response.data;
        } catch (error: any) {
            // Handle token expiration
            if (error.response?.status === 401 && this.authMethod === 'oauth') {
                console.log(`Token expired for ${this.platform}, refreshing...`);
                await this.refreshAccessToken();

                // Retry request with new token
                if (this.config?.accessToken) {
                    config.headers = {
                        ...config.headers,
                        'Authorization': `Bearer ${this.config.accessToken}`,
                    };
                }

                const response = await this.httpClient.request<T>(config);
                return response.data;
            }

            throw error;
        }
    }
}
