/**
 * Twitter (X) API v2 Client
 * Supports OAuth 2.0 authentication
 */

import { BaseSocialMediaClient } from './base-client.js';
import { encrypt } from '../crypto-utils.js';
import { storage } from '../storage.js';

export class TwitterClient extends BaseSocialMediaClient {
    private readonly apiUrl = 'https://api.twitter.com/2';

    constructor() {
        super('twitter');
    }

    /**
     * Refresh OAuth access token
     */
    protected async refreshAccessToken(): Promise<void> {
        try {
            if (!this.config?.clientId || !this.config?.clientSecret || !this.config?.refreshToken) {
                throw new Error('Client credentials and refresh token required');
            }

            const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

            const response = await this.httpClient.post(
                'https://api.twitter.com/2/oauth2/token',
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.config.refreshToken,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${credentials}`,
                    },
                }
            );

            if (response.data.access_token) {
                this.config.accessToken = response.data.access_token;
                if (response.data.refresh_token) {
                    this.config.refreshToken = response.data.refresh_token;
                }

                await storage.updateSocialMediaIntegration(this.platform, {
                    accessToken: encrypt(response.data.access_token),
                    refreshToken: response.data.refresh_token ? encrypt(response.data.refresh_token) : undefined,
                });

                console.log(`✅ Twitter access token refreshed`);
            }
        } catch (error) {
            console.error('Failed to refresh Twitter access token:', error);
            throw error;
        }
    }

    /**
     * Fetch analytics data from Twitter
     */
    async fetchAnalytics(): Promise<any> {
        try {
            const analytics: any = {
                followers: 0,
                engagementRate: 0,
                impressions: 0,
                likes: 0,
                shares: 0, // retweets
                comments: 0, // replies
                posts: 0,
            };

            // Get authenticated user's info
            const userResponse = await this.makeRequest<any>({
                method: 'GET',
                url: `${this.apiUrl}/users/me`,
                params: {
                    'user.fields': 'public_metrics,username',
                },
            });

            if (userResponse.data) {
                const metrics = userResponse.data.public_metrics;
                analytics.followers = metrics.followers_count || 0;
                analytics.posts = metrics.tweet_count || 0;

                // Store account info
                if (userResponse.data.id && !this.config?.accountId) {
                    await storage.updateSocialMediaIntegration(this.platform, {
                        accountId: userResponse.data.id,
                        accountName: `@${userResponse.data.username}` || 'Twitter Account',
                    });
                }

                // Get recent tweets
                const tweetsResponse = await this.makeRequest<any>({
                    method: 'GET',
                    url: `${this.apiUrl}/users/${userResponse.data.id}/tweets`,
                    params: {
                        max_results: 10,
                        'tweet.fields': 'public_metrics',
                    },
                });

                if (tweetsResponse.data) {
                    let totalImpressions = 0;
                    let totalEngagement = 0;

                    tweetsResponse.data.forEach((tweet: any) => {
                        const metrics = tweet.public_metrics;
                        analytics.likes += metrics.like_count || 0;
                        analytics.shares += metrics.retweet_count || 0;
                        analytics.comments += metrics.reply_count || 0;
                        totalImpressions += metrics.impression_count || 0;
                        totalEngagement += (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0);
                    });

                    analytics.impressions = totalImpressions;

                    // Calculate engagement rate
                    if (totalImpressions > 0) {
                        analytics.engagementRate = parseFloat(
                            ((totalEngagement / totalImpressions) * 100).toFixed(2)
                        );
                    }
                }
            }

            return analytics;
        } catch (error: any) {
            console.error('Twitter API error:', error);
            throw new Error(`Failed to fetch Twitter analytics: ${error.message}`);
        }
    }

    /**
     * Get OAuth authorization URL
     */
    static getAuthUrl(clientId: string, redirectUri: string): string {
        const scopes = ['tweet.read', 'users.read', 'follows.read', 'offline.access'];

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scopes.join(' '),
            state: 'twitter',
            code_challenge: 'challenge', // PKCE required for Twitter OAuth 2.0
            code_challenge_method: 'plain',
        });

        return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
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
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await axios.post(
            'https://api.twitter.com/2/oauth2/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                code_verifier: 'challenge', // Must match code_challenge
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${credentials}`,
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
