// js/render/index.js

import { renderDappGroup as renderDefaultDappGroup } from './DefaultRenderer.js';
import { renderDappGroup as renderStoremanDappGroup } from './StoremanRenderer.js';

/**
 * DApp 名称到渲染函数的映射表。
 * 使用 DApp 名称进行精确匹配，或使用关键字（如 'default'）进行回退。
 */
export const RENDERER_MAP = {
    // 精确匹配
    'Wallet': renderDefaultDappGroup,
    // Storeman DApps 
    'Storeman Delegation': renderStoremanDappGroup,
    'Storeman Delegation Incentive': renderStoremanDappGroup,
    // 其他 DApps (回退)
    'default': renderDefaultDappGroup 
};

/**
 * Groups assets by DappName. 保持不变
 */
export function groupAssetsByDappName(assets) {
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
 * 核心调度函数：根据 DApp 名称获取正确的渲染函数。
 * @param {string} dappName 
 * @returns {Function}
 */
export function getDappRenderer(dappName) {
    // 尝试精确匹配
    if (RENDERER_MAP[dappName]) {
        return RENDERER_MAP[dappName];
    }
    // 尝试关键字匹配 (如果 StoremanRenderer 需要处理所有包含 'Storeman' 的 DApp)
    if (dappName.includes('Storeman')) {
        return renderStoremanDappGroup;
    }
    // 回退到默认
    return RENDERER_MAP['default'];
}

/**
 * Renders a warning message for protocols that failed to fetch. (保持通用)
 */
export function renderFailureWarning(failedProtocols) {
    if (failedProtocols.length === 0) return '';
    
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