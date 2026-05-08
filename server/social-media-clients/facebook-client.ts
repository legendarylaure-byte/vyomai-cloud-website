/**
 * Facebook & Instagram Graph API Client
 * Both platforms use the same Facebook Graph API
 * Supports OAuth 2.0 authentication
 */

import { BaseSocialMediaClient } from './base-client.js';
import { encrypt } from '../crypto-utils.js';
import { storage } from '../storage.js';

export class FacebookClient extends BaseSocialMediaClient {
    private readonly graphApiUrl = 'https://graph.facebook.com/v18.0';

    constructor(platform: 'facebook' | 'instagram' = 'facebook') {
        super(platform);
    }

    /**
     * Refresh OAuth access token
     */
    protected async refreshAccessToken(): Promise<void> {
        try {
            if (!this.config?.clientId || !this.config?.clientSecret) {
                throw new Error('Client ID and secret required for token refresh');
            }

            // Facebook long-lived tokens don't expire frequently
            // This is a placeholder for token exchange if needed
            console.log(`Facebook tokens are long-lived. Manual refresh may be needed.`);
        } catch (error) {
            console.error('Failed to refresh Facebook access token:', error);
            throw error;
        }
    }

    /**
     * Fetch analytics data from Facebook Page
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

            if (this.platform === 'facebook') {
                // Get Facebook Page data
                const pageData = await this.makeRequest<any>({
                    method: 'GET',
                    url: `${this.graphApiUrl}/me`,
                    params: {
                        fields: 'id,name,followers_count,fan_count',
                    },
                });

                analytics.followers = pageData.followers_count || pageData.fan_count || 0;

                // Get Page insights
                const insightsData = await this.makeRequest<any>({
                    method: 'GET',
                    url: `${this.graphApiUrl}/${pageData.id}/insights`,
                    params: {
                        metric: 'page_impressions,page_post_engagements,page_fans',
                        period: 'day',
                        since: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // Last 7 days
                    },
                });

                if (insightsData.data) {
                    insightsData.data.forEach((metric: any) => {
                        if (metric.name === 'page_impressions' && metric.values?.length > 0) {
                            analytics.impressions = metric.values[metric.values.length - 1].value || 0;
                        }
                        if (metric.name === 'page_post_engagements' && metric.values?.length > 0) {
                            const engagements = metric.values[metric.values.length - 1].value || 0;
                            if (analytics.impressions > 0) {
                                analytics.engagementRate = parseFloat(
                                    ((engagements / analytics.impressions) * 100).toFixed(2)
                                );
                            }
                        }
                    });
                }

                // Get recent posts
                const postsData = await this.makeRequest<any>({
                    method: 'GET',
                    url: `${this.graphApiUrl}/${pageData.id}/posts`,
                    params: {
                        fields: 'likes.summary(true),comments.summary(true),shares',
                        limit: 10,
                    },
                });

                if (postsData.data) {
                    analytics.posts = postsData.data.length;

                    postsData.data.forEach((post: any) => {
                        analytics.likes += post.likes?.summary?.total_count || 0;
                        analytics.comments += post.comments?.summary?.total_count || 0;
                        analytics.shares += post.shares?.count || 0;
                    });
                }

                // Store account info
                if (pageData.id && !this.config?.accountId) {
                    await storage.updateSocialMediaIntegration(this.platform, {
                        accountId: pageData.id,
                        accountName: pageData.name || 'Facebook Page',
                    });
                }
            } else if (this.platform === 'instagram') {
                // Get Instagram Business Account data
                const igAccountData = await this.makeRequest<any>({
                    method: 'GET',
                    url: `${this.graphApiUrl}/me/accounts`,
                    params: {
                        fields: 'instagram_business_account',
                    },
                });

                if (igAccountData.data && igAccountData.data.length > 0) {
                    const igAccount = igAccountData.data[0].instagram_business_account;

                    if (igAccount) {
                        // Get Instagram insights
                        const igData = await this.makeRequest<any>({
                            method: 'GET',
                            url: `${this.graphApiUrl}/${igAccount.id}`,
                            params: {
                                fields: 'followers_count,media_count,username',
                            },
                        });

                        analytics.followers = igData.followers_count || 0;
                        analytics.posts = igData.media_count || 0;

                        // Get Instagram media insights
                        const mediaData = await this.makeRequest<any>({
                            method: 'GET',
                            url: `${this.graphApiUrl}/${igAccount.id}/media`,
                            params: {
                                fields: 'like_count,comments_count,insights.metric(impressions,reach,engagement)',
                                limit: 10,
                            },
                        });

                        if (mediaData.data) {
                            let totalImpressions = 0;
                            let totalEngagement = 0;

                            mediaData.data.forEach((media: any) => {
                                analytics.likes += media.like_count || 0;
                                analytics.comments += media.comments_count || 0;

                                if (media.insights?.data) {
                                    media.insights.data.forEach((insight: any) => {
                                        if (insight.name === 'impressions') {
                                            totalImpressions += insight.values[0]?.value || 0;
                                        }
                                        if (insight.name === 'engagement') {
                                            totalEngagement += insight.values[0]?.value || 0;
                                        }
                                    });
                                }
                            });

                            analytics.impressions = totalImpressions;
                            if (totalImpressions > 0) {
                                analytics.engagementRate = parseFloat(
                                    ((totalEngagement / totalImpressions) * 100).toFixed(2)
                                );
                            }
                        }

                        // Store account info
                        if (igAccount.id && !this.config?.accountId) {
                            await storage.updateSocialMediaIntegration(this.platform, {
                                accountId: igAccount.id,
                                accountName: igData.username || 'Instagram Account',
                            });
                        }
                    }
                }
            }

            return analytics;
        } catch (error: any) {
            console.error(`${this.platform} API error:`, error);
            throw new Error(`Failed to fetch ${this.platform} analytics: ${error.message}`);
        }
    }

    /**
     * Get OAuth authorization URL
     */
    static getAuthUrl(clientId: string, redirectUri: string, platform: 'facebook' | 'instagram'): string {
        const scopes = platform === 'facebook'
            ? ['pages_read_engagement', 'pages_show_list', 'pages_read_user_content']
            : ['instagram_basic', 'instagram_manage_insights', 'pages_read_engagement'];

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scopes.join(','),
            response_type: 'code',
            state: platform, // Use state to identify platform
        });

        return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
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

        const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code,
            },
        });

        if (!response.data.access_token) {
            throw new Error('No access token received');
        }

        // Exchange short-lived token for long-lived token
        const longLivedResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: clientId,
                client_secret: clientSecret,
                fb_exchange_token: response.data.access_token,
            },
        });

        return {
            accessToken: longLivedResponse.data.access_token,
            refreshToken: '', // Facebook uses long-lived tokens instead of refresh tokens
        };
    }
}

// Instagram client extends Facebook client since they use the same API
export class InstagramClient extends FacebookClient {
    constructor() {
        super('instagram');
    }
}
