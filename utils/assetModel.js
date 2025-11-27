// utils/assetModel.js (新结构)

// 🚨 资产数据结构规范
/**
 * @typedef {object} AssetData
 * @property {string} DappName - 资产归属 (如: 'Wallet', 'Storeman', 'Xstake')
 * @property {string} asset - 资产名称/符号 (如: 'WAN', 'USDT', 'Farming')
 * @property {string} amount - 格式化后的金额字符串 (已应用 formatUnits)
 * @property {object} extra - 协议自定义的元数据对象
 * @property {string} extra.type - (推荐) 资产的类型或状态 (如: '钱包余额', 'Storeman 质押')
 * @property {string} extra.contract - (推荐) 相关的合约地址或协议标识
 * @property {string} extra.coingeckoId - (推荐) 获取price的id
 */


/**
 * 构造并标准化一个资产数据对象。
 * @param {string} asset - 资产名称/符号
 * @param {string} amount - 格式化后的金额字符串
 * @param {object} extra - 协议自定义的元数据对象
 * @returns {AssetData}
 */
export function createAssetData({ DappName,asset, amount, extra }) {
    // 强制类型转换和基本验证
    if (!asset || !amount || typeof extra !== 'object' || extra === null) {
        throw new Error("Invalid asset data provided: Missing required field or 'extra' is not an object.");
    }
    
    // 返回遵循规范的对象
    return {
        DappName:String(DappName),
        asset: String(asset),
        amount: String(amount),
        extra: extra,
    };
}