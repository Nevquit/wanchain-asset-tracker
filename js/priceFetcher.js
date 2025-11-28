// js/priceFetcher.js (最终完整内容)

import { 
    COINGECKO_TOKEN_MAP,
    COINGECKO_ID_API
} from './config.js'; 


/**
 * 格式化数字为带逗号和美元符号的字符串。
 * @param {number} value
 * @returns {string} 格式化后的字符串
 */
export function formatUSD(value) {
    if (value <= 0 || isNaN(value)) return 'N/A (Price Feed Missing)';
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * 获取资产的 CoinGecko 价格查询标识符。
 * 只有在 COINGECKO_TOKEN_MAP 中或为 WAN 主币时，才返回 ID。
 * @returns {{key: string, type: 'id'} | null}
 */
function getPriceIdentifier(assetSymbol, contractAddress) {
    // 1. 查找通用映射表 (使用 ID)
    if (contractAddress) {
        const lowerCaseAddress = contractAddress.toLowerCase();
        if (COINGECKO_TOKEN_MAP[lowerCaseAddress]) {
            return { key: COINGECKO_TOKEN_MAP[lowerCaseAddress].coingeckoId, type: 'id' };
        }
    }
    
    // 2. Wanchain 主币 (使用 ID: wanchain)
    if (assetSymbol.toUpperCase() === 'WAN') {
        return { key: 'wanchain', type: 'id' }; 
    }
    
    return null;
}

/**
 * 批量调用 CoinGecko ID API 获取价格。
 * @param {Set<string>} ids - 需要通过 ID 查询的 CoinGecko ID 集合
 * @returns {Promise<Object>} 包含价格的查找表
 */
async function fetchPrices(ids) {
    let prices = {};

    if (ids.size > 0) {
        const idList = Array.from(ids).join(',');
        try {
            const response = await fetch(`${COINGECKO_ID_API}?ids=${idList}&vs_currencies=usd`);
            const data = await response.json();
            
            for (const id in data) {
                if (data[id] && data[id].usd) {
                    prices[id] = data[id].usd;
                }
            }
        } catch (e) {
            console.error("Failed to fetch prices by ID from CoinGecko:", e);
        }
    }
    return prices;
}


/**
 * 聚合所有资产的价格查询需求并计算 USD 价值。
 * @param {Array<Object>} assets - 原始资产数组
 * @returns {Promise<{assets: Array<Object>, totalUsdValue: number}>}
 */
export async function getPricesAndCalculateValues(assets) {
    console.log("assets",assets);
    if (!assets || assets.length === 0) return { assets: [], totalUsdValue: 0 }; 

    let idLookups = new Set();
    
    // 1. 收集所有需要查询价格的 ID
    assets.forEach(asset => {
        const contract = asset.asset_ca;
        const symbol = asset.asset;

        const priceIdentifier = getPriceIdentifier(symbol, contract);

        if (priceIdentifier && priceIdentifier.type === 'id') {
            idLookups.add(priceIdentifier.key);
        }
    });

    // 2. 批量获取价格
    const pricesMap = await fetchPrices(idLookups); 
    let totalUsdValue = 0; 

    // 3. 价格注入和价值计算
    const assetsWithValues = assets.map(asset => {
        const contract = asset.asset_ca;
        const symbol = asset.asset;
        
        const priceIdentifier = getPriceIdentifier(symbol, contract);
        let usdPrice = 0;
        
        if (priceIdentifier) {
            usdPrice = pricesMap[priceIdentifier.key] || 0;
        }
        
        const amount = parseFloat(asset.amount) || 0; 
        const usdValue = amount * usdPrice;
        
        totalUsdValue += usdValue; 

        return {
            ...asset,
            price: usdPrice,
            usdValue: usdValue 
        };
    });

    return { assets: assetsWithValues, totalUsdValue: totalUsdValue };
}