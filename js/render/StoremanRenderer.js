// js/render/StoremanRenderer.js

// 💡 修复：使用 'as' 关键字将导入的函数重命名为 'renderDefaultGroup'，避免名称冲突。
import { renderDappGroup as renderDefaultGroup } from './DefaultRenderer.js'; 

/**
 * Storeman 专用渲染器。
 * 🚨 注意：目前它与 DefaultRenderer.js 相同，但如果未来 Storeman 需要特殊的 HTML 结构（例如显示质押比率），则可以在这里修改。
 * * @param {string} dappName - DApp 名称
 * @param {Array<Object>} assets - 该 DApp 的资产列表
 * @param {Function} formatUSD - 格式化函数
 */
export function renderDappGroup(dappName, assets, formatUSD) {
    // 调用默认渲染器
    return renderDefaultGroup(dappName, assets, formatUSD);
}