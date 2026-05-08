/**
 * YouTube Analytics API Client
 * Supports both OAuth 2.0 and API Key authentication
 */

import { google } from 'googleapis';
import { BaseSocialMediaClient } from './base-client.js';
import { encrypt } from '../crypto-utils.js';
import { storage } from '../storage.js';

export class YouTubeClient extends BaseSocialMediaClient {
    private youtube: any;
    private youtubeAnalytics: any;

    constructor() {
        super('youtube');
    }

    /**
     * Initialize YouTube API clients
     */
    private async initializeClients(): Promise<void> {
        if (this.authMethod === 'oauth') {
            // OAuth 2.0 authentication
            const oauth2Client = new google.auth.OAuth2(
                this.config?.clientId,
                this.config?.clientSecret,
                process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5001/api/admin/social-media/oauth/callback/youtube'
            );

            if (this.config?.accessToken) {
                oauth2Client.setCredentials({
                    access_token: this.config.accessToken,
                    refresh_token: this.config.refreshToken,
                });
            }

            this.youtube = google.youtube({ version: 'v3', auth: oauth2Client });
            this.youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });
        } else {
            // API Key authentication
            this.youtube = google.youtube({
                version: 'v3',
                auth: this.config?.apiKey,
            });
            // Note: YouTube Analytics API requires OAuth, API key only works for public data
        }
    }

    /**
     * Refresh OAuth access token
     */
    protected async refreshAccessToken(): Promise<void> {
        try {
            if (!this.config?.refreshToken) {
                throw new Error('No refresh token available');
            }

            const oauth2Client = new google.auth.OAuth2(
                this.config.clientId,
                this.config.clientSecret,
                process.env.YOUTUBE_REDIRECT_URI
            );

            oauth2Client.setCredentials({
                refresh_token: this.config.refreshToken,
            });

            const { credentials } = await oauth2Client.refreshAccessToken();

            if (credentials.access_token) {
                // Update config
                this.config.accessToken = credentials.access_token;

                // Save encrypted token to database
                await storage.updateSocialMediaIntegration(this.platform, {
                    accessToken: encrypt(credentials.access_token),
                });

                console.log(`✅ YouTube access token refreshed`);
            }
        } catch (error) {
            console.error('Failed to refresh YouTube access token:', error);
            throw error;
        }
    }

    /**
     * Fetch analytics data from YouTube
     */
    async fetchAnalytics(): Promise<any> {
        await this.initializeClients();

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

            // Get channel statistics
            const channelResponse = await this.youtube.channels.list({
                part: ['statistics', 'snippet'],
                mine: true, // Get authenticated user's channel
            });

            if (channelResponse.data.items && channelResponse.data.items.length > 0) {
                const channel = channelResponse.data.items[0];
                const stats = channel.statistics;

                analytics.followers = parseInt(stats.subscriberCount || '0');
                analytics.posts = parseInt(stats.videoCount || '0');
                analytics.impressions = parseInt(stats.viewCount || '0');

                // Store channel ID for future use
                if (channel.id && !this.config?.accountId) {
                    await storage.updateSocialMediaIntegration(this.platform, {
                        accountId: channel.id,
                        accountName: channel.snippet?.title || 'YouTube Channel',
                    });
                }
            }

            // Get recent video statistics for engagement metrics
            if (this.authMethod === 'oauth') {
                try {
                    const videosResponse = await this.youtube.search.list({
                        part: ['id'],
                        forMine: true,
                        type: ['video'],
                        order: 'date',
                        maxResults: 10,
                    });

                    if (videosResponse.data.items && videosResponse.data.items.length > 0) {
                        const videoIds = videosResponse.data.items.map((item: any) => item.id.videoId).filter(Boolean);

                        if (videoIds.length > 0) {
                            const videoStatsResponse = await this.youtube.videos.list({
                                part: ['statistics'],
                                id: videoIds,
                            });

                            let totalLikes = 0;
                            let totalComments = 0;
                            let totalViews = 0;

                            videoStatsResponse.data.items?.forEach((video: any) => {
                                const stats = video.statistics;
                                totalLikes += parseInt(stats.likeCount || '0');
                                totalComments += parseInt(stats.commentCount || '0');
                                totalViews += parseInt(stats.viewCount || '0');
                            });

                            analytics.likes = totalLikes;
                            analytics.comments = totalComments;

                            // Calculate engagement rate: (likes + comments) / views * 100
                            if (totalViews > 0) {
                                analytics.engagementRate = parseFloat(
                                    (((totalLikes + totalComments) / totalViews) * 100).toFixed(2)
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Could not fetch video statistics:', error);
                    // Continue with channel stats only
                }
            }

            return analytics;
        } catch (error: any) {
            console.error('YouTube API error:', error);
            throw new Error(`Failed to fetch YouTube analytics: ${error.message}`);
        }
    }

    /**
     * Get OAuth authorization URL
     */
    static getAuthUrl(clientId: string, clientSecret: string, redirectUri: string): string {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        const scopes = [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/yt-analytics.readonly',
        ];

        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent', // Force consent screen to get refresh token
        });
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
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token) {
            throw new Error('No access token received');
        }

        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || '',
        };
    }
}
