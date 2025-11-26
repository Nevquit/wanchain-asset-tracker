import { ethers } from 'ethers';
import IWAN from 'iwan-sdk';

import { 
    PROVIDER, CONTRACTS, ERC20_ABI, xWAN_Farming_ABI, REWARD_TOKENS, RPC_URL,IWAN_CONFIG
} from '../config/constants.js';
import { formatUnits } from '../utils/helpers.js';

// ** 建议：未来每增加一种合约监控（如 Lending, DEX LP），就在这里增加一个对应的函数 **

/**
 * 查询 ERC20 代币余额
 * @param {string} symbol 
 * @param {string} contractAddr 
 * @param {string} userAddr 
 * @returns {Promise<AssetData | null>}
 */
export async function fetchTokenBalance(symbol, contractAddr, userAddr) {
    try {
        const contract = new ethers.Contract(contractAddr, ERC20_ABI, PROVIDER);
        const bal = await contract.balanceOf(userAddr);
        const decimals = await contract.decimals();
        
        if (bal.gt(0)) {
            // 尝试获取符号，如果失败则使用配置中的符号
            let tokenSymbol;
            try {
                tokenSymbol = await contract.symbol();
            } catch (e) {
                tokenSymbol = symbol;
            }
            
            return {
                asset: tokenSymbol, 
                type: "ERC20 钱包", 
                amount: formatUnits(bal, decimals), 
                contract: "..." + contractAddr.slice(-6)
            };
        }
        return null;
    } catch (e) {
        console.warn(`[WARN] Failed to fetch ${symbol} balance: ${e.message}`);
        return null;
    }
}

/**
 * 查询 xWAN Farming 质押和奖励
 * @param {string} userAddr 
 * @returns {Promise<AssetData[]>}
 */
export async function fetchxWANFarming(userAddr) {
    const results = [];
    const masterChefAddr = CONTRACTS.xWAN_Farming.xWAN_Farming_Contract;

    try {
        const mcContract = new ethers.Contract(masterChefAddr, xWAN_Farming_ABI, PROVIDER);

        // 1. 查询用户质押的金额
        const info = await mcContract.userInfo(userAddr);
        
        if (info.amount.gt(0)) {
             results.push({
                asset: `xWAN_Farming`, 
                type: "xWAN 质押", 
                amount: formatUnits(info.amount, 18), 
                contract: "..." + masterChefAddr.slice(-6)
            });
        }
        
        // 2. 循环查询待领取的奖励
        for (const rewardSymbol in REWARD_TOKENS) {
            const { addr: rewardTokenAddr, decimals: rewardDecimals } = REWARD_TOKENS[rewardSymbol];
            if (!ethers.utils.isAddress(rewardTokenAddr)) continue;

            const pending = await mcContract.pendingReward(userAddr, rewardTokenAddr);
            
            if (pending.gt(0)) {
                results.push({
                    asset: rewardSymbol, 
                    type: "Farming 待领", 
                    amount: formatUnits(pending, rewardDecimals), 
                    contract: "..." + rewardTokenAddr.slice(-6)
                });
            }
        }

    } catch (e) {
        console.error("[ERROR] xWAN Farming scan failed:", e.message);
        results.push({ asset: "xWAN Farming", type: "状态", amount: "查询失败", contract: "API" });
    }
    return results;
}

/**
 * 查询 Storeman 委托状态和资产 (基于 iWAN SDK)
 * 将所有节点的质押和奖励分别进行累加。
 * @param {string} userAddr 
 * @returns {Promise<AssetData[]>}
 */
export async function fetchStoremanDelegation(userAddr) {
    const results = [];
    let apiClient;
    const DECIMALS = 18; // Wanchain (WAN) 的标准精度
    
    // 1. 初始化 BigInt 累加器 (使用 0n 表示 BigInt 零)
    let totalDeposit = 0n;
    let totalIncentive = 0n;

    try {
        // 2. 初始化 iWAN SDK 客户端
        apiClient = new IWAN(
            IWAN_CONFIG.API_KEY, 
            IWAN_CONFIG.SECRET_KEY, 
            { 
                url: IWAN_CONFIG.URL, 
                port: IWAN_CONFIG.PORT 
            }
        );
        
        // 3. 真实数据查询
        const delegationResults = await apiClient.getStoremanDelegatorInfo({
            "address": [userAddr] 
        });
        
        // 4. 循环处理并累加所有节点的质押和奖励
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
        
        // 5. 格式化并推入结果数组
        
        // A. 总质押 (Storeman 质押)
        if (totalDeposit > 0n) {
            const amount = formatUnits(totalDeposit, DECIMALS);
            results.push({
                asset: "WAN", 
                type: "Storeman 质押", // storemandeposit
                amount: amount, 
                contract: CONTRACTS.Wanchain_Storeman.Wanchain_Storeman_Contract
            });
        }
        
        // B. 总待领奖励 (Storeman 待领奖励)
        if (totalIncentive > 0n) {
            const amount = formatUnits(totalIncentive, DECIMALS);
            results.push({
                asset: "WAN", 
                type: "Storeman 待领奖励", // storemanclaimbleincentive
                amount: amount, 
                contract: CONTRACTS.Wanchain_Storeman.Wanchain_Storeman_Contract 
            });
        }
        
        return results;

    } catch (e) {
        console.error("[ERROR] Storeman Delegation check failed:", e.message);
        return [{ asset: "iWAN/Storeman", type: "状态", amount: "查询失败", contract: "iWAN SDK" }];
    } finally {
        // 6. 关闭连接
        if (apiClient && typeof apiClient.close === 'function') {
            apiClient.close();
        }
    }
}