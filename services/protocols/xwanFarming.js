// services/protocols/xwanFarming.js

import { ethers, Contract } from 'ethers';
import { PROVIDER, ERC20_ABI } from '../../config/shared.js';
import { formatUnits } from '../../utils/helpers.js';
import { createAssetData } from '../../utils/assetModel.js';
const Dapp = "xStake";
// 🚨 协议自治配置：xWAN Farming 合约地址和 ABI
const MASTER_CHEF_ADDR = "0x3167219355f3532B8B37e24213118A0898AdcdFB";

const XWAN_FARMING_ABI = [
    "function userInfo(address) view returns (uint256 amount, uint256 lastUpdateTime)",
    "function pendingReward(address _user, address _rewardToken) view returns (uint256)"
];

// 🚨 协议自治配置：xWAN Farming 奖励代币配置 (地址和精度)
// 注意：BTC, ETH, USDT, USDC 地址需要从 wallet.js 的配置中复制过来，或者在 wallet.js 中将配置导出。
// 为了保持 xwanFarming.js 的自治性，我们将奖励代币的地址也在这里定义。
const REWARD_TOKENS = {
    wanBTC: { addr: "0x50c439B6d602297252505a6799d84eA5928bCFb6", decimals: 8 }, 
    wanETH: { addr: "0xE3aE74D1518A76715aB4C7BeDF1af73893cd435A", decimals: 18 }, 
    wanUSDT: { addr: "0x11e77E27Af5539872efEd10abaA0b408cfd9fBBD", decimals: 6 }, 
    wanUSDC: { addr: "0x52A9CEA01c4CBDd669883e41758B8eB8e8E2B34b", decimals: 6 }, 
};

/**
 * 核心函数：查询 xWAN Farming 质押和奖励
 * @param {string} userAddr 
 * @returns {Promise<AssetData[]>}
 */
export async function getXWANFarmingAssets(userAddr) {
    const results = [];

    try {
        const mcContract = new Contract(MASTER_CHEF_ADDR, XWAN_FARMING_ABI, PROVIDER);

        // 1. 查询用户质押的金额
        const info = await mcContract.userInfo(userAddr);
        
        if (info.amount > 0n) {
            // ... (其余逻辑不变)
            results.push(createAssetData({
                DappName: Dapp,  
                asset: "WAN", 
                asset_ca: "0x0000000000000000000000000000000000000000", 
                amount: formatUnits(info.amount, 18), 
                extra: { // 🚨 将 type 和 contract 封装到 extra 对象中
                    DappUrl:"https://xstake.wanchain.org/stakexwan",
                    type: "xWAN-Stake", 
                    protocolContract: MASTER_CHEF_ADDR,
                    } 
            }));
        }
        
        // 2. 循环查询待领取的奖励
        for (const rewardSymbol in REWARD_TOKENS) {
            const { addr: rewardTokenAddr, decimals: rewardDecimals } = REWARD_TOKENS[rewardSymbol];
            if (!ethers.isAddress(rewardTokenAddr)) continue;
            const pending = await mcContract.pendingReward(userAddr, rewardTokenAddr);
            console.log("xfarming_rewardTokenAddr",rewardTokenAddr,rewardSymbol,pending)

            if (pending > 0n) {
                // ... (其余逻辑不变)
                results.push(createAssetData({
                    DappName: Dapp,  
                    asset: rewardSymbol, 
                    asset_ca: rewardTokenAddr, 
                    amount: formatUnits(pending, rewardDecimals), 
                    extra: { // 🚨 将 type 和 contract 封装到 extra 对象中
                        DappUrl:"https://xstake.wanchain.org/stakexwan",
                        protocolContract: MASTER_CHEF_ADDR,
                        type: "xWAN-Pending-Reward", 
                        rewradCa:rewardTokenAddr

                    } 
                }));
            }
        }

    } catch (e) {
        console.error("[ERROR] xWAN Farming scan failed:", e.message);
        
    }
    return results;
}