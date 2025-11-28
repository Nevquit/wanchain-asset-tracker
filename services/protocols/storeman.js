// services/protocols/storeman.js

import { ethers } from 'ethers';
import IWAN from 'iwan-sdk';
import { IWAN_CONFIG } from '../../config/shared.js'; // 导入 SDK 配置
import { formatUnits } from '../../utils/helpers.js';
import { createAssetData } from '../../utils/assetModel.js';

const Dapp = "Storeman";
// 🚨 协议自治配置：Storeman 合约地址
const STOREMAN_CONTRACT_ADDR = "0x1E7450D5d17338a348C5438546f0b4D0A5fbeaB6"; 

/**
 * 核心函数：查询 Storeman 委托状态和资产 (基于 iWAN SDK)
 * @param {string} userAddr 
 * @returns {Promise<AssetData[]>}
 */
export async function getStoremanAssets(userAddr) {
    const results = [];
    let apiClient;
    const DECIMALS = 18; 
    
    let totalDeposit = 0n;
    let totalIncentive = 0n;

    try {
        // 1. 初始化 iWAN SDK 客户端
        apiClient = new IWAN(
            IWAN_CONFIG.API_KEY, 
            IWAN_CONFIG.SECRET_KEY, 
            { 
                url: IWAN_CONFIG.URL, 
                port: IWAN_CONFIG.PORT 
            }
        );
        
        // 2. 真实数据查询
        const delegationResults = await apiClient.getStoremanDelegatorInfo({
            "address": [userAddr] 
        });
        
        // 3. 循环处理并累加所有节点的质押和奖励
        if (Array.isArray(delegationResults)) {
            for (const delegation of delegationResults) {
                // 累加 Deposit (质押)
                if (delegation.deposit && delegation.deposit !== '0') {
                    totalDeposit += ethers.toBigInt(delegation.deposit);
                }
                
                // 累加 Incentive (待领奖励)
                if (delegation.incentive && delegation.incentive !== '0') {
                    totalIncentive += ethers.toBigInt(delegation.incentive);
                }
            }
        }
        
        // 4. 格式化并推入结果数组 (略)
        // ...
        if (totalDeposit > 0n) {
            results.push(createAssetData({
                DappName: Dapp,
                asset: "WAN", 
                asset_ca: "0x0000000000000000000000000000000000000000", 
                amount: formatUnits(totalDeposit, DECIMALS), 
                extra: { // 🚨 将 type 和 contract 封装到 extra 对象中
                    DappUrl:"",
                    type: "StoremanDelegation",  
                    protocolContract: STOREMAN_CONTRACT_ADDR 
                    } 
            }));
        }
        
        if (totalIncentive > 0n) {
            results.push(createAssetData({
                DappName: Dapp,
                asset: "WAN", 
                asset_ca: "0x0000000000000000000000000000000000000000", 
                amount: formatUnits(totalIncentive, DECIMALS), 
                extra: { // 🚨 将 type 和 contract 封装到 extra 对象中
                    DappUrl:"",
                    type: "StoremanDelegationIncentive", 
                    protocolContract: STOREMAN_CONTRACT_ADDR 
                    } // 使用内部配置
            }));
        }
        
        return results;

    } catch (e) {
        console.error("[ERROR] Storeman Delegation check failed:", e.message);
        return null;
    } finally {
        if (apiClient && typeof apiClient.close === 'function') {
            apiClient.close();
        }
    }
}