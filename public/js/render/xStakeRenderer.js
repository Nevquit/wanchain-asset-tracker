// public/js/render/xStakeRenderer.js

import { formatAmount, formatUSD, getDappUrl, renderSymbolIcon } from './renderUtils.js';

/**
 * Renders a card for a single xStake position.
 * @param {Object} asset - The xStake asset object.
 * @returns {string} - The HTML string for the asset card.
 */
function renderXStakeCard(asset) {
    const { asset: stakedSymbol, amount: stakedAmount, usdValue: stakedUsdValue, extra } = asset;
    const { reward } = extra || {};
    
    const totalValue = (stakedUsdValue || 0) + (reward ? reward.usdValue || 0 : 0);
    const totalValueDisplay = formatUSD(totalValue);

    const renderSubAsset = (symbol, amount, value, contractAddress, isReward = false) => {
        const valueDisplay = formatUSD(value);
        return `
            <div class="sub-asset">
                <div class="asset-info">
                    ${renderSymbolIcon(symbol, contractAddress)}
                    <span>${symbol} ${isReward ? '(Reward)' : ''}</span>
                </div>
                <div class="asset-balance">
                    <span>${formatAmount(amount)}</span>
                    <span class="text-xs text-gray-500">${valueDisplay}</span>
                </div>
            </div>
        `;
    };

    const stakedAssetHtml = renderSubAsset(stakedSymbol, stakedAmount, stakedUsdValue, asset.asset_ca);
    const rewardAssetHtml = reward ? renderSubAsset(reward.asset, reward.amount, reward.usdValue, reward.asset_ca, true) : '';

    return `
        <div class="asset-card-xstake">
            <div class="card-header">
                <span class="font-semibold">${stakedSymbol} Staking</span>
                <span class="total-value">${totalValueDisplay}</span>
            </div>
            <div class="card-body">
                ${stakedAssetHtml}
                ${rewardAssetHtml}
            </div>
        </div>
    `;
}

/**
 * Renders the xStake DApp group.
 * @param {string} dappName - The name of the DApp.
 * @param {Array<Object>} assets - An array of xStake assets.
 * @returns {string} - The HTML string for the DApp group.
 */
export function renderDappGroup(dappName, assets) {
    if (!assets || assets.length === 0) {
        return '';
    }

    const dappUrl = getDappUrl(assets);
    const dappTotalValue = assets.reduce((sum, asset) => {
        const stakedValue = asset.usdValue || 0;
        const rewardValue = asset.extra && asset.extra.reward ? asset.extra.reward.usdValue || 0 : 0;
        return sum + stakedValue + rewardValue;
    }, 0);

    const assetCardsHtml = assets.map(renderXStakeCard).join('');

    return `
        <div class="dapp-group-xstake" data-dapp-name="${dappName}">
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
            <div class="assets-container-xstake">
                ${assetCardsHtml}
            </div>
        </div>
    `;
}
