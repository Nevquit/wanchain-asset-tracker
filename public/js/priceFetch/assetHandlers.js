import { 
    getPriceIdentifier, 
    // 引入新的工具函数，用于富化子资产
    getAssetPriceAndValue 
} from './utils.js';

// -----------------------------------------------------
// 价值计算逻辑 (Value Calculation Logic)
// -----------------------------------------------------

/**
 * 标准资产（代币、主币）的价格计算逻辑。
 * Price calculation logic for standard assets (tokens, native coins).
 * @param {Object} asset - The asset object.
 * @param {Object} pricesMap - The price lookup table (CoinGecko ID -> price).
 * @returns {{usdPrice: number, usdValue: number}} Calculated price and value.
 */
function calculateStandardAssetValue(asset, pricesMap) {
    const contract = asset.asset_ca;
    // 构建一个结构相似的临时对象，使用新的工具函数计算
    const tempAsset = { address: contract, amount: asset.amount };
    
    const { usdPrice, usdValue } = getAssetPriceAndValue(tempAsset, pricesMap);
    
    return { usdPrice, usdValue };
}

/**
 * V3 LP 资产（复杂结构）的价格计算逻辑。
 * Price calculation logic for V3 LP NFT positions (complex structure).
 * **此函数将富化 primary_assets 和 reward_assets 数组中的子资产对象。**
 * * @param {Object} asset - The asset object.
 * @param {Object} pricesMap - The price lookup table (CoinGecko ID -> price).
 * @returns {{usdPrice: number, usdValue: number}} Calculated price and value.
 */
function calculateV3LpAssetValue(asset, pricesMap) {
    let nftTotalUsdValue = 0;
    const primaryAssets = asset.extra?.primary_assets || [];
    const rewardAssets = asset.extra?.reward_assets || [];

    // 1. 处理 Primary Assets (流动性资产)
    primaryAssets.forEach(subAsset => {
        const { usdPrice, usdValue } = getAssetPriceAndValue(subAsset, pricesMap);
        
        // 核心：将价格和价值添加到子资产对象上
        subAsset.price = usdPrice;
        subAsset.usdValue = usdValue;

        nftTotalUsdValue += usdValue;
    });

    // 2. 处理 Reward Assets (未领取的费用)
    rewardAssets.forEach(subAsset => {
        const { usdPrice, usdValue } = getAssetPriceAndValue(subAsset, pricesMap);
        
        // 核心：将价格和价值添加到子资产对象上
        subAsset.price = usdPrice;
        subAsset.usdValue = usdValue;
        
        nftTotalUsdValue += usdValue;
    });

    // V3 LP NFT 本身没有 price
    return { usdPrice: 0, usdValue: nftTotalUsdValue };
}

// -----------------------------------------------------
// ID 聚合逻辑 (ID Aggregation Logic)
// -----------------------------------------------------

/**
 * 标准资产的 CoinGecko ID 聚合逻辑。
 * CoinGecko ID aggregation logic for standard assets.
 * @param {Object} asset - The asset object.
 * @param {Set<string>} idSet - The mutable set of unique IDs.
 */
function aggregateStandardAssetIds(asset, idSet) {
    // Standard assets use the asset_ca field
    const priceIdentifier = getPriceIdentifier(asset.asset_ca);
    if (priceIdentifier && priceIdentifier.type === 'id') {
        idSet.add(priceIdentifier.key);
    }
}

/**
 * V3 LP 资产（复杂结构）的 CoinGecko ID 聚合逻辑。
 * CoinGecko ID aggregation logic for V3 LP NFT positions.
 * @param {Object} asset - The asset object.
 * @param {Set<string>} idSet - The mutable set of unique IDs.
 */
function aggregateV3LpAssetIds(asset, idSet) {
    const subAssets = [
        ...(asset.extra?.primary_assets || []),
        ...(asset.extra?.reward_assets || [])
    ];
    
    // Collect CoinGecko IDs for all nested assets
    subAssets.forEach(subAsset => {
        // Sub-assets use the address field
        const priceIdentifier = getPriceIdentifier(subAsset.address);
        if (priceIdentifier && priceIdentifier.type === 'id') {
            idSet.add(priceIdentifier.key);
        }
    });
}


// -----------------------------------------------------
// 注册表 (Registries)
// -----------------------------------------------------

/**
 * 映射资产类型到相应的价值计算函数。
 * Handler registry mapping asset types to their corresponding value calculation functions.
 */
export const ASSET_TYPE_HANDLERS = {
    'V3_LP_POSITION': calculateV3LpAssetValue,
    'V3 LP NFT': calculateV3LpAssetValue,
    // Default handler for standard tokens/coins
    'default': calculateStandardAssetValue
};

/**
 * 映射资产类型到相应的 CoinGecko ID 聚合函数。
 * Registry mapping asset types to their corresponding CoinGecko ID aggregation functions.
 */
export const ASSET_TYPE_ID_AGGREGATORS = {
    'V3_LP_POSITION': aggregateV3LpAssetIds,
    'V3 LP NFT': aggregateV3LpAssetIds,
    // Default aggregator for standard tokens/coins
    'default': aggregateStandardAssetIds
};