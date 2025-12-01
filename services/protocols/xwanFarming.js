import { ethers, Contract } from 'ethers';
// 假设 PROVIDER, ERC20_ABI 在 shared.js 中
import { PROVIDER, ERC20_ABI } from '../../config/shared.js';
import { formatUnits } from '../../utils/helpers.js';
import { createAssetData } from '../../utils/assetModel.js';

const Dapp = "xStake";

// 🚨 协议配置：xWAN Farming 的所有 Pool 配置
// 合并了 MasterChef 地址、质押代币地址和精度
const FARMING_POOLS = {
    // key: 质押代币符号 | value: { mcAddr: MasterChef地址, tokenAddr: 质押代币地址, decimals: 精度 }
    wanBTC: { 
        mcAddr: "0x9E2C89d3b48ecB0761764D6a17594dA74f20f3Bb", 
        tokenAddr: "0x50c439B6d602297252505a6799d84eA5928bCFb6", 
        decimals: 8 
    }, 
    wanETH: { 
        mcAddr: "0xaeC46cd03C3489EF8C2061E66D3d57FA0171387D", 
        tokenAddr: "0xE3aE74D1518A76715aB4C7BeDF1af73893cd435A", 
        decimals: 18 
    }, 
    wanUSDT: { 
        mcAddr: "0x3167219355f3532B8B37e24213118A0898AdcdFB", 
        tokenAddr: "0x11e77E27Af5539872efEd10abaA0b408cfd9fBBD", 
        decimals: 6 
    }, 
    wanUSDC: { 
        mcAddr: "0x47047A990523F08743245160BD07dEcC442efA9C", 
        tokenAddr: "0x52A9CEA01c4CBDd669883e41758B8eB8e8E2B34b", 
        decimals: 6 
    }, 
};

const XWAN_FARMING_ABI = [
    // 假设 ABI 是统一的，查询质押金额和待领取奖励
    "function userInfo(address) view returns (uint256 amount, uint256 lastUpdateTime)",
    "function pendingReward(address _user, address _rewardToken) view returns (uint256)",
];

// 🚨 奖励代币符号列表已移除，因为现在每个池子只检查一个奖励代币。
// const REWARD_TOKEN_SYMBOLS = Object.keys(FARMING_POOLS); // 移除此行

/**
 * 核心函数：查询 xWAN Farming 质押和奖励
 * @param {string} userAddr 
 * @returns {Promise<AssetData[]>}
 */
export async function getXWANFarmingAssets(userAddr) {
    const results = [];

    // 遍历所有 Farming Pool
    for (const stakedSymbol in FARMING_POOLS) {
        const pool = FARMING_POOLS[stakedSymbol];
        const mcAddr = pool.mcAddr;
        const tokenAddr = pool.tokenAddr;
        const decimals = pool.decimals;
        
        if (!ethers.isAddress(mcAddr) || !tokenAddr) continue;

        try {
            const mcContract = new Contract(mcAddr, XWAN_FARMING_ABI, PROVIDER);

            // 1. 查询用户在当前 Pool 中质押的金额 (Staked Token)
            const info = await mcContract.userInfo(userAddr);
            const stakedAmount = info.amount;
            
            if (stakedAmount > 0n) {
                // 质押资产记录
                results.push(createAssetData({
                    DappName: Dapp,  
                    asset: stakedSymbol, // 例如 wanBTC
                    asset_ca: tokenAddr, 
                    amount: formatUnits(stakedAmount, decimals), 
                    extra: { 
                        DappUrl: "https://xstake.wanchain.org/stakexwan",
                        type: `xWAN-Stake (${stakedSymbol} Pool)`, // 包含池子名称
                        protocolContract: mcAddr,
                        stakedAssetCA: tokenAddr,
                    } 
                }));
            }
            
            // 2. 查询待领取的奖励 (Pending Rewards)
            // 🚨 逻辑更新：只查询当前池子配置的代币作为奖励代币 (假设奖励代币就是质押代币)
            const rewardSymbol = stakedSymbol; 
            const rewardTokenAddr = tokenAddr; 
            const rewardDecimals = decimals;

            if (!ethers.isAddress(rewardTokenAddr)) continue;

            // 查询待领取奖励
            const pending = await mcContract.pendingReward(userAddr, rewardTokenAddr);
            
            if (pending > 0n) {
                // 奖励资产记录
                results.push(createAssetData({
                    DappName: Dapp,  
                    asset: rewardSymbol, 
                    asset_ca: rewardTokenAddr, 
                    amount: formatUnits(pending, rewardDecimals), 
                    extra: { 
                        DappUrl: "https://xstake.wanchain.org/stakexwan",
                        protocolContract: mcAddr,
                        type: `xWAN-Pending-Reward (${stakedSymbol} Pool)`, // 包含池子和奖励代币
                        rewardCa: rewardTokenAddr
                    } 
                }));
            }

        } catch (e) {
            console.error(`[ERROR] xWAN Farming scan failed for ${stakedSymbol} pool:`, e.message);
        }
    }
    
    return results;
}