// script.js

const API_ENDPOINT = "/api/asset-tracker"; // Vercel Dev 默认路由
const addressInput = document.getElementById('addressInput');
const fetchButton = document.getElementById('fetchButton');
const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loading');
const errorDisplay = document.getElementById('error');

// --- 辅助函数 ---

/**
 * 将平铺的资产列表按 DappName 进行分组
 * @param {Array<Object>} assets - 原始资产数组
 * @returns {Object} { DappName: [asset1, asset2, ...], ... }
 */
function copyToClipboard(text, element) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            // 复制成功后，短暂显示提示
            const originalText = element.textContent;
            element.textContent = '已复制!';
            element.classList.add('copied');
            setTimeout(() => {
                element.textContent = originalText;
                element.classList.remove('copied');
            }, 1000);
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制。');
        });
    } else {
        alert('您的浏览器不支持自动复制功能，请手动复制: ' + text);
    }
}

function groupAssetsByDappName(assets) {
    return assets.reduce((groups, asset) => {
        const dappName = asset.DappName || '未知协议'; // 安全检查
        if (!groups[dappName]) {
            groups[dappName] = [];
        }
        groups[dappName].push(asset);
        return groups;
    }, {});
}

/**
 * 渲染单个资产卡片
 * @param {Object} asset - 单个资产对象
 * @returns {string} 渲染后的 HTML 字符串
 */

function renderAssetCard(asset) {
    const { asset: assetSymbol, amount, extra } = asset;
    const { type, protocolContract, rewradCa } = extra;
    
    // 🚨 关键调整：确定要显示的合约地址
    let contractAddress = null;
    let contractPrefix = '';

    if (type === 'xWAN-Pending-Reward' && rewradCa) {
        // 对于待领奖励，显示奖励代币的合约地址 (rewradCa)
        contractAddress = rewradCa;
        contractPrefix = '奖励合约';
    } else if (protocolContract) {
        // 对于所有其他类型 (质押、余额等)，显示协议主合约 (protocolContract)
        contractAddress = protocolContract;
        contractPrefix = (type === 'NativeCoin' || type === 'ERC20') ? '代币合约' : '协议合约';
    }
    
    let contractHtml = '';
    if (contractAddress) {
        // 渲染成一个可点击的复制按钮
        const displayAddress = `${contractPrefix}: ...${contractAddress.slice(-6)}`;
        contractHtml = `
            <p class="asset-meta contract-copy" 
               title="点击复制合约地址"
               data-address="${contractAddress}"
               onclick="copyToClipboard('${contractAddress}', this)">
                ${displayAddress} 
                <span class="copy-icon">📋</span>
            </p>
        `;
    } else {
        contractHtml = '<p class="asset-meta">原生/无</p>';
    }

    return `
        <div class="asset-card type-${type}">
            <p class="asset-symbol">${assetSymbol}</p>
            <p class="asset-amount">${amount}</p>
            <p class="asset-type">${type.split('-').join(' ')}</p>
            ${contractHtml}
        </div>
    `;
}

// 🚨 导出 copyToClipboard 函数到全局作用域 (为了让内联 onclick 能调用)
window.copyToClipboard = copyToClipboard;

/**
 * 渲染 DApp 分组容器
 * @param {string} dappName - DApp 名称
 * @param {Array<Object>} assets - 该 DApp 的资产列表
 * @returns {string} 渲染后的 HTML 字符串
 */
function renderDappGroup(dappName, assets) {
    // 尝试获取 DappUrl (如果第一个资产有，我们就认为它是该 DApp 的链接)
    const dappUrl = assets[0].extra.DappUrl || null;
    
    // 渲染所有资产卡片
    const cardsHtml = assets.map(renderAssetCard).join('');

    return `
        <div class="dapp-group">
            <div class="dapp-header">
                <h2>${dappName} 资产</h2>
                ${dappUrl ? `<a href="${dappUrl}" target="_blank" class="dapp-link">前往 DApp »</a>` : ''}
            </div>
            <div class="asset-cards-grid">
                ${cardsHtml}
            </div>
        </div>
    `;
}

/**
 * 主渲染函数
 * @param {Array<Object>} assets - 完整的资产列表
 */
function renderResults(assets) {
    resultsContainer.innerHTML = '';
    
    if (assets.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center;">该地址在所有协议中未发现资产。</p>';
        return;
    }

    const groupedAssets = groupAssetsByDappName(assets);
    
    let htmlContent = '';
    for (const dappName in groupedAssets) {
        htmlContent += renderDappGroup(dappName, groupedAssets[dappName]);
    }
    
    resultsContainer.innerHTML = htmlContent;
}

// --- 事件处理和 API 调用 ---

async function fetchAssets() {
    const address = addressInput.value.trim();
    
    // 清理界面
    resultsContainer.innerHTML = '';
    errorDisplay.style.display = 'none';
    loadingIndicator.style.display = 'block';
    fetchButton.disabled = true;

    if (!address) {
        errorDisplay.textContent = '请输入一个地址。';
        errorDisplay.style.display = 'block';
        loadingIndicator.style.display = 'none';
        fetchButton.disabled = false;
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}?address=${address}`);
        const data = await response.json();

        if (response.status !== 200 || data.error) {
            // 处理 API 返回的错误 (例如 400 地址格式错误, 500 服务器错误)
            throw new Error(data.details || data.error || '服务器返回了错误。');
        }

        // 成功，渲染数据
        renderResults(data.assets);

    } catch (e) {
        console.error("Fetch Error:", e);
        errorDisplay.textContent = `查询失败: ${e.message}`;
        errorDisplay.style.display = 'block';
    } finally {
        loadingIndicator.style.display = 'none';
        fetchButton.disabled = false;
    }
}

// 绑定事件
fetchButton.addEventListener('click', fetchAssets);

// 允许按 Enter 键查询
addressInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchAssets();
    }
});