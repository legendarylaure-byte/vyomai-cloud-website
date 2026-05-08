/**
 * Social Media Client Factory
 * Creates appropriate client instances for each platform
 */

import { YouTubeClient } from './youtube-client.js';
import { FacebookClient, InstagramClient } from './facebook-client.js';
import { LinkedInClient } from './linkedin-client.js';
import { TwitterClient } from './twitter-client.js';
import { BaseSocialMediaClient } from './base-client.js';

export type SocialMediaPlatform = 'youtube' | 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'whatsapp' | 'viber';

/**
 * Create a client instance for the specified platform
 */
export function createSocialMediaClient(platform: SocialMediaPlatform): BaseSocialMediaClient {
    switch (platform) {
        case 'youtube':
            return new YouTubeClient();
        case 'facebook':
            return new FacebookClient('facebook');
        case 'instagram':
            return new InstagramClient();
        case 'linkedin':
            return new LinkedInClient();
        case 'twitter':
            return new TwitterClient();
        case 'whatsapp':
        case 'viber':
            // These platforms don't have public analytics APIs
            // Return a placeholder client that does nothing
            throw new Error(`${platform} does not support automated analytics sync. Please enter data manually.`);
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}

/**
 * Sync analytics for a specific platform
 */
export async function syncPlatform(platform: SocialMediaPlatform) {
    const client = createSocialMediaClient(platform);
    return await client.sync();
}

/**
 * Sync analytics for all connected platforms
 */
export async function syncAllPlatforms() {
    const platforms: SocialMediaPlatform[] = ['youtube', 'facebook', 'instagram', 'linkedin', 'twitter'];
    const results = [];

    for (const platform of platforms) {
        try {
            const client = createSocialMediaClient(platform);
            const result = await client.sync();
            results.push(result);
        } catch (error: any) {
            console.error(`Failed to sync ${platform}:`, error.message);
            results.push({
                success: false,
                platform,
                metricsUpdated: [],
                error: error.message,
            });
        }
    }

    return results;
}
