// js/render/DefaultRenderer.js

/**
 * Renders a single asset row (<tr>) for standard table display.
 * @param {Object} asset - 包含资产信息的对象
 * @param {Function} formatUSD - 从 priceFetcher 传入的格式化函数
 * @returns {string} 渲染后的 HTML 字符串
 */
function renderAssetRow(asset, formatUSD) {
    const { asset: assetSymbol, amount, asset_ca, extra, DappName, usdValue, price } = asset; 
    const { type, protocolContract, rewradCa } = extra;
    
    // 价格显示逻辑
    const USD_VALUE_DISPLAY = (price > 0 || parseFloat(amount) === 0) 
                              ? formatUSD(usdValue) 
                              : 'N/A (Price Feed Missing)'; 
    
    // --- 合约地址显示逻辑 (Storeman 修正) ---
    let contractAddress = null; 
    let contractPrefix = '';

    // 1. Storeman 逻辑：对于 Storeman，优先且只使用 protocolContract
    if (DappName && DappName.includes('Storeman') && protocolContract) {
        contractAddress = protocolContract;
        contractPrefix = 'Protocol Contract';
    } 
    // 2. 奖励/xWAN 逻辑
    else if (type === 'xWAN-Pending-Reward' && rewradCa) {
        contractAddress = rewradCa;
        contractPrefix = 'Reward Contract';
    } 
    // 3. 钱包/其他代币（默认使用 Token Contract/Asset Contract）
    else if (asset_ca && asset_ca !== "") {
        contractAddress = asset_ca;
        contractPrefix = (DappName === 'Wallet') ? 'Token Contract' : 'Asset Contract';
    } 
    // 4. 回退到旧的 protocolContract 字段（以防万一）
    else if (protocolContract && protocolContract !== "") {
        contractAddress = protocolContract;
        contractPrefix = (DappName === 'Wallet') ? 'Token Contract' : 'Protocol Contract';
    }
    
    let contractDisplay = 'N/A';
    // 假设 window.copyToClipboard 是全局可用的
    if (contractAddress) {
        const displayAddress = `${contractPrefix}: ...${contractAddress.slice(-6)}`;
        contractDisplay = `
            <span class="contract-copy-cell" 
                  title="Click to copy contract address"
                  data-address="${contractAddress}"
                  onclick="copyToClipboard('${contractAddress}', this)">
                ${displayAddress} 
                <span class="copy-icon">📋</span>
            </span>
        `;
    }

    // --- 返回 HTML 部分 ---
    return `
        <tr class="asset-row type-${type}">
            <td class="asset-col asset-symbol-col" data-label="Token"> 
                <div class="token-icon-placeholder"></div>
                <div class="token-info">
                    <span class="asset-symbol">${assetSymbol}</span>
                    <span class="asset-type">${type.split('-').join(' ')}</span>
                </div>
            </td>
            <td class="asset-col asset-amount-col" data-label="Amount"> 
                <span class="asset-amount">${amount}</span>
            </td>
            <td class="asset-col asset-value-col" data-label="USD Value"> 
                <span class="asset-value ${price === 0 ? 'placeholder-value' : ''}">
                    ${USD_VALUE_DISPLAY}
                </span>
            </td>
            <td class="asset-col asset-contract-col" data-label="Details/Contract"> 
                ${contractDisplay}
            </td>
        </tr>
    `;
}

/**
 * 默认渲染器：渲染标准的 DApp 分组容器和资产表格。
 * @param {string} dappName - DApp 名称
 * @param {Array<Object>} assets - 该 DApp 的资产列表
 * @param {Function} formatUSD - 从 priceFetcher 传入的格式化函数
 */
export function renderDappGroup(dappName, assets, formatUSD) {
    if (!assets || assets.length === 0) {
        return ''; 
    }
    
    const firstAsset = assets[0];
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
                    <div class="total-usd-value ${dappTotalValue === 0 ? 'total-placeholder' : ''}">
                        ${totalValueDisplay}
                    </div>
                    ${dappUrl && dappUrl !== "" ? `<a href="${dappUrl}" target="_blank" class="dapp-link">Go to DApp »</a>` : ''}
                </div>
            </div>

            <table class="asset-table">
                <thead>
                    <tr>
                        <th class="table-header symbol-header">Token</th>
                        <th class="table-header amount-header">Amount</th>
                        <th class="table-header value-header">USD Value</th>
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