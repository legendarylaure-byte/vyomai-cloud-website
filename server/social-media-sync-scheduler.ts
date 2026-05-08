/**
 * Social Media Auto-Sync Scheduler
 * Automatically syncs analytics from connected platforms at configured intervals
 */

import cron from 'node-cron';
import { storage } from './storage.js';
import { syncPlatform, SocialMediaPlatform } from './social-media-clients/index.js';

// Store active cron jobs
const activeCronJobs = new Map<string, any>();

/**
 * Convert sync interval to cron expression
 */
function intervalToCron(interval: string): string {
    switch (interval) {
        case '15m':
            return '*/15 * * * *'; // Every 15 minutes
        case '30m':
            return '*/30 * * * *'; // Every 30 minutes
        case '1h':
            return '0 * * * *'; // Every hour
        case '6h':
            return '0 */6 * * *'; // Every 6 hours
        case '24h':
            return '0 0 * * *'; // Every day at midnight
        default:
            return '0 * * * *'; // Default: every hour
    }
}

/**
 * Schedule auto-sync for a specific platform
 */
export function schedulePlatformSync(platform: SocialMediaPlatform, interval: string): void {
    try {
        // Stop existing job if any
        stopPlatformSync(platform);

        const cronExpression = intervalToCron(interval);

        const job = cron.schedule(cronExpression, async () => {
            console.log(`🔄 Auto-syncing ${platform}...`);

            try {
                const result = await syncPlatform(platform);

                if (result.success) {
                    console.log(`✅ ${platform} auto-sync completed. Updated: ${result.metricsUpdated.join(', ')}`);
                } else {
                    console.error(`❌ ${platform} auto-sync failed: ${result.error}`);
                }

                // Update next sync time
                const nextSyncAt = new Date();
                switch (interval) {
                    case '15m':
                        nextSyncAt.setMinutes(nextSyncAt.getMinutes() + 15);
                        break;
                    case '30m':
                        nextSyncAt.setMinutes(nextSyncAt.getMinutes() + 30);
                        break;
                    case '1h':
                        nextSyncAt.setHours(nextSyncAt.getHours() + 1);
                        break;
                    case '6h':
                        nextSyncAt.setHours(nextSyncAt.getHours() + 6);
                        break;
                    case '24h':
                        nextSyncAt.setDate(nextSyncAt.getDate() + 1);
                        break;
                }

                await storage.updateSocialMediaApiConfig(platform, {
                    nextSyncAt,
                });
            } catch (error: any) {
                console.error(`Error during ${platform} auto-sync:`, error);
            }
        });

        activeCronJobs.set(platform, job);
        console.log(`📅 Scheduled auto-sync for ${platform} (${interval})`);
    } catch (error) {
        console.error(`Failed to schedule sync for ${platform}:`, error);
    }
}

/**
 * Stop auto-sync for a specific platform
 */
export function stopPlatformSync(platform: SocialMediaPlatform): void {
    const job = activeCronJobs.get(platform);
    if (job) {
        job.stop();
        activeCronJobs.delete(platform);
        console.log(`⏹️ Stopped auto-sync for ${platform}`);
    }
}

/**
 * Initialize auto-sync for all enabled platforms
 */
export async function initializeAutoSync(): Promise<void> {
    try {
        console.log('🚀 Initializing social media auto-sync...');

        const configs = await storage.getSocialMediaApiConfigs();

        for (const config of configs) {
            if (config.autoSyncEnabled) {
                const platform = config.platform as SocialMediaPlatform;
                const interval = config.syncInterval || '1h';

                schedulePlatformSync(platform, interval);
            }
        }

        console.log(`✅ Auto-sync initialized for ${activeCronJobs.size} platforms`);
    } catch (error) {
        console.error('Failed to initialize auto-sync:', error);
    }
}

/**
 * Stop all auto-sync jobs
 */
export function stopAllAutoSync(): void {
    activeCronJobs.forEach((job, platform) => {
        job.stop();
        console.log(`⏹️ Stopped auto-sync for ${platform}`);
    });

    activeCronJobs.clear();
    console.log('🛑 All auto-sync jobs stopped');
}

/**
 * Get status of all active cron jobs
 */
export function getAutoSyncStatus(): { platform: string; active: boolean }[] {
    const platforms: SocialMediaPlatform[] = ['youtube', 'facebook', 'instagram', 'linkedin', 'twitter'];

    return platforms.map(platform => ({
        platform,
        active: activeCronJobs.has(platform),
    }));
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, stopping all auto-sync jobs...');
    stopAllAutoSync();
});

process.on('SIGINT', () => {
    console.log('SIGINT received, stopping all auto-sync jobs...');
    stopAllAutoSync();
});
