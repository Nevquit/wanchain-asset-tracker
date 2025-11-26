// script.js

// 修正：使用相对路径，适用于本地开发和 Vercel 部署
const API_ENDPOINT = "/api/asset-tracker"; 

/**
 * 渲染 AssetData 数组到指定的表格 body 中
 * @param {HTMLTableSectionElement} tableBody 
 * @param {Array<Object>} assets 
 */
function renderAssets(tableBody, assets) {
    tableBody.innerHTML = ''; // 清空现有内容
    
    if (!assets || assets.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">暂无资产数据</td></tr>';
        return;
    }

    assets.forEach(asset => {
        const row = tableBody.insertRow();
        
        // 资产名称 (Asset)
        const cellAsset = row.insertCell();
        cellAsset.textContent = asset.asset;

        // 数量 (Amount)
        const cellAmount = row.insertCell();
        // 格式化数字显示，最多保留 6 位小数
        cellAmount.textContent = parseFloat(asset.amount).toLocaleString(undefined, { maximumFractionDigits: 6 });

        // 类型 / 合约 (Type / Contract)
        const cellType = row.insertCell();
        cellType.textContent = asset.type.includes('钱包') 
            ? asset.contract 
            : `${asset.type} (${asset.contract})`;
        
        // USD 价值 (占位符)
        const cellUSD = row.insertCell();
        cellUSD.textContent = `$0.00`; 

        // 特殊处理错误状态
        if (asset.amount === 'Error' || asset.type.includes('查询失败')) {
            row.style.backgroundColor = '#fdd';
            cellAmount.textContent = '查询失败';
        }
    });
}

/**
 * 主函数：获取数据并渲染
 * @param {string} address - 用户输入的钱包地址
 */
async function fetchAndRender(address) {
    const walletBody = document.getElementById('wallet-table').querySelector('tbody');
    const defiBody = document.getElementById('defi-table').querySelector('tbody');
    const totalValueElement = document.getElementById('total-value');
    
    // 基础输入检查
    if (!address || address.length < 40 || !address.startsWith('0x')) {
        alert("请输入有效的钱包地址！");
        return;
    }

    // 重置界面状态
    totalValueElement.textContent = '加载中...';
    walletBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">正在查询...</td></tr>';
    defiBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">正在查询...</td></tr>';


    try {
        // 使用相对路径和地址参数发起 API 调用
        const response = await fetch(`${API_ENDPOINT}?address=${address}`); 
        const data = await response.json();

        if (data.status !== 200 || !Array.isArray(data.assets)) {
            throw new Error(data.message || "API 返回数据结构错误");
        }

        // 1. 数据分组：分为钱包资产和 DeFi 资产
        const walletAssets = data.assets.filter(a => a.type.includes('钱包'));
        const defiAssets = data.assets.filter(a => !a.type.includes('钱包'));
        
        // 2. 渲染
        renderAssets(walletBody, walletAssets);
        renderAssets(defiBody, defiAssets);

        // 3. 总价值 (目前仍是占位符，需要后端提供价格数据)
        totalValueElement.textContent = '$N/A'; 

    } catch (error) {
        console.error("渲染失败:", error);
        totalValueElement.textContent = '$Error';
        const errorMessage = `<tr><td colspan="4" style="color:red; text-align:center;">API加载失败: ${error.message}</td></tr>`;
        walletBody.innerHTML = errorMessage;
        defiBody.innerHTML = errorMessage;
    }
}


// --- 启动逻辑和事件监听 ---
document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchButton');
    const addressInput = document.getElementById('addressInput');

    // 绑定按钮点击事件
    fetchButton.addEventListener('click', () => {
        const address = addressInput.value.trim();
        fetchAndRender(address);
    });
    
    // 绑定回车键事件
    addressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchButton.click();
        }
    });

    // 初始化界面提示
    document.getElementById('total-value').textContent = '等待查询...';
});