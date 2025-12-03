//xFlowRenderer.js
/**
 * xFLows V3 LP NFT 专用渲染器。
 * * 职责：
 * 1. 接收一个 DApp 组（包含一个或多个 LP NFT 资产）。
 * 2. 对每个 LP NFT 资产渲染一个详细的卡片视图（而不是表格行）。
 * 3. 汇总当前 DApp 组的总价值。
 * 4. 使用传入的 formatUSD 函数。
 */

// --- 实用工具函数 (在文件内部定义，确保渲染器独立) ---

/**
 * 格式化金额，保留 4 位小数。
 * @param {string|number} amount - 数量
 * @returns {string} 格式化后的字符串
 */
function formatAmount(amount) {
    const num = parseFloat(amount);
    // 检查是否为 NaN 或 undefined，统一返回 '0.0000'
    if (isNaN(num) || num === undefined || num === null) return '0.0000';
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 6,
        minimumFractionDigits: 4,
    }).format(num);
}

/**
 * 格式化合约地址，显示首尾部分。
 * @param {string} address - 合约地址
 * @returns {string} 缩短后的地址
 */
function formatAddress(address) {
    if (!address || typeof address !== 'string' || address.length < 10) return address || 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 生成一个基于符号首字母的 SVG 图标。
 * @param {string} symbol - 代币符号
 * @returns {string} SVG 字符串
 */
function generateSymbolIcon(symbol) {
    const color = (symbol || 'N/A').charCodeAt(0) * 1000 % 0xFFFFFF;
    const hexColor = `#${color.toString(16).padStart(6, '0')}`;
    const initial = (symbol || '?').slice(0, 1).toUpperCase();

    return `
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md" style="background-color: ${hexColor};">
            ${initial}
        </div>
    `;
}

/**
 * 渲染单个 V3 LP NFT 卡片。
 * @param {Object} asset - V3 LP NFT 资产对象。
 * @param {Function} formatUSD - USD 格式化函数。
 * @returns {string} 渲染后的卡片 HTML 字符串。
 */
function renderV3LPCard(asset, formatUSD) {
    // 确保所有必需字段都有安全默认值，防止 undefined 错误
    const { 
        asset: assetSymbol = 'Unknown Pool', 
        amount = '1', // NFT 数量通常为 1
        usdValue = 0, 
        extra = {} 
    } = asset;
    
    // 从 extra 中安全地解构嵌套数组，并确保它们是数组
    const { 
        tokenId, 
        range = 'N/A', 
        feeTier = 'N/A', 
        primary_assets = [], 
        reward_assets = [],
        DappUrl 
    } = extra;

    // 格式化总价值
    const totalValueDisplay = formatUSD(usdValue);
    const hasValue = usdValue > 0;
    
    // --- 渲染子资产 (Primary + Reward) ---
    
    // 渲染 Primary Assets
    const primaryAssetHtml = primary_assets.map(subAsset => {
        // 确保 subAsset 属性存在且有效，防止 undefined 
        const symbol = subAsset.symbol || 'N/A';
        const amountDisplay = formatAmount(subAsset.amount);
        const priceDisplay = formatUSD(subAsset.usdPrice || 0); // 🚨 新增：显示币价
        const valueDisplay = formatUSD(subAsset.usdValue || 0);
        
        return `
            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                <div class="flex items-center space-x-2">
                    ${generateSymbolIcon(symbol)}
                    <span class="text-sm font-medium text-gray-800">${symbol}</span>
                </div>
                <div class="text-right text-sm">
                    <div class="font-semibold">${amountDisplay}</div>
                    <div class="text-gray-500 text-xs mt-0.5">@ ${priceDisplay}</div>
                    <div class="text-gray-500 text-xs mt-0.5">Value: ${valueDisplay}</div>
                </div>
            </div>
        `;
    }).join('');

    // 渲染 Reward Assets
    const rewardAssetHtml = reward_assets.map(subAsset => {
        const symbol = subAsset.symbol || 'N/A';
        const amountDisplay = formatAmount(subAsset.amount);
        const priceDisplay = formatUSD(subAsset.usdPrice || 0); // 🚨 新增：显示币价
        const valueDisplay = formatUSD(subAsset.usdValue || 0);

        return `
            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                <div class="flex items-center space-x-2">
                    ${generateSymbolIcon(symbol)}
                    <span class="text-sm font-medium text-green-700">${symbol} (Reward)</span>
                </div>
                <div class="text-right text-sm">
                    <div class="font-semibold">${amountDisplay}</div>
                    <div class="text-gray-500 text-xs mt-0.5">@ ${priceDisplay}</div>
                    <div class="text-gray-500 text-xs mt-0.5">Value: ${valueDisplay}</div>
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden border border-gray-200">
            <div class="bg-indigo-50 p-4 sm:p-6 flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-extrabold text-indigo-700 leading-none">${assetSymbol}</h3>
                    <p class="text-xs font-semibold text-indigo-500 mt-1">LP NFT ID: ${tokenId || 'N/A'}</p>
                </div>
                <div class="text-right">
                    <span class="text-lg sm:text-2xl font-bold ${hasValue ? 'text-green-600' : 'text-gray-500'}">
                        ${totalValueDisplay}
                    </span>
                    <p class="text-xs text-gray-500 mt-1">Total Position Value</p>
                </div>
            </div>

            <div class="p-4 sm:p-6 space-y-4">
                <!-- NFT Details Section -->
                <div class="flex justify-around text-center border-b pb-4 border-gray-100">
                    <div>
                        <p class="text-xs font-medium text-gray-500">Range</p>
                        <p class="font-bold text-gray-800">${range}</p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-gray-500">Fee Tier</p>
                        <p class="font-bold text-gray-800">${feeTier}</p>
                    </div>
                </div>

                <!-- Primary Assets Section -->
                ${primary_assets.length > 0 ? `
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p class="font-semibold text-gray-700 mb-2 flex items-center">
                        <i class="fa-solid fa-layer-group mr-2 text-indigo-500"></i> Liquidity Assets
                    </p>
                    ${primaryAssetHtml}
                </div>
                ` : '<p class="text-sm text-center text-gray-500 py-2">No liquidity assets found.</p>'}

                <!-- Reward Assets Section -->
                ${reward_assets.length > 0 ? `
                <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p class="font-semibold text-green-700 mb-2 flex items-center">
                        <i class="fa-solid fa-gift mr-2"></i> Unclaimed Rewards
                    </p>
                    ${rewardAssetHtml}
                </div>
                ` : '<p class="text-sm text-center text-gray-500 py-2">No unclaimed rewards.</p>'}

                <!-- Actions/Links -->
                <div class="pt-4 border-t border-gray-100 flex justify-end">
                    ${DappUrl && DappUrl !== "" ? `<a href="${DappUrl}" target="_blank" class="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition duration-150 flex items-center">
                        View Position on xFlows <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-xs"></i>
                    </a>` : ''}
                </div>
            </div>
        </div>
    `;
}

// -------------------- 主渲染函数 (导出) --------------------

/**
 * 渲染 xFLows (V3 LP NFT) DApp 资产组。
 * @param {string} dappName - DApp 名称 (例如 'xFLows')
 * @param {Array<Object>} assets - DApp 资产数组
 * @param {Function} formatUSD - 格式化 USD 值的函数
 * @returns {string} 渲染后的 HTML 字符串
 */
export function renderDappGroup(dappName, assets, formatUSD) {
    if (!assets || assets.length === 0) {
        return ''; 
    }
    
    // 计算当前 DApp 组的总价值 (所有 NFT 价值之和)
    // 确保对 asset.usdValue 进行校验，防止 undefined/null 导致 NaN
    const dappTotalValue = assets.reduce((sum, asset) => sum + (parseFloat(asset.usdValue) || 0), 0);
    const totalValueDisplay = formatUSD(dappTotalValue);

    // 获取 DApp URL (假设第一个资产包含 DappUrl)
    const dappUrl = assets[0] && assets[0].extra ? assets[0].extra.DappUrl || null : null;

    // 渲染所有 LP NFT 卡片
    const cardsHtml = assets.map(asset => {
        // 检查资产类型是否是我们期望的 V3 LP NFT
        const assetType = asset.extra?.assetType;
        if (assetType === 'V3_LP_POSITION' || assetType === 'V3 LP NFT') {
            return renderV3LPCard(asset, formatUSD);
        }
        // 如果不是 V3 LP NFT，显示一个警告卡片
        return `
            <div class="bg-orange-50 rounded-xl shadow-md p-4 text-orange-700 border border-orange-200">
                <i class="fa-solid fa-triangle-exclamation mr-2"></i>
                Warning: Non-V3 LP NFT asset (${asset.asset || 'Unknown Asset'}) skipped.
            </div>
        `;
    }).join('');

    return `
        <div class="dapp-group space-y-4">
            <!-- DApp Header 保持与 DefaultRenderer 一致的样式 -->
            <div class="dapp-header">
                <h2 class="dapp-name">${dappName} Assets (${assets.length} Positions)</h2>
                <div class="header-right-side">
                    <!-- 显示总价值，并使用 Font Awesome 图标 -->
                    <div class="total-usd-value ${dappTotalValue === 0 ? 'total-placeholder' : ''}">
                        <i class="fa-solid fa-sack-dollar"></i> ${totalValueDisplay}
                    </div>
                    <!-- Go to DApp 链接 -->
                    ${dappUrl && dappUrl !== "" ? `<a href="${dappUrl}" target="_blank" class="dapp-link">Go to DApp <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                </div>
            </div>

            <!-- LP NFT Cards Container -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${cardsHtml}
            </div>
        </div>
    `;
}