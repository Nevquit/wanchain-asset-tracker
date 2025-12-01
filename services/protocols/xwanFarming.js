import { ethers, Contract } from 'ethers';
// 假设 PROVIDER, ERC20_ABI 在 shared.js 中
import { PROVIDER, ERC20_ABI } from '../../config/shared.js';
import { formatUnits } from '../../utils/helpers.js';
import { createAssetData } from '../../utils/assetModel.js';

const Dapp = "xStake";

// 🚨 协议配置：xWAN Farming 的所有 Pool 配置
// 假设: 用户统一质押 WAN, 池子名称 (key) 代表其奖励代币。
const FARMING_POOLS = {
    // 质押资产都是 WAN (asset: "WAN", asset_ca: "0x0...")
    // value: { mcAddr: MasterChef地址, rewardSymbol: 奖励代币符号, rewardTokenAddr: 奖励代币地址, rewardDecimals: 奖励代币精度 }
    wanBTC: { 
        mcAddr: "0x9E2C89d3b48ecB0761764D6a17594dA74f20f3Bb", 
        rewardSymbol: "wanBTC",
        rewardTokenAddr: "0x50c439B6d602297252505a6799d84eA5928bCFb6", 
        rewardDecimals: 8 
    }, 
    wanETH: { 
        mcAddr: "0xaeC46cd03C3489EF8C2061E66D3d57FA0171387D", 
        rewardSymbol: "wanETH",
        rewardTokenAddr: "0xE3aE74D1518A76715aB4C7BeDF1af73893cd435A", 
        rewardDecimals: 18 
    }, 
    wanUSDT: { 
        mcAddr: "0x3167219355f3532B8B37e24213118A0898AdcdFB", 
        rewardSymbol: "wanUSDT",
        rewardTokenAddr: "0x11e77E27Af5539872efEd10abaA0b408cfd9fBBD", 
        rewardDecimals: 6 
    }, 
    wanUSDC: { 
        mcAddr: "0x47047A990523F08743245160BD07dEcC442efA9C", 
        rewardSymbol: "wanUSDC",
        rewardTokenAddr: "0x52A9CEA01c4CBDd669883e41758B8eB8e8E2B34b", 
        rewardDecimals: 6 
    }, 
};

// WAN 代币的通用配置
const STAKED_ASSET_SYMBOL = "WAN";
const STAKED_ASSET_CA = "0x0000000000000000000000000000000000000000";
const STAKED_ASSET_DECIMALS = 18;


const XWAN_FARMING_ABI = [
    // 假设 ABI 是统一的，查询质押金额和待领取奖励
    "function userInfo(address) view returns (uint256 amount, uint256 lastUpdateTime)",
    "function pendingReward(address _user, address _rewardToken) view returns (uint256)",
];


/**
 * 核心函数：查询 xWAN Farming 质押和奖励
 * @param {string} userAddr 
 * @returns {Promise<AssetData[]>}
 */
export async function getXWANFarmingAssets(userAddr) {
    const results = [];

    // 遍历所有 Farming Pool
    for (const poolKey in FARMING_POOLS) {
        const pool = FARMING_POOLS[poolKey];
        const mcAddr = pool.mcAddr;
        
        if (!ethers.isAddress(mcAddr)) continue;

        try {
            const mcContract = new Contract(mcAddr, XWAN_FARMING_ABI, PROVIDER);

            // 1. 查询用户在当前 Pool 中质押的金额 (Staked Token)
            const info = await mcContract.userInfo(userAddr);
            const stakedAmount = info.amount;
            
            if (stakedAmount > 0n) {
                // 质押资产记录 (统一为 WAN)
                results.push(createAssetData({
                    DappName: Dapp,  
                    asset: STAKED_ASSET_SYMBOL, // 统一使用 WAN
                    asset_ca: STAKED_ASSET_CA, 
                    amount: formatUnits(stakedAmount, STAKED_ASSET_DECIMALS), 
                    extra: { 
                        DappUrl: "https://xstake.wanchain.org/stakexwan",
                        type: `xWAN-Stake (Rewards: ${pool.rewardSymbol})`, // 强调这个池子奖励的是什么
                        protocolContract: mcAddr,
                        stakedAssetCA: STAKED_ASSET_CA,
                    } 
                }));
            }
            
            // 2. 查询待领取的奖励 (Pending Rewards)
            // 🚨 逻辑更新：使用配置中明确的奖励代币信息
            const { rewardSymbol, rewardTokenAddr, rewardDecimals } = pool;

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
                        type: `xWAN-Pending-Reward (Reward: ${rewardSymbol})`, // 包含池子和奖励代币
                        rewardCa: rewardTokenAddr
                    } 
                }));
            }

        } catch (e) {
            console.error(`[ERROR] xWAN Farming scan failed for ${poolKey} pool:`, e.message);
        }
    }
    
    return results;
}