import { ethers } from 'ethers';

// Wanchain RPC 配置
export const RPC_URL = "https://gwan-ssl.wandevs.org:56891";
export const PROVIDER = new ethers.JsonRpcProvider(RPC_URL);
// 在 Vercel 部署时，请在环境变量中设置这些值
export const IWAN_CONFIG = {
    API_KEY: process.env.IWAN_API_KEY || 'YOUR_DEFAULT_API_KEY', 
    SECRET_KEY: process.env.IWAN_SECRET_KEY || 'YOUR_DEFAULT_SECRET_KEY',
    URL: process.env.IWAN_RPC_URL || "api.wanchain.org", // SDK 默认 RPC
    PORT: 8443,
};

// 合约地址配置
export const CONTRACTS = {
    // 钱包代币查询 (ERC20)
    "ERC20": {
        USDT: "0x11e77E27Af5539872efEd10abaA0b408cfd9fBBD",
        USDC: "0x52A9CEA01c4CBDd669883e41758B8eB8e8E2B34b", 
        ETH: "0xE3aE74D1518A76715aB4C7BeDF1af73893cd435A", 
        BTC: "0x50c439B6d602297252505a6799d84eA5928bCFb6",
    },
    // xWAN Farming 合约
    "xWAN_Farming": {
        xWAN_Farming_Contract: "0x3167219355f3532B8B37e24213118A0898AdcdFB"
    },
    //OSM 合约
    "Wanchain_Storeman": {
        Wanchain_Storeman_Contract: "0x1E7450D5d17338a348C5438546f0b4D0A5fbeaB6"
    }
    // **未来扩展点：新增合约，如 "New_Protocol": { ... }**
};

// 最小 ABI 定义
export const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

//xWAN_Farming
export const xWAN_Farming_ABI = [
    "function userInfo(address) view returns (uint256 amount, uint256 lastUpdateTime)",
    "function pendingReward(address _user, address _rewardToken) view returns (uint256)"
];

// xWAN_Farming 奖励代币配置 (地址和精度)
export const REWARD_TOKENS = {
    BTC: { addr: CONTRACTS.ERC20.BTC, decimals: 8 },      
    ETH: { addr: CONTRACTS.ERC20.ETH, decimals: 18 },     
    USDT: { addr: CONTRACTS.ERC20.USDT, decimals: 6 },    
    USDC: { addr: CONTRACTS.ERC20.USDC, decimals: 6 },    
};

/**
 * 资产数据结构定义
 * @typedef {{asset: string, type: string, amount: string, contract: string}} AssetData
 */