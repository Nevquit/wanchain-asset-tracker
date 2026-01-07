// public/js/render/DefaultRenderer.js

import { formatAmount, formatAddress, formatUSD, getDappUrl, renderSymbolIcon } from './renderUtils.js';

/**
 * Renders a single asset card for a standard display.
 * @param {Object} asset - The asset object.
 * @returns {string} - The HTML string for the asset card.
 */
function renderAssetCard(asset) {
    const { asset: assetSymbol, amount, asset_ca, extra, usdValue, usdPrice } = asset;
    const { type, protocolContract } = extra || {};

    const priceDisplay = usdPrice > 0 ? formatUSD(usdPrice) : 'N/A';
    const valueDisplay = usdValue > 0 ? formatUSD(usdValue) : 'N/A';

    let contractAddress = protocolContract || asset_ca;
    let contractType = protocolContract ? 'Protocol' : 'Token';

    return `
        <div class="asset-card-default">
            <div class="asset-info">
                ${renderSymbolIcon(assetSymbol)}
                <div class="asset-name">
                    <span class="font-semibold">${assetSymbol}</span>
                    <span class="text-xs text-gray-500">${type || 'Token'}</span>
                </div>
            </div>
            <div class="asset-balance">
                <span class="font-mono">${formatAmount(amount)}</span>
                <span class="text-xs text-gray-500">@ ${priceDisplay}</span>
            </div>
            <div class="asset-value">
                <span class="font-mono font-semibold">${valueDisplay}</span>
            </div>
            <div class="asset-contract">
                <span class="text-xs text-gray-500">${contractType}: ${formatAddress(contractAddress)}</span>
                <button class="copy-button" onclick="copyToClipboard('${contractAddress}', this)">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Renders a DApp group with a default card-based layout.
 * @param {string} dappName - The name of the DApp.
 * @param {Array<Object>} assets - An array of assets for the DApp.
 * @returns {string} - The HTML string for the DApp group.
 */
export function renderDappGroup(dappName, assets) {
    if (!assets || assets.length === 0) {
        return '';
    }

    const dappUrl = getDappUrl(assets);
    const dappTotalValue = assets.reduce((sum, asset) => sum + (asset.usdValue || 0), 0);

    const assetCardsHtml = assets.map(renderAssetCard).join('');

    return `
        <div class="dapp-group-default">
            <div class="dapp-header-default">
                <h2 class="dapp-name">${dappName}</h2>
                <div class="dapp-meta">
                    <div class="total-value">
                        <i class="fa-solid fa-sack-dollar"></i>
                        <span>${formatUSD(dappTotalValue)}</span>
                    </div>
                    ${dappUrl ? `<a href="${dappUrl}" target="_blank" class="dapp-link">Go to DApp <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                </div>
            </div>
            <div class="assets-container-default">
                ${assetCardsHtml}
            </div>
        </div>
    `;
}
