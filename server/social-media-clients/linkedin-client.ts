/**
 * LinkedIn API Client
 * Supports OAuth 2.0 authentication
 */

import { BaseSocialMediaClient } from './base-client.js';
import { encrypt } from '../crypto-utils.js';
import { storage } from '../storage.js';

export class LinkedInClient extends BaseSocialMediaClient {
    private readonly apiUrl = 'https://api.linkedin.com/v2';

    constructor() {
        super('linkedin');
    }

    /**
     * Refresh OAuth access token
     */
    protected async refreshAccessToken(): Promise<void> {
        try {
            if (!this.config?.clientId || !this.config?.clientSecret || !this.config?.refreshToken) {
                throw new Error('Client credentials and refresh token required');
            }

            const response = await this.httpClient.post(
                'https://www.linkedin.com/oauth/v2/accessToken',
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.config.refreshToken,
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            if (response.data.access_token) {
                this.config.accessToken = response.data.access_token;

                await storage.updateSocialMediaIntegration(this.platform, {
                    accessToken: encrypt(response.data.access_token),
                });

                console.log(`✅ LinkedIn access token refreshed`);
            }
        } catch (error) {
            console.error('Failed to refresh LinkedIn access token:', error);
            throw error;
        }
    }

    /**
     * Fetch analytics data from LinkedIn Organization
     */
    async fetchAnalytics(): Promise<any> {
        try {
            const analytics: any = {
                followers: 0,
                engagementRate: 0,
                impressions: 0,
                likes: 0,
                shares: 0,
                comments: 0,
                posts: 0,
            };

            // Get organization info
            const orgResponse = await this.makeRequest<any>({
                method: 'GET',
                url: `${this.apiUrl}/organizations/${this.config?.accountId}`,
                params: {
                    projection: '(id,localizedName,vanityName)',
                },
            });

            // Get follower statistics
            const followersResponse = await this.makeRequest<any>({
                method: 'GET',
                url: `${this.apiUrl}/networkSizes/${this.config?.accountId}`,
                params: {
                    edgeType: 'CompanyFollowedByMember',
                },
            });

            analytics.followers = followersResponse.firstDegreeSize || 0;

            // Get organization shares (posts)
            const sharesResponse = await this.makeRequest<any>({
                method: 'GET',
                url: `${this.apiUrl}/shares`,
                params: {
                    q: 'owners',
                    owners: `urn:li:organization:${this.config?.accountId}`,
                    count: 10,
                },
            });

            if (sharesResponse.elements) {
                analytics.posts = sharesResponse.elements.length;

                // Calculate engagement from shares
                sharesResponse.elements.forEach((share: any) => {
                    const totalShareStatistics = share.totalShareStatistics || {};
                    analytics.likes += totalShareStatistics.likeCount || 0;
                    analytics.shares += totalShareStatistics.shareCount || 0;
                    analytics.comments += totalShareStatistics.commentCount || 0;
                    analytics.impressions += totalShareStatistics.impressionCount || 0;
                });

                // Calculate engagement rate
                if (analytics.impressions > 0) {
                    const totalEngagement = analytics.likes + analytics.shares + analytics.comments;
                    analytics.engagementRate = parseFloat(
                        ((totalEngagement / analytics.impressions) * 100).toFixed(2)
                    );
                }
            }

            // Store account info
            if (orgResponse.id && !this.config?.accountName) {
                await storage.updateSocialMediaIntegration(this.platform, {
                    accountName: orgResponse.localizedName || 'LinkedIn Organization',
                });
            }

            return analytics;
        } catch (error: any) {
            console.error('LinkedIn API error:', error);
            throw new Error(`Failed to fetch LinkedIn analytics: ${error.message}`);
        }
    }

    /**
     * Get OAuth authorization URL
     */
    static getAuthUrl(clientId: string, redirectUri: string): string {
        const scopes = ['r_organization_social', 'rw_organization_admin', 'r_basicprofile'];

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scopes.join(' '),
            state: 'linkedin',
        });

        return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    static async exchangeCodeForTokens(
        code: string,
        clientId: string,
        clientSecret: string,
        redirectUri: string
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const { default: axios } = await import('axios');

        const response = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        if (!response.data.access_token) {
            throw new Error('No access token received');
        }

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token || '',
        };
    }
}
