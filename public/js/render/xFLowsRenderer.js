// public/js/render/xFLowsRenderer.js

import { formatAmount, formatUSD, getDappUrl, renderSymbolIcon } from './renderUtils.js';

/**
 * Renders a card for a single xFlows V3 LP NFT position.
 * @param {Object} asset - The xFlows asset object.
 * @returns {string} - The HTML string for the asset card.
 */
function renderXFlowsCard(asset) {
    const { asset: assetSymbol, usdValue, extra } = asset;
    const { tokenId, primary_assets = [], reward_assets = [] } = extra || {};

    const totalValueDisplay = formatUSD(usdValue);

    const renderSubAsset = (subAsset, isReward = false) => {
        const valueDisplay = formatUSD(subAsset.usdValue);
        return `
            <div class="sub-asset">
                <div class="asset-info">
                    ${renderSymbolIcon(subAsset.symbol)}
                    <span>${subAsset.symbol} ${isReward ? '(Reward)' : ''}</span>
                </div>
                <div class="asset-balance">
                    <span>${formatAmount(subAsset.amount)}</span>
                    <span class="text-xs text-gray-500">${valueDisplay}</span>
                </div>
            </div>
        `;
    };

    const primaryAssetsHtml = primary_assets.map(sa => renderSubAsset(sa)).join('');
    const rewardAssetsHtml = reward_assets.map(sa => renderSubAsset(sa, true)).join('');

    return `
        <div class="asset-card-xflows">
            <div class="card-header">
                <span class="font-semibold">${assetSymbol} #${tokenId}</span>
                <span class="total-value">${totalValueDisplay}</span>
            </div>
            <div class="card-body">
                ${primaryAssetsHtml}
                ${rewardAssetsHtml}
            </div>
        </div>
    `;
}

/**
 * Renders the xFlows DApp group.
 * @param {string} dappName - The name of the DApp.
 * @param {Array<Object>} assets - An array of xFlows assets.
 * @returns {string} - The HTML string for the DApp group.
 */
export function renderDappGroup(dappName, assets) {
    if (!assets || assets.length === 0) {
        return '';
    }

    const dappUrl = getDappUrl(assets);
    const dappTotalValue = assets.reduce((sum, asset) => sum + (asset.usdValue || 0), 0);

    const assetCardsHtml = assets.map(renderXFlowsCard).join('');

    return `
        <div class="dapp-group-xflows" data-dapp-name="${dappName}">
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
            <div class="assets-container-xflows">
                ${assetCardsHtml}
            </div>
        </div>
    `;
}
