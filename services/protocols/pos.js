// services/protocols/pos.js
// PoS 协议资产查询：只统计委托和质押金额，不包含激励/奖励部分。

import { ethers } from 'ethers';
import IWAN from 'iwan-sdk';
import { IWAN_CONFIG } from '../../config/shared.js';
import { formatUnits } from '../../utils/helpers.js';
import { createAssetData } from '../../utils/assetModel.js';

// --- 协议配置 ---
const DAPP_NAME = "PoS Staking"; // PoS 协议的 DApp 名称
const POS_CONTRACT_ADDR = "0x00000000000000000000000000000000000000da"; // 假设的 PoS 合约地址
const DECIMALS = 18; 
const WAN_ASSET_CA = "0x0000000000000000000000000000000000000000";

/**
 * 辅助函数：初始化 iWAN SDK 客户端
 * @returns {IWAN}
 */
function initializeApiClient() {
    return new IWAN(
        IWAN_CONFIG.API_KEY, 
        IWAN_CONFIG.SECRET_KEY, 
        { 
            url: IWAN_CONFIG.URL, 
            port: IWAN_CONFIG.PORT 
        }
    );
}

/**
 * 辅助函数：累加 BigInt 值 (仅存款/质押 amount)
 * * 适配 PoS 的返回结构：
 * - Delegation: 结构为 [{ address, amount, quitEpoch }]
 * - Stake: 结构为 [{ ..., amount, clients: [{ address, amount, ... }] }]
 * * @param {Array<Object>} records - PoS 记录数组
 * @returns {{deposit: bigint}}
 */
function accumulatePoSValues(records) {
    let deposit = 0n;
    console.log('records',records,records.length);
    if (Array.isArray(records)) {
        for (const record of records) {

            // 1. 累加自身质押/委托的 amount 字段
            if (record.amount && record.amount !== '0') {
                deposit += ethers.toBigInt(record.amount);
            }
        }

    }
    // ⚠️ 移除了 incentive 逻辑
    return { deposit }; 
}

/**
 * 核心函数：查询 PoS 委托状态和资产
 * @param {string} userAddr 
 * @returns {Promise<AssetData[]>}
 */
export async function getPoSAssets(userAddr) {
    const results = [];
    let apiClient = null;
    
    // 🚨 增强: 检查 userAddr 是否有效，避免使用无效地址调用 API
    if (!userAddr || userAddr.length < 40) { // 简单检查长度
        console.error("[ERROR] PoS asset check failed: Invalid or missing user address provided to getPoSAssets.");
        return [];
    }

    try {
        apiClient = initializeApiClient();
        
        // 1. 查询委托 (Delegate) 资产
        // 🚨 修正: 将参数从 { "address": [userAddr] } 改为 { "address": userAddr }
        const delegationResults = await apiClient.getDelegatorStakeInfo("WAN",userAddr);
        // accumulation 辅助函数会处理 amounts
        const { deposit: totalDelegate } = accumulatePoSValues(delegationResults);

        // 2. 查询质押 (Stake) 资产 (用户作为验证节点)
        // 🚨 修正: 将参数从 { "address": [userAddr] } 改为 { "address": userAddr }
        const stakeResults = await apiClient.getValidatorStakeInfo("WAN",userAddr);
        // accumulation 辅助函数会处理自身的 amount 和 clients 数组中的 amount
        const { deposit: totalStake } = accumulatePoSValues(stakeResults);
        
        // 3. 构造结果数组

        // PoS Delegate (委托)
        if (totalDelegate > 0n) {
            results.push(createAssetData({
                DappName: DAPP_NAME, 
                asset: "WAN", 
                asset_ca: WAN_ASSET_CA, 
                amount: formatUnits(totalDelegate, DECIMALS), 
                extra: {
                    DappUrl: "",
                    type: "PoSDelegate",  // 细化类型
                    protocolContract: POS_CONTRACT_ADDR 
                } 
            }));
        }
        
        // PoS Stake (节点质押 / Validator)
        if (totalStake > 0n) {
            results.push(createAssetData({
                DappName: DAPP_NAME, 
                asset: "WAN", 
                asset_ca: WAN_ASSET_CA, 
                amount: formatUnits(totalStake, DECIMALS), 
                extra: {
                    DappUrl: "",
                    type: "PoSStake",  // 细化类型
                    protocolContract: POS_CONTRACT_ADDR 
                } 
            }));
        }
        
        // ⚠️ 移除了 incentive (奖励) 相关的结果推送

        return results;

    } catch (e) {
        // 捕获 iWAN SDK 调用中的潜在错误
        // 🚨 增强错误日志记录，以防 e.message 为 undefined
        const errorMessage = (e && e.message) ? e.message : (e ? e.toString() : 'Unknown error during PoS API call.');
        console.error(`[ERROR] PoS asset check failed: ${errorMessage}`);
        return null; 
    } finally {
        if (apiClient && typeof apiClient.close === 'function') {
            // 确保关闭 iWAN 客户端连接
            apiClient.close();
        }
    }
}