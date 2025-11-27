// js/priceFetcher.js

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price/?ids=ethereum,tether,usd-coin,wanchain,bitcoin&vs_currencies=usd';

/**
 * 格式化数字为带逗号和美元符号的字符串。
 * @param {number} value
 * @returns {string} 格式化后的字符串
 */
export function formatUSD(value) {
    if (value <= 0 || isNaN(value)) return 'N/A (Price Feed Missing)';
    
    // 使用 Intl.NumberFormat 实现更健壮的格式化
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * 1. 聚合所有资产的合约地址。
 * 2. 批量调用 CoinGecko API 获取价格。
 * 3. 计算每个资产的 USD 价值。
 * @param {Array<Object>} assets - 原始资产数组
 * @returns {Promise<Array<Object>>} 包含 usdValue 的资产数组
 */
export async function getPricesAndCalculateValues(assets) {
    if (!assets || assets.length === 0) return [];

    let priceLookupAddresses = new Set();
    
    // 1. 收集所有需要查询价格的合约地址
    assets.forEach(asset => {
        const contract = asset.extra.protocolContract || asset.extra.rewradCa;
        if (contract) {
            priceLookupAddresses.add(contract.toLowerCase());
        }
    });

    const contractAddresses = Array.from(priceLookupAddresses);
    if (contractAddresses.length === 0) {
        return assets.map(asset => ({ ...asset, usdValue: 0 }));
    }
    
    let prices = {};
    const ids = contractAddresses.join(',');
    
    // 2. 批量获取价格
    try {
        const response = await fetch(`${COINGECKO_API}`);
        if (!response.ok) {
            throw new Error(`CoinGecko API returned status ${response.status}`);
        }
        prices = await response.json();
    } catch (e) {
        console.error("Failed to fetch prices from CoinGecko (Frontend):", e);
        prices = {}; 
    }

    // 3. 价格注入和价值计算
    const assetsWithValues = assets.map(asset => {
        const contract = asset.extra.protocolContract || asset.extra.rewradCa;
        const priceData = contract ? prices[contract.toLowerCase()] : null;
        
        const usdPrice = priceData ? priceData.usd : 0;
        // 确保 amount 是数字
        const amount = parseFloat(asset.amount) || 0; 
        const usdValue = amount * usdPrice;

        return {
            ...asset,
            price: usdPrice,
            usdValue: usdValue 
        };
    });

    return assetsWithValues;
}