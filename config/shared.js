// config/shared.js
import { JsonRpcProvider } from 'ethers';

// Wanchain RPC 配置
const WANCHAIN_RPC_URL = process.env.WANCHAIN_RPC_URL || 'https://gwan-ssl.wandevs.org:56891';
export const PROVIDER = new JsonRpcProvider(WANCHAIN_RPC_URL);

// 通用 ERC20 ABI (所有协议都需要)
export const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

// iWAN SDK 配置 (作为通用配置，因为它可能被多个协议依赖)
export const IWAN_CONFIG = {
    API_KEY: process.env.IWAN_API_KEY || 'YOUR_DEFAULT_API_KEY', 
    SECRET_KEY: process.env.IWAN_SECRET_KEY || 'YOUR_DEFAULT_SECRET_KEY',
    URL: process.env.IWAN_RPC_URL || "api.wanchain.org",
    PORT: 8443,
};

/**
 * 资产数据结构定义 (保留在共享层)
 * @typedef {{asset: string, type: string, amount: string, contract: string}} AssetData
 */