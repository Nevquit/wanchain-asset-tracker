//xStakeRenderer.js
/**
 * xStake 质押/挖矿 (Staking/Farming) 专用渲染器。
 * 职责：
 * 1. 接收一个 DApp 组（包含一个或多个 xStake 资产）。
 * 2. 对每个质押资产渲染一个详细的卡片视图。
 * 3. 汇总当前 DApp 组的总价值。
 * 4. 使用传入的 formatUSD 函数。
 */

// --- 实用工具函数 (在文件内部定义) ---\

/**
 * 格式化金额，保留 4 位小数。
 * @param {string|number} amount - 数量
 * @returns {string} 格式化后的字符串
 */
function formatAmount(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.0000';
    // 限制最大显示位数为 6 位，最小为 4 位，以保证精度和可读性
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
    if (!address || address.length < 10) return address || 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 生成一个基于符号首字母的圆形图标。
 * @param {string} symbol - 资产符号
 * @returns {string} HTML 字符串
 */
function renderIcon(symbol) {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 60%, 65%)`;

    return `
        <div class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white uppercase" 
             style="background-color: ${color}; min-width: 24px;">
            ${symbol.charAt(0)}
        </div>
    `;
}


/**
 * 渲染单个 xStake 质押资产卡片。
 * @param {Object} asset - 质押资产对象
 * @param {Function} formatUSD - 格式化 USD 值的函数
 * @returns {string} 渲染后的 HTML 字符串
 */
function renderXStakeCard(asset, formatUSD) {
    const { 
        asset: stakedSymbol, // Staked Token Symbol
        amount: stakedAmount,
        usdValue: stakedUsdValue,
        extra
    } = asset;

    const { 
        protocolContract, 
        stakedToken, // Staked Token Address
        reward, 
        DappUrl 
    } = extra;
    
    // --- 质押资产部分 ---
    const formattedStakedValue = formatUSD(stakedUsdValue);
    
    // --- 奖励资产部分 ---
    const rewardAsset = reward || {};
    const rewardSymbol = rewardAsset.asset || 'N/A';
    const rewardAmount = rewardAsset.amount || '0';
    const rewardUsdValue = rewardAsset.usdValue || 0;
    
    const formattedRewardValue = formatUSD(rewardUsdValue);
    
    const hasReward = parseFloat(rewardAmount) > 0;
    
    // 计算总卡片价值 (质押 + 奖励)
    const cardTotalValue = stakedUsdValue + rewardUsdValue;
    const formattedCardTotalValue = formatUSD(cardTotalValue);

    // --- 卡片主体 ---
    return `
        <!-- 使用 .asset-card 样式 -->
        <div class="asset-card p-6 relative overflow-hidden space-y-4">
            <!-- Header: Staking Pool & Total Value -->
            <div class="flex justify-between items-start border-b pb-3 border-gray-100">
                <div class="flex flex-col">
                    <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        ${renderIcon(stakedSymbol)}
                        ${stakedSymbol} Staking
                    </h3>
                    <p class="text-sm font-medium text-gray-500">Pool Contract</p>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-2xl font-extrabold text-indigo-600 font-monospace">${formattedCardTotalValue}</span>
                    <span class="text-xs font-medium text-gray-500">Total USD Value</span>
                </div>
            </div>

            <!-- Staked Asset -->
            <div class="space-y-3">
                <p class="text-md font-semibold text-gray-700 flex items-center gap-2">
                    <i class="fa-solid fa-layer-group text-green-600"></i>
                    Staked Assets
                </p>
                <div class="flex justify-between items-center text-base p-2 bg-gray-50 rounded-md">
                    <span class="font-medium text-gray-800">${stakedSymbol}</span>
                    <div class="flex flex-col items-end">
                        <span class="font-mono text-gray-900">${formatAmount(stakedAmount)}</span>
                        <span class="text-xs text-gray-500">${formattedStakedValue}</span>
                    </div>
                </div>
            </div>

            <!-- Rewards -->
            <div class="space-y-3 pt-3 border-t border-gray-100">
                <p class="text-md font-semibold text-gray-700 flex items-center gap-2">
                    <i class="fa-solid fa-gift ${hasReward ? 'text-amber-500' : 'text-gray-400'}"></i>
                    Rewards
                </p>
                ${hasReward ? `
                    <div class="flex justify-between items-center text-base p-2 bg-amber-50 rounded-md border border-amber-200">
                        <span class="font-medium text-amber-700">${rewardSymbol} (Harvestable)</span>
                        <div class="flex flex-col items-end">
                            <span class="font-mono text-amber-900 font-bold">${formatAmount(rewardAmount)}</span>
                            <span class="text-xs text-amber-700">${formattedRewardValue}</span>
                        </div>
                    </div>
                ` : `<p class="text-sm text-gray-500 p-2 bg-gray-50 rounded-md"><i class="fa-solid fa-check-circle text-green-500 mr-1"></i> No harvestable rewards.</p>`}
            </div>
            
            <!-- Details / Contract -->
            <div class="pt-4 border-t border-gray-100 text-xs">
                <span class="text-gray-500">Protocol: </span>
                <span class="text-indigo-600 font-mono cursor-pointer" 
                      onclick="copyToClipboard('${protocolContract}', this)" 
                      title="Click to copy protocol contract address">
                    ${formatAddress(protocolContract)}
                </span>
                <i class="fa-regular fa-clipboard text-gray-400"></i>
            </div>
        </div>
    `;
}


/**
 * Renders the asset group for xStake using the dedicated card layout.
 * @param {string} dappName - The name of the DApp.
 * @param {Array<Object>} assets - DApp 资产数组
 * @param {Function} formatUSD - 格式化 USD 值的函数
 * @returns {string} 渲染后的 HTML 字符串
 */
export function renderDappGroup(dappName, assets, formatUSD) {
    if (!assets || assets.length === 0) {
        return ''; 
    }
    
    const firstAsset = assets[0];
    const dappUrl = firstAsset && firstAsset.extra ? firstAsset.extra.DappUrl || null : null;
    
    // 计算当前 DApp 组的总价值 (所有卡片总价值之和)
    // 注意：在卡片内部已经包含了质押资产和奖励的总价值
    const dappTotalValue = assets.reduce((sum, asset) => {
        const stakedValue = asset.usdValue || 0;
        const rewardValue = asset.extra?.reward?.usdValue || 0;
        return sum + stakedValue + rewardValue;
    }, 0);
    
    const totalValueDisplay = formatUSD(dappTotalValue);

    // 渲染所有 xStake 卡片
    const cardsHtml = assets.map(asset => renderXStakeCard(asset, formatUSD)).join('');

    return `
        <div class="dapp-group space-y-4">
            <!-- DApp Group Header 使用 .dapp-header 全局样式 -->
            <div class="dapp-header">
                <h2 class="dapp-name">${dappName} Assets</h2>
                <div class="header-right-side">
                    <div class="total-usd-value ${dappTotalValue === 0 ? 'total-placeholder' : ''}">
                        <i class="fa-solid fa-sack-dollar"></i> ${totalValueDisplay}
                    </div>
                    ${dappUrl && dappUrl !== "" ? `<a href="${dappUrl}" target="_blank" class="dapp-link">Go to DApp <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                </div>
            </div>

            <!-- Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${cardsHtml}
            </div>
        </div>
    `;
}