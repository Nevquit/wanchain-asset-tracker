import { fetchPrices } from './utils.js';
import { 
    ASSET_TYPE_HANDLERS,
    ASSET_TYPE_ID_AGGREGATORS // Import the new ID aggregation registry
} from './assetHandlers.js';

// -----------------------------------------------------
// ID 聚合 (ID Aggregation) - 使用导入的 Aggregator 注册表
// -----------------------------------------------------

/**
 * 遍历所有资产，收集所有需要的 CoinGecko ID。
 * Iterates through all assets and collects all necessary CoinGecko IDs for price lookups.
 * @param {Array<Object>} assets - The raw asset array.
 * @returns {Set<string>} A set of unique CoinGecko IDs to query.
 */
function aggregatePriceIds(assets) {
    let idLookups = new Set();
    
    assets.forEach(asset => {
        const assetType = asset.extra?.assetType || asset.extra?.type;
        
        // 根据资产类型查找 ID 聚合器，默认使用标准聚合器
        const aggregator = ASSET_TYPE_ID_AGGREGATORS[assetType] || ASSET_TYPE_ID_AGGREGATORS['default'];
        
        // 调用聚合器函数，将所需 ID 添加到 idLookups Set 中
        aggregator(asset, idLookups);
    });

    return idLookups;
}


// -----------------------------------------------------
// 主要导出函数 (Main Export)
// -----------------------------------------------------

/**
 * 聚合所有资产的价格查询需求并计算 USD 价值。
 * Aggregates price requirements, fetches prices, and calculates the USD value for all assets.
 * @param {Array<Object>} assets - The raw asset array.
 * @returns {Promise<{assets: Array<Object>, totalUsdValue: number}>} Calculated assets and total value.
 */
export async function getPricesAndCalculateValues(assets) {
    if (!assets || assets.length === 0) return { assets: [], totalUsdValue: 0 }; 

    // 1. 收集所有需要的价格 ID (现在使用分派机制)
    const idLookups = aggregatePriceIds(assets);
    console.log("Collected CoinGecko IDs:", idLookups);

    // 2. 批量获取价格
    const pricesMap = await fetchPrices(idLookups); 
    let totalUsdValue = 0; 

    // 3. 价值计算和分派
    // 注意：对于 V3 LP，handler 在计算总价值的同时会修改 asset.extra 中的子资产对象
    const assetsWithValues = assets.map(asset => {
        const assetType = asset.extra?.assetType || asset.extra?.type;
        
        // 根据资产类型查找处理器，默认使用标准处理器
        const handler = ASSET_TYPE_HANDLERS[assetType] || ASSET_TYPE_HANDLERS['default'];
        
        // 调用处理器计算价格和价值
        const { usdPrice, usdValue } = handler(asset, pricesMap);
        
        totalUsdValue += usdValue; 

        return {
            ...asset,
            // 对于 V3 LP，usdPrice 为 0
            price: usdPrice,
            usdValue: usdValue 
        };
    });
    
    console.log("Calculated Assets:", assetsWithValues,"totalUsdValue",totalUsdValue);
    return { assets: assetsWithValues, totalUsdValue: totalUsdValue };
}