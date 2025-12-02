/**
 * xFLowsRenderer.js
 * Renders assets for the xFLows (V3 LP) protocol using a compact,
 * visually clear card layout inspired by modern DApp interfaces.
 * It relies on 'formatUSD' being passed as an argument.
 */

// ------------------------------------------------------------------------------------------------
// --- 辅助函数：复制到剪贴板 (必须使用 document.execCommand) ---
// ------------------------------------------------------------------------------------------------
window.copyToClipboard = function(text, element) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    // 使用 document.execCommand('copy') 以确保在 iFrame 环境中可用
    let successful = false;
    try {
        successful = document.execCommand('copy');
    } catch (err) {
        console.error('Copy command failed:', err);
    }
    document.body.removeChild(textarea);

    if (successful) {
        const originalText = element.innerHTML;
        element.innerHTML = 'Copied! ✅';
        setTimeout(() => {
            element.innerHTML = originalText;
        }, 1500);
    } else {
        console.error('Failed to copy address.');
    }
}

// ------------------------------------------------------------------------------------------------
// --- 辅助函数：渲染单个子资产行 (Supplied / Reward Token) ---
// ------------------------------------------------------------------------------------------------

/**
 * Renders a detailed row for a sub-asset (e.g., supplied token or reward token).
 * @param {Object} item - The token object (from primary_assets or reward_assets)
 * @param {Function} formatUSD - Formatting function
 * @returns {string} HTML for the sub-asset row
 */
function renderSubAssetRow(item, formatUSD) {
    const usdValueDisplay = formatUSD(item.usdValue || 0);
    // 检查价格缺失，用于高亮显示
    const isPriceMissing = (item.price === 0 && item.usdValue === 0 && parseFloat(item.amount) > 0);
    const valueClass = isPriceMissing ? 'text-red-500' : 'text-gray-800 dark:text-gray-200';

    return `
        <div class="flex justify-between items-center py-1.5 px-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <!-- Token Icon and Symbol -->
            <div class="flex items-center space-x-2 w-1/3">
                <!-- 占位符图标 -->
                <div class="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">${item.symbol[0]}</div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${item.symbol}</span>
            </div>
            
            <!-- Amount -->
            <div class="text-right w-1/3">
                <span class="text-sm font-mono text-gray-700 dark:text-gray-300">${parseFloat(item.amount).toFixed(4)}</span>
            </div>

            <!-- USD Value -->
            <div class="text-right w-1/3">
                <span class="text-sm font-semibold ${valueClass}">
                    ${isPriceMissing ? 'N/A' : usdValueDisplay}
                </span>
            </div>
        </div>
    `;
}

// ------------------------------------------------------------------------------------------------
// --- 私有函数：渲染单个 LP 头寸卡片 ---
// ------------------------------------------------------------------------------------------------

/**
 * Renders a single LP position as a card.
 * @param {Object} positionAsset - 包含 LP 信息的资产对象
 * @param {Function} formatUSD - 格式化函数
 * @returns {string} 渲染后的 HTML 字符串
 */
function renderPositionCard(positionAsset, formatUSD) {
    // 解构核心和自定义字段
    const { 
        asset: assetSymbol, // e.g., wanADA/WWAN V3 LP
        usdValue, 
        extra 
    } = positionAsset;
    
    const { 
        tokenId, 
        feeTier, 
        tickRange, 
        protocolContract, 
        DappUrl, // 🚨 修复: 确保从 extra 中读取 DappUrl (大写 D)
        primary_assets = [], // Supplied tokens
        reward_assets = [] // Pending rewards
    } = extra || {}; 

    const totalValueDisplay = formatUSD(usdValue || 0);
    const totalValueClass = usdValue > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400';
    
    // --- 1. Supplied Tokens Section ---
    const suppliedHtml = primary_assets.map(item => renderSubAssetRow(item, formatUSD)).join('');

    // --- 2. Rewards Section ---
    const totalRewardsValue = reward_assets.reduce((sum, asset) => sum + (asset.usdValue || 0), 0);
    const rewardsValueDisplay = formatUSD(totalRewardsValue);

    const rewardsHtml = reward_assets.length > 0 && totalRewardsValue > 0
        ? reward_assets.map(item => renderSubAssetRow(item, formatUSD)).join('')
        : `<div class="text-center text-sm text-gray-500 dark:text-gray-400 py-2">No pending rewards.</div>`;
    
    // --- 3. Details/Contract Footer ---
    const fee = feeTier ? `${(feeTier / 10000).toFixed(2)}% Fee` : '';
    const range = tickRange || 'Range N/A';
    
    let detailsHtml = '';
    if (fee || range || protocolContract) {
        let contractCopyHtml = '';
        if (protocolContract) {
            const displayAddress = `Pool Contract: ...${protocolContract.slice(-6)}`;
            // 使用 window.copyToClipboard
            contractCopyHtml = `
                <span class="contract-copy-cell cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-4" 
                    title="Click to copy contract address"
                    data-address="${protocolContract}"
                    onclick="window.copyToClipboard('${protocolContract}', this)">
                    ${displayAddress} <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block align-text-bottom" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v4a1 1 0 001 1h4a1 1 0 001-1V7m0 0V4a2 2 0 00-2-2H9a2 2 0 00-2 2v3m4 0h.01M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7"></path></svg>
                </span>
            `;
        }
        
        detailsHtml = `
            <div class="flex flex-col sm:flex-row justify-start items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span class="whitespace-nowrap">${fee} Range: ${range}</span>
                ${contractCopyHtml}
            </div>
        `;
    }

    // --- 4. 最终卡片结构 ---
    
    // 🚨 修复: 确保链接使用 DappUrl (大写 D) 属性
    const dappLink = DappUrl && tokenId ? `${DappUrl}/position/${tokenId}` : DappUrl;
    
    return `
        <div class="lp-card bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6 w-full max-w-lg mx-auto">
            
            <!-- Card Header -->
            <div class="flex justify-between items-start pb-3 border-b border-gray-200 dark:border-gray-700">
                <div class="flex flex-col">
                    <!-- LP Token Pair Symbol -->
                    <span class="text-lg font-bold text-gray-800 dark:text-white">${assetSymbol}</span>
                    <!-- Pool Identifier -->
                    <div class="mt-1 flex items-center space-x-2">
                        <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Liquidity Pool
                        </span>
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                            #${tokenId || 'N/A'}
                        </span>
                    </div>
                    ${detailsHtml}
                </div>
                
                <!-- Total USD Value -->
                <div class="text-right">
                    <span class="text-2xl font-extrabold ${totalValueClass}">
                        ${totalValueDisplay}
                    </span>
                    <!-- DApp Link -->
                    ${dappLink && dappLink !== "" ? `
                        <a href="${dappLink}" target="_blank" class="text-xs text-blue-600 dark:text-blue-400 hover:underline block mt-1">
                            Go to DApp
                        </a>` : ''}
                </div>
            </div>

            <!-- Asset Details (Supplied & Rewards) -->
            <div class="mt-4">
                <!-- Headers -->
                <div class="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-1 pb-1 border-b border-gray-200 dark:border-gray-700">
                    <div class="w-1/3">Token</div>
                    <div class="w-1/3 text-right">Amount</div>
                    <div class="w-1/3 text-right">USD Value</div>
                </div>

                <!-- Supplied Tokens -->
                <h4 class="text-sm font-bold mt-3 mb-1 text-gray-700 dark:text-gray-300">SUPPLIED</h4>
                <div class="divide-y divide-gray-100 dark:divide-gray-700">
                    ${suppliedHtml}
                </div>

                <!-- Rewards -->
                <h4 class="text-sm font-bold mt-4 mb-1 text-gray-700 dark:text-gray-300 flex justify-between items-center">
                    <span>PENDING REWARDS</span>
                    <span class="text-sm font-bold text-green-600 dark:text-green-400">${rewardsValueDisplay}</span>
                </h4>
                <div class="divide-y divide-gray-100 dark:divide-gray-700">
                    ${rewardsHtml}
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex justify-between space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                    class="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-150"
                    onclick="console.log('Action: Withdraw from LP ${tokenId || 'N/A'}');">
                    Withdraw
                </button>
                <button 
                    class="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-150"
                    onclick="console.log('Action: Claim rewards for LP ${tokenId || 'N/A'}');">
                    Claim
                </button>
            </div>
        </div>
    `;
}

// ------------------------------------------------------------------------------------------------
// --- 导出函数：渲染 DApp 分组容器和卡片列表 ---
// ------------------------------------------------------------------------------------------------

/**
 * xFLows Renderer: Renders the DApp grouping container and list of LP position cards.
 * @param {string} dappName - DApp 名称
 * @param {Array<Object>} assets - 该 DApp 的资产列表 (每个元素代表一个 LP 头寸)
 * @param {Function} formatUSD - 格式化函数
 */
export function renderDappGroup(dappName, assets, formatUSD) {
    if (!assets || assets.length === 0) {
        return ''; 
    }
    
    // 渲染所有 LP 头寸卡片
    const cardsHtml = assets.map(asset => renderPositionCard(asset, formatUSD)).join('');

    // 计算当前 DApp 组的总价值
    const dappTotalValue = assets.reduce((sum, asset) => sum + (asset.usdValue || 0), 0);
    const totalValueDisplay = formatUSD(dappTotalValue); 
    const totalValueClass = dappTotalValue > 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400';

    return `
        <div class="dapp-group my-8 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-inner">
            <div class="dapp-header flex justify-between items-center mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 class="dapp-name text-2xl font-extrabold text-gray-900 dark:text-white">${dappName} Assets</h2>
                <div class="header-right-side flex items-center space-x-4">
                    <div class="total-usd-value text-xl font-bold ${totalValueClass}">
                        Total Value: ${totalValueDisplay}
                    </div>
                </div>
            </div>

            <!-- 卡片列表，使其居中 -->
            <div class="asset-card-list flex flex-col items-center">
                ${cardsHtml}
            </div>
        </div>
    `;
}