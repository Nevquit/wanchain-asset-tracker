// services/protocols/storeman.js
// 修正版本：所有资产都使用统一的 DappName "Storeman"

import { toBigInt } from 'ethers';
import IWAN from 'iwan-sdk';
import { IWAN_CONFIG } from '../../src/config/shared.js';
import { formatUnits } from '../../src/utils/helpers.js';
import { createAssetData } from '../../src/utils/assetModel.js';

// --- 协议配置 ---
const DAPP_NAME = "Storeman"; // 🚨 统一的 DAPP_NAME
const STOREMAN_CONTRACT_ADDR = "0x1E7450D5d17338a348C5438546f0b4D0A5fbeaB6"; 
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
 * 辅助函数：累加存款和奖励 BigInt 值
 * @param {Array} records - Delegation 或 Stake 记录数组
 * @returns {{deposit: bigint, incentive: bigint}}
 */
function accumulateStoremanValues(records) {
    let deposit = 0n;
    let incentive = 0n;

    if (Array.isArray(records)) {
        for (const record of records) {
            if (record.deposit && record.deposit !== '0') {
                deposit += toBigInt(record.deposit);
            }
            if (record.incentive && record.incentive !== '0') {
                incentive += toBigInt(record.incentive);
            }
        }
    }
    return { deposit, incentive };
}

/**
 * 核心函数：查询 Storeman 委托状态和资产
 * @param {string} userAddr 
 * @returns {Promise<AssetData[]>}
 */
export async function getStoremanAssets(userAddr) {
    const results = [];
    let apiClient = null;

    try {
        apiClient = initializeApiClient();
        
        // 1. 查询委托 (Delegation) 资产
        const delegationResults = await apiClient.getStoremanDelegatorInfo({ "address": [userAddr] });
        const { deposit: totalDeposit, incentive: totalIncentive } = accumulateStoremanValues(delegationResults);
        
        // 2. 查询质押 (Stake/Validator) 资产
        const stakeResults = await apiClient.getStoremanStakeInfo({ "address": [userAddr] });
        const { deposit: totalStake, incentive: totalStakeIncentive } = accumulateStoremanValues(stakeResults);
        
        // 3. 构造结果数组

        // Storeman Delegation (委托质押)
        if (totalDeposit > 0n) {
            results.push(createAssetData({
                DappName: DAPP_NAME, // 🚨 统一为 "Storeman"
                asset: "WAN", 
                asset_ca: WAN_ASSET_CA, 
                amount: formatUnits(totalDeposit, DECIMALS), 
                extra: {
                    DappUrl: "",
                    type: "StoremanDelegation",  // 保持细化类型
                    protocolContract: STOREMAN_CONTRACT_ADDR 
                } 
            }));
        }
        
        // Storeman Delegation Incentive (委托奖励)
        if (totalIncentive > 0n) {
            results.push(createAssetData({
                DappName: DAPP_NAME, // 🚨 统一为 "Storeman"
                asset: "WAN", 
                asset_ca: WAN_ASSET_CA, 
                amount: formatUnits(totalIncentive, DECIMALS), 
                extra: { 
                    DappUrl: "",
                    type: "StoremanDelegationIncentive", // 保持细化类型
                    protocolContract: STOREMAN_CONTRACT_ADDR 
                }
            }));
        }

        // Storeman Stake (节点质押 / Validator)
        if (totalStake > 0n) {
            results.push(createAssetData({
                DappName: DAPP_NAME, // 🚨 统一为 "Storeman"
                asset: "WAN", 
                asset_ca: WAN_ASSET_CA, 
                amount: formatUnits(totalStake, DECIMALS), 
                extra: {
                    DappUrl: "",
                    type: "StoremanStake",  // 保持细化类型
                    protocolContract: STOREMAN_CONTRACT_ADDR 
                } 
            }));
        }
        
        // Storeman Stake Incentive (节点奖励)
        if (totalStakeIncentive > 0n) {
            results.push(createAssetData({
                DappName: DAPP_NAME, // 🚨 统一为 "Storeman"
                asset: "WAN", 
                asset_ca: WAN_ASSET_CA, 
                amount: formatUnits(totalStakeIncentive, DECIMALS), 
                extra: { 
                    DappUrl: "",
                    type: "StoremanStakeIncentive", // 保持细化类型
                    protocolContract: STOREMAN_CONTRACT_ADDR 
                } 
            }));
        }

        return results;

    } catch (e) {
        console.error("[ERROR] Storeman asset check failed:", e.message);
        return null;
    } finally {
        if (apiClient && typeof apiClient.close === 'function') {
            apiClient.close();
        }
    }
}
