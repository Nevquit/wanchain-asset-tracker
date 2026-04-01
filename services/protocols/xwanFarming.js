import { Contract, isAddress } from 'ethers';
// 假设 getProvider, ERC20_ABI 在 shared.js 中
import { getProvider, ERC20_ABI } from '../../config/shared.js';
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
 * 将一个 Pool 的质押资产 (WAN) 和待领取奖励资产合并为一条 AssetData 记录。
 * * @param {string} userAddr 
 * @returns {Promise<AssetData[]>}
 */
export async function getXWANFarmingAssets(userAddr) {
    const results = [];
    const provider = getProvider();

    // 遍历所有 Farming Pool
    for (const poolKey in FARMING_POOLS) {
        const pool = FARMING_POOLS[poolKey];
        const mcAddr = pool.mcAddr;
        
        if (!isAddress(mcAddr)) continue;

        try {
            const mcContract = new Contract(mcAddr, XWAN_FARMING_ABI, provider);

            // 奖励代币信息
            const { rewardSymbol, rewardTokenAddr, rewardDecimals } = pool;

            // 1. 查询用户在当前 Pool 中质押的金额 (Staked Token)
            const info = await mcContract.userInfo(userAddr);
            const stakedAmount = info.amount;
            
            // 2. 查询待领取的奖励 (Pending Rewards)
            let pending = 0n;
            if (isAddress(rewardTokenAddr)) {
                pending = await mcContract.pendingReward(userAddr, rewardTokenAddr);
            }

            // 只有当有质押金额或待领奖金时才记录
            if (stakedAmount > 0n || pending > 0n) {
                // 创建单个合并的资产记录
                results.push(createAssetData({
                    DappName: Dapp,  
                    asset: STAKED_ASSET_SYMBOL, // 主资产为 WAN
                    asset_ca: STAKED_ASSET_CA, 
                    amount: formatUnits(stakedAmount, STAKED_ASSET_DECIMALS), // 格式化后的质押 WAN 数量
                    extra: { 
                        DappUrl: "https://xstake.wanchain.org/stakexwan",
                        // Type 字段现在标识为整个池子及其奖励
                        type: `xStake-xWAN-Farming`, 
                        protocolContract: mcAddr,
                        stakedAssetCA: STAKED_ASSET_CA,
                        // 将奖励资产信息嵌套在 extra 中
                        reward: {
                            asset: rewardSymbol, 
                            asset_ca: rewardTokenAddr,
                            amount: formatUnits(pending, rewardDecimals), // 格式化后的待领取奖励数量
                            rawAmount: pending.toString(),
                        },
                    } 
                }));
            }

        } catch (e) {
            console.error(`[ERROR] xWAN Farming scan failed for ${poolKey} pool:`, e.message);
        }
    }
    // console.log('[xStake-xWAN-Farming]results',results);
    return results;
}
