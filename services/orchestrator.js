// services/orchestrator.js

// 🚨 导入所有协议模块的入口函数
import { getWalletAssets } from './protocols/wallet.js';
import { getXWANFarmingAssets } from './protocols/xwanFarming.js';
import { getStoremanAssets } from './protocols/storeman.js';
import { getPoSAssets } from './protocols/pos.js';

// 🚨 核心：协议列表 (新增协议只需在这里添加)
const ASSET_FETCHERS = [
    getWalletAssets,
    getXWANFarmingAssets,
    getStoremanAssets,
    getPoSAssets,
];

/**
 * 运行所有协议的资产获取器，并聚合结果。
 * @param {string} address - 用户地址
 * @returns {Promise<AssetData[]>} 聚合后的资产数据数组
 */
export async function fetchAllAssets(address) {
    let allAssets = [];
    let failedProtocols = []; // 🚨 新增失败协议列表

    const results = await Promise.allSettled(
        ASSET_FETCHERS.map(fetcher => fetcher(address))
    );

    results.forEach((result, index) => {
        const fetcherName = ASSET_FETCHERS[index].name; // 获取协议函数名
        
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allAssets.push(...result.value);
        } else if (result.status === 'rejected') {
            console.error(`Asset fetcher for ${fetcherName} failed:`, result.reason);
            // 🚨 记录失败协议的名称
            failedProtocols.push(fetcherName); 
        }
    });

    // 🚨 返回更丰富的结构
    return {
        assets: allAssets,
        failedProtocols: failedProtocols
    };
}