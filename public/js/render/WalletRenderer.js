// public/js/render/WalletRenderer.js

import { formatAmount, formatAddress, formatUSD, getDappUrl, renderSymbolIcon } from './renderUtils.js';

/**
 * Renders a single asset card for the wallet view.
 * @param {Object} asset - The asset object.
 * @returns {string} - The HTML string for the asset card.
 */
function renderWalletAssetCard(asset) {
    const { asset: assetSymbol, amount, asset_ca, extra, usdValue, usdPrice } = asset;
    const { type } = extra || {};

    const priceDisplay = usdPrice > 0 ? formatUSD(usdPrice) : 'N/A';
    const valueDisplay = usdValue > 0 ? formatUSD(usdValue) : 'N/A';

    return `
        <div class="asset-card-wallet">
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
                <span class="text-xs text-gray-500">Token: ${formatAddress(asset_ca)}</span>
                <button class="copy-button" onclick="copyToClipboard('${asset_ca}', this)">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Renders the Wallet group with a card-based layout.
 * @param {string} dappName - The name of the DApp (Wallet).
 * @param {Array<Object>} assets - An array of wallet assets.
 * @returns {string} - The HTML string for the Wallet group.
 */
export function renderDappGroup(dappName, assets) {
    if (!assets || assets.length === 0) {
        return '';
    }

    const dappUrl = getDappUrl(assets);
    const dappTotalValue = assets.reduce((sum, asset) => sum + (asset.usdValue || 0), 0);

    const assetCardsHtml = assets.map(renderWalletAssetCard).join('');

    return `
        <div class="dapp-group-wallet">
            <div class="dapp-header-wallet">
                <h2 class="dapp-name">${dappName}</h2>
                <div class="dapp-meta">
                    <div class="total-value">
                        <i class="fa-solid fa-sack-dollar"></i>
                        <span>${formatUSD(dappTotalValue)}</span>
                    </div>
                    ${dappUrl ? `<a href="${dappUrl}" target="_blank" class="dapp-link">View on Wanscan <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                </div>
            </div>
            <div class="assets-container-wallet">
                ${assetCardsHtml}
            </div>
        </div>
    `;
}
