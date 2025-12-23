// services/orchestrator.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTOCOLS_DIR = path.join(__dirname, 'protocols');

let assetFetchers = [];

/**
 * Dynamically loads all asset fetcher functions from the protocols directory and caches them.
 */
(async () => {
    try {
        const files = await fs.readdir(PROTOCOLS_DIR);
        for (const file of files) {
            if (file.endsWith('.js')) {
                const modulePath = path.join(PROTOCOLS_DIR, file);
                const module = await import(modulePath);
                for (const key in module) {
                    if (typeof module[key] === 'function' && key.startsWith('get') && key.endsWith('Assets')) {
                        assetFetchers.push(module[key]);
                        logger.info(`Loaded and cached asset fetcher: ${key} from ${file}`);
                    }
                }
            }
        }
    } catch (e) {
        logger.error("Failed to load and cache asset fetchers", { error: e.message });
    }
})();

/**
 * Runs all dynamically loaded asset fetchers and aggregates the results.
 * @param {string} address - The user's address.
 * @returns {Promise<{assets: any[], failedProtocols: string[]}>} An object containing the aggregated assets and a list of failed protocols.
 */
export async function fetchAllAssets(address) {
    let allAssets = [];
    let failedProtocols = [];

    const results = await Promise.allSettled(
        assetFetchers.map(fetcher => fetcher(address))
    );

    results.forEach((result, index) => {
        const fetcherName = assetFetchers[index].name;
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allAssets.push(...result.value);
        } else if (result.status === 'rejected') {
            logger.error(`Asset fetcher for ${fetcherName} failed`, { reason: result.reason, address });
            failedProtocols.push(fetcherName);
        }
    });

    return {
        assets: allAssets,
        failedProtocols: failedProtocols
    };
}