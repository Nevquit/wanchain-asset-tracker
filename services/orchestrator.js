// services/orchestrator.js

// 🚨 导入所有协议模块的入口函数
import { getWalletAssets } from './protocols/wallet.js';
import { getXWANFarmingAssets } from './protocols/xwanFarming.js';
import { getStoremanAssets } from './protocols/storeman.js';

// 🚨 核心：协议列表 (新增协议只需在这里添加)
const ASSET_FETCHERS = [
    getWalletAssets,
    getXWANFarmingAssets,
    getStoremanAssets,
];

/**
 * 运行所有协议的资产获取器，并聚合结果。
 * @param {string} address - 用户地址
 * @returns {Promise<AssetData[]>} 聚合后的资产数据数组
 */
export async function fetchAllAssets(address) {
    let allAssets = [];

    // Promise.allSettled 确保即使某个协议失败，其他协议也能返回结果
    const results = await Promise.allSettled(
        ASSET_FETCHERS.map(fetcher => fetcher(address))
    );

    results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allAssets.push(...result.value);
        } else if (result.status === 'rejected') {
            console.error("An asset fetcher failed:", result.reason);
        }
    });

    return allAssets;
}