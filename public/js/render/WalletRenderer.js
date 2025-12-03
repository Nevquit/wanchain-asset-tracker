//WalletRenderer.js
/**
 * Wallet 资产专用渲染器。
 * 职责：
 * 1. 接收一个 Wallet DApp 组（包含各种代币资产）。
 * 2. 使用标准表格结构渲染资产。
 * 3. 核心：在 'Details/Contract' 列中，专门显示代币的合约地址 (asset_ca)，并标记为 'Token Contract'。
 */

// --- 实用工具函数 (在文件内部定义) ---

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
 * 生成一个基于符号首字母的简单圆点图标。
 * @param {string} symbol - 资产符号
 * @returns {string} HTML 字符串
 */
function renderSymbolIcon(symbol) {
    const initial = symbol ? symbol[0].toUpperCase() : '?';
    // 使用简单的颜色哈希，确保图标颜色一致性
    const hash = initial.charCodeAt(0) % 6;
    const colors = ['bg-indigo-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-blue-500'];
    const colorClass = colors[hash];

    return `<div class="asset-icon ${colorClass}">${initial}</div>`;
}

/**
 * 渲染单个资产行 (<tr>)。
 * @param {Object} asset - 包含资产信息的对象
 * @param {Function} formatUSD - 格式化函数
 * @returns {string} 渲染后的 HTML 字符串
 */
function renderAssetRow(asset, formatUSD) {
    const { asset: assetSymbol, amount, asset_ca, extra, DappName, usdValue, price } = asset; 
    const { protocolContract } = extra;
    
    // 价格显示逻辑
    const USD_VALUE_DISPLAY = (price > 0 || parseFloat(amount) === 0) 
                              ? formatUSD(usdValue) 
                              : `<span style="color: var(--info-color); font-weight: 500;">Price Missing</span>`; 
    
    // --- 核心 Wallet 合约地址显示逻辑：强制显示 Token Contract (asset_ca) ---
    let contractAddress = null; 
    let contractPrefix = '';

    if (asset_ca && asset_ca !== "") {
        contractAddress = asset_ca;
        contractPrefix = 'Token Contract'; // Wallet 资产的核心区别
    }
    // 奖励合约（如果存在）
    const rewardCaHtml = extra.rewradCa ? 
        `<div class="mt-1 text-xs text-gray-500">Reward: ${formatAddress(extra.rewradCa)}</div>` : '';

    const contractHtml = contractAddress ? `
        <div class="contract-details">
            <span class="text-xs font-semibold text-gray-700">${contractPrefix}:</span> 
            <span class="contract-address" 
                  title="${contractAddress}" 
                  onclick="copyToClipboard('${contractAddress}', this.closest('.contract-details').querySelector('button'))">
                ${formatAddress(contractAddress)}
            </span>
            <button class="copy-button"><i class="fa-solid fa-copy"></i></button>
            ${rewardCaHtml}
        </div>
    ` : `<span class="text-xs text-gray-500">N/A</span>`;

    return `
        <tr>
            <td class="symbol-col">
                ${renderSymbolIcon(assetSymbol)}
                <span class="font-semibold">${assetSymbol}</span>
                ${DappName !== 'Wallet' ? `<div class="text-xs text-gray-500 mt-1">${DappName}</div>` : ''}
            </td>
            <td class="amount-col">${formatAmount(amount)}</td>
            <td class="value-col">${USD_VALUE_DISPLAY}</td>
            <td class="contract-col">
                ${contractHtml}
            </td>
        </tr>
    `;
}

/**
 * 渲染整个 Wallet DApp 组的 HTML。
 * @param {string} dappName - DApp 的名称 ('Wallet')
 * @param {Array<Object>} assets - DApp 资产数组
 * @param {Function} formatUSD - 格式化 USD 值的函数
 * @returns {string} 渲染后的 HTML 字符串
 */
// 🚨 修复：将导出函数名改为 renderDappGroup，以匹配 index.js 中的导入。
export function renderDappGroup(dappName, assets, formatUSD) {
    if (!assets || assets.length === 0) {
        return ''; 
    }

    const firstAsset = assets.find(a => a.extra) || {};
    const dappUrl = firstAsset && firstAsset.extra ? firstAsset.extra.DappUrl || null : null;
    
    // 使用内部函数渲染每一行
    const rowsHtml = assets.map(asset => renderAssetRow(asset, formatUSD)).join('');

    // 计算当前 DApp 组的总价值
    const dappTotalValue = assets.reduce((sum, asset) => sum + (asset.usdValue || 0), 0);
    const totalValueDisplay = formatUSD(dappTotalValue);

    return `
        <div class="dapp-group">
            <div class="dapp-header">
                <h2 class="dapp-name">${dappName} Assets</h2>
                <div class="header-right-side">
                    <!-- 显示总价值，并使用 Font Awesome 图标 -->
                    <div class="total-usd-value ${dappTotalValue === 0 ? 'total-placeholder' : ''}">
                        <i class="fa-solid fa-sack-dollar"></i> ${totalValueDisplay}
                    </div>
                    <!-- Go to DApp 链接 -->
                    ${dappUrl && dappUrl !== "" ? `<a href="${dappUrl}" target="_blank" class="dapp-link">Go to DApp <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                </div>
            </div>

            <table class="asset-table">
                <thead>
                    <tr>
                        <th class="table-header symbol-header">Token</th>
                        <th class="table-header amount-header">Amount</th>
                        <th class="table-header value-header" style="text-align: right;">USD Value</th>
                        <th class="table-header contract-header">Details/Contract</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `;
}