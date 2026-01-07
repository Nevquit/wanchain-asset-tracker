import { 
    COINGECKO_TOKEN_MAP,
    COINGECKO_ID_API
} from './config.js'; // 假设 config.js 在同一目录下

/**
 * 格式化数字为带逗号和美元符号的字符串。
 * Formats a number into a USD currency string with commas.
 * @param {number} value
 * @returns {string} Formatted string
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
 * Retrieves the CoinGecko price ID for a given contract address.
 * @param {string} contractAddress - The contract address of the asset.
 * @returns {{key: string, type: 'id'} | null} Identifier object or null.
 */
export function getPriceIdentifier(contractAddress) {
    if (contractAddress) {
        const lowerCaseAddress = contractAddress.toLowerCase();
        if (COINGECKO_TOKEN_MAP[lowerCaseAddress]) {
            return { key: COINGECKO_TOKEN_MAP[lowerCaseAddress].coingeckoId, type: 'id' };
        }
    }
    return null;
}

/**
 * 批量调用 CoinGecko ID API 获取价格 (加入指数退避)。
 * Fetches prices in bulk from the CoinGecko ID API (with exponential backoff).
 * @param {Set<string>} ids - A set of CoinGecko IDs to query.
 * @returns {Promise<Object>} A lookup table containing prices (id -> usd_price).
 */
export async function fetchPrices(ids) {
    let prices = {};
    const maxRetries = 3;

    if (ids.size > 0) {
        const idList = Array.from(ids).join(',');
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(`${COINGECKO_ID_API}?ids=${idList}&vs_currencies=usd`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                for (const id in data) {
                    if (data[id] && data[id].usd) {
                        prices[id] = data[id].usd;
                    }
                }
                return prices; // Success, return results
            } catch (e) {
                console.warn(`Attempt ${attempt + 1} failed to fetch prices. Retrying...`, e.message);
                if (attempt === maxRetries - 1) {
                    console.error("Failed to fetch prices after all retries.");
                    return prices; // Return partial or empty prices
                }
                // Wait 2^attempt seconds before retrying
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    return prices;
}

/**
 * 【新增函数】根据合约地址和价格映射表，获取子资产的 USD 价格和总价值。
 * Retrieves the USD price and calculates the USD value for a single sub-asset.
 * @param {Object} subAsset - Sub-asset object containing amount and address.
 * @param {Object} pricesMap - CoinGecko ID to price lookup table.
 * @returns {{usdPrice: number, usdValue: number}} Object containing the price and total value.
 */
export function getAssetPriceAndValue(subAsset, pricesMap) {
    const contract = subAsset.address;
    const priceIdentifier = getPriceIdentifier(contract);
    let usdPrice = 0;
    let usdValue = 0;

    if (priceIdentifier) {
        // Find the price in the map, default to 0
        usdPrice = pricesMap[priceIdentifier.key] || 0; 
    }
    
    // Ensure amount is parsed as a float
    const amount = parseFloat(subAsset.amount) || 0; 
    
    usdValue = amount * usdPrice;
    
    return { usdPrice, usdValue };
}


/**
 * 辅助函数：根据合约地址和价格映射表计算单个 sub-asset 的 USD 价值 (用于兼容旧逻辑)。
 * Helper function to calculate the USD value of a single sub-asset.
 * @param {Object} subAsset - Sub-asset object containing amount and address.
 * @param {Object} pricesMap - CoinGecko ID to price lookup table.
 * @returns {number} USD value.
 */
export function calculateSubAssetValue(subAsset, pricesMap) {
    // 内部调用新函数，保持对外接口一致
    const { usdValue } = getAssetPriceAndValue(subAsset, pricesMap);
    return usdValue;
}