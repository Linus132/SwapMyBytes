import DownloadToken from './DownloadToken';
import { logger } from '../util';
export const cleanupDownloadTokens = async (): Promise<void> => {
    const now = Date.now();
    try {
        const result = await DownloadToken.deleteMany({
            $or: [
                { used: true },
                { expiresAt: { $lt: now } }
            ]
        });
        logger.info(`Cleaned up ${result.deletedCount} expired/used tokens.`);
    } catch (error) {
        logger.error('Token cleanup failed:', error);
    }
};


const TokenCleanupScheduler = {
    start: () => {
        const DAILY_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
        setInterval(cleanupDownloadTokens, DAILY_CLEANUP_INTERVAL);
        cleanupDownloadTokens();
        logger.info('Token cleanup scheduler started');
    }
};

export default TokenCleanupScheduler;