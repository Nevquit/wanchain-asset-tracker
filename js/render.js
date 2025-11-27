// js/render.js

import { formatUSD } from './priceFetcher.js'; 

/**
 * Copies text to the clipboard and provides visual feedback.
 * 🚨 MUST be attached to the window object to be called from inline onclick.
 */
window.copyToClipboard = function(text, element) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = element.innerHTML;
            element.innerHTML = 'Copied! ✅';
            element.classList.add('copied');
            setTimeout(() => {
                element.innerHTML = originalText;
                element.classList.remove('copied');
            }, 1000);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('Copy failed, please copy manually.');
        });
    } else {
        alert('Your browser does not support auto-copy function. Please copy manually: ' + text);
    }
}


/**
 * Groups assets by DappName.
 */
function groupAssetsByDappName(assets) {
    return assets.reduce((groups, asset) => {
        const dappName = asset.DappName || 'Unknown Protocol';
        if (!groups[dappName]) {
            groups[dappName] = [];
        }
        groups[dappName].push(asset);
        return groups;
    }, {});
}

/**
 * Renders a single asset row (<tr>).
 */
function renderAssetRow(asset) {
    const { asset: assetSymbol, amount, extra, DappName, usdValue } = asset;
    const { type, protocolContract, rewradCa } = extra;
    
    const USD_VALUE_DISPLAY = formatUSD(usdValue); 
    
    let contractAddress = null;
    let contractPrefix = '';

    if (type === 'xWAN-Pending-Reward' && rewradCa) {
        contractAddress = rewradCa;
        contractPrefix = 'Reward Contract';
    } else if (protocolContract && protocolContract !== "") {
        contractAddress = protocolContract;
        contractPrefix = (DappName === 'Wallet') ? 'Token Contract' : 'Protocol Contract';
    }
    
    let contractDisplay = 'N/A';
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
                <span class="asset-value ${usdValue === 0 ? 'placeholder-value' : ''}">
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
 * Renders the DApp group container.
 */
function renderDappGroup(dappName, assets) {
    if (!assets || assets.length === 0) {
        return ''; 
    }
    
    const firstAsset = assets[0];
    const dappUrl = firstAsset && firstAsset.extra ? firstAsset.extra.DappUrl || null : null;
    const rowsHtml = assets.map(renderAssetRow).join('');

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

/**
 * Renders a warning message for protocols that failed to fetch.
 */
function renderFailureWarning(failedProtocols) {
    if (failedProtocols.length === 0) return '';
    
    // 移除函数名前缀（如 "get"），使显示更友好
    const failedList = failedProtocols.map(name => `<li>${name.replace(/^(get|fetch)/i, '')}</li>`).join('');
    
    return `
        <div class="failure-warning-message">
            <h3>⚠️ Partial Data Available</h3>
            <p>The following protocols failed to return asset data. The results displayed below are incomplete.</p>
            <ul>${failedList}</ul>
            <p>This is usually due to a temporary API timeout or a RPC error.</p>
        </div>
    `;
}

/**
 * Main function to render all results.
 */
export function renderResults(assets, failedProtocols) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    const failureHtml = renderFailureWarning(failedProtocols);
    resultsContainer.innerHTML += failureHtml;

    if (assets.length === 0) {
        if (failedProtocols.length === 0) {
            resultsContainer.innerHTML += '<p style="text-align: center; color: #7F8C8D; margin-top: 30px;">No assets found for this address across all protocols.</p>';
        }
        return;
    }

    const groupedAssets = groupAssetsByDappName(assets);
    
    let htmlContent = '';
    for (const dappName in groupedAssets) {
        htmlContent += renderDappGroup(dappName, groupedAssets[dappName]);
    }
    
    resultsContainer.innerHTML += htmlContent;
}