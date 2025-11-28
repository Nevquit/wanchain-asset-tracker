// js/render.js (主入口)

import { formatUSD } from './priceFetcher.js'; // 导入 formatUSD
import { 
    groupAssetsByDappName, 
    getDappRenderer, 
    renderFailureWarning 
} from './render/index.js'; // 从新的 index.js 导入核心逻辑

// -------------------- 辅助函数 (保持不变) --------------------

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


// -------------------- 主渲染函数 --------------------

/**
 * Main function to render all results.
 */
export function renderResults(assets, failedProtocols, totalUsdValue, queriedAddress) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    // 1. 渲染总价值和地址
    if (assets.length > 0) {
        const totalDiv = document.createElement('div');
        totalDiv.id = 'totalUsdValue';
        // 样式保持不变，但内容要加入地址
        totalDiv.style.cssText = 'font-size: 1.8em; font-weight: bold; margin-bottom: 25px; padding: 15px; border-bottom: 3px solid #007bff; background-color: #f8f9fa; border-radius: 5px; text-align: center;';
        
        const formattedTotal = formatUSD(totalUsdValue);
        totalDiv.innerHTML = `
            ${queriedAddress ? `<span style="font-size: 0.7em; font-weight: normal; color: #34495e;">Address: </span><span style="font-size: 0.8em; font-weight: bold; color: #555;">${queriedAddress}</span><br><br>` : ''}
            <span style="font-size: 0.7em; font-weight: normal; color: #6c757d;">Total Portfolio Value:</span>
            <br>
            <span style="color: #28a745; font-size: 1.2em;">${formattedTotal}</span>
        `;
        resultsContainer.appendChild(totalDiv);
    }
    
    // 2. 渲染失败警告
    const failureHtml = renderFailureWarning(failedProtocols);
    resultsContainer.innerHTML += failureHtml;
    // ... (其余逻辑保持不变)
    
    if (assets.length === 0 && failedProtocols.length === 0) {
        resultsContainer.innerHTML += '<p style="text-align: center; color: #7F8C8D; margin-top: 30px;">No assets found for this address across all protocols.</p>';
        return;
    }

    // 3. 渲染资产分组 (使用调度器)
    const groupedAssets = groupAssetsByDappName(assets);
    
    let htmlContent = '';
    for (const dappName in groupedAssets) {
        const renderer = getDappRenderer(dappName);
        htmlContent += renderer(dappName, groupedAssets[dappName], formatUSD);
    }
    
    // 将 DApp 组内容添加到容器
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    while (tempDiv.firstChild) {
        resultsContainer.appendChild(tempDiv.firstChild);
    }
}