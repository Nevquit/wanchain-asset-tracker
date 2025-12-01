import { ethers, Contract } from 'ethers';
// 导入路径已根据根目录下的 config/ 和 utils/ 结构修正
import { PROVIDER } from '../../config/shared.js'; 
import { formatUnits } from '../../utils/helpers.js'; 
import { createAssetData } from '../../utils/assetModel.js'; 

const Dapp = "xFLows";
// 🚨 假设的 DApp URL
const DappUrl = "https://xflows.wanchain.org/"; 

// 🚨 协议配置：NonfungibleTokenPositionManager 合约地址
// 这是 Uniswap V3 协议中用于管理 LP NFT 头寸的关键合约。
// (注意：实际地址需要根据 Wanchain 上的 xFLows 部署地址填写，此处使用一个示例地址)
const POSITION_MANAGER_ADDR = "0x73fe2A8aB6a56b11657ba31718C1febc96291076";

// 🚨 协议 ABI：只需要查询用户持有的 NFT ID 和通过 ID 查询头寸信息。
const POSITION_MANAGER_ABI = [
    // function balanceOf(address owner) view returns (uint256)
    "function balanceOf(address owner) view returns (uint256)",
    // function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    // function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)
    "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
];

// 🚨 ERC20 ABI：用于获取代币信息 (名称、符号、精度)
const ERC20_ABI = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
];

// 缓存代币信息以减少重复查询
const tokenCache = {};

/**
 * 辅助函数：获取代币的符号和精度
 * @param {string} tokenAddr 代币合约地址
 * @returns {Promise<{symbol: string, decimals: number}>}
 */
async function getTokenInfo(tokenAddr) {
    // 检查缓存
    if (tokenCache[tokenAddr]) {
        return tokenCache[tokenAddr];
    }
    
    // WAN 主币特殊处理 (假设地址为 0x0...0)
    if (tokenAddr === '0x0000000000000000000000000000000000000000') {
        return { symbol: 'WAN', decimals: 18 };
    }

    try {
        const contract = new Contract(tokenAddr, ERC20_ABI, PROVIDER);
        // 并行查询符号和精度
        const [symbol, decimals] = await Promise.all([
            contract.symbol(),
            contract.decimals()
        ]);
        const info = { symbol, decimals: Number(decimals) };
        tokenCache[tokenAddr] = info;
        return info;
    } catch (e) {
        console.error(`[ERROR] Failed to fetch token info for ${tokenAddr}:`, e.message);
        // 失败时返回默认值，避免程序崩溃
        return { symbol: 'UNKNOWN', decimals: 18 };
    }
}

/**
 * 核心函数：查询 xFLows (类似 Uniswap V3) 的 LP 资产和待领取的费用
 * @param {string} userAddr 用户地址
 * @returns {Promise<AssetData[]>}
 */
export async function getXFLowsAssets(userAddr) {
    const results = [];
    
    // 检查地址有效性
    if (!ethers.isAddress(userAddr)) {
        console.error(`[${Dapp} ERROR] Invalid user address provided: ${userAddr}`);
        return results;
    }

    try {
        const pmContract = new Contract(POSITION_MANAGER_ADDR, POSITION_MANAGER_ABI, PROVIDER);

        // 1. 查询用户持有的 V3 LP NFT 数量
        const balance = await pmContract.balanceOf(userAddr);
        const positionCount = Number(balance);

        if (positionCount === 0) {
            return results;
        }

        console.log(`[${Dapp}] Found ${positionCount} LP positions for user.`);

        // 2. 循环获取所有 NFT ID 并查询头寸详情
        for (let i = 0; i < positionCount; i++) {
            // 获取 NFT ID
            const tokenId = await pmContract.tokenOfOwnerByIndex(userAddr, i);
            
            // 查询头寸详情 (使用 positions 函数)
            const positionDetails = await pmContract.positions(tokenId);
            
            // 解构返回的元组 (tuple)
            const [
                , // nonce
                , // operator
                token0_ca, // token0 合约地址
                token1_ca, // token1 合约地址
                fee, // 费率 (e.g., 500 for 0.05%)
                tickLower, 
                tickUpper, 
                liquidity, // 流动性值 (uint128)
                , // feeGrowthInside0LastX128
                , // feeGrowthInside1LastX128
                tokensOwed0, // 待领取 Token0 费用
                tokensOwed1 // 待领取 Token1 费用
            ] = positionDetails;

            const liquidityAmount = liquidity.toString();
            
            // 如果流动性和待领取费用都为 0，则跳过
            if (liquidityAmount === '0' && tokensOwed0.toString() === '0' && tokensOwed1.toString() === '0') {
                continue;
            }

            // 批量获取代币信息
            const [info0, info1] = await Promise.all([
                getTokenInfo(token0_ca),
                getTokenInfo(token1_ca)
            ]);

            const feeTierPercentage = Number(fee) / 10000; // 例如，500 -> 0.05%
            const poolName = `${info0.symbol}-${info1.symbol} (${feeTierPercentage}%)`;
            const dappPageUrl = `${DappUrl}position/${tokenId.toString()}`; // 假设 xFLows 有单独的头寸页面

            // --- A. 记录底层 LP 代币 (Token0 和 Token1) --- 
            /*
            // 🚨 根据用户要求，移除 NFT 记录。如果需要记录 LP 头寸中的底层代币（Token0 和 Token1）数量，
            // 必须查询 xFLows Pool 合约的当前价格/Tick，并进行复杂的 V3 Liquidity Math 计算。
            // 此处保持移除状态，只追踪待领取费用。
            */

            // --- B. 记录待领取的费用 (Tokens Owed) ---
            
            // Token 0 待领取费用
            if (tokensOwed0 > 0n) {
                results.push(createAssetData({
                    DappName: Dapp,
                    asset: info0.symbol,
                    asset_ca: token0_ca,
                    amount: formatUnits(tokensOwed0, info0.decimals),
                    extra: {
                        DappUrl: DappUrl,
                        type: `Fee: ${poolName}`, // 细化类型，包含池子名称
                        protocolContract: POSITION_MANAGER_ADDR,
                        parentPool: poolName,
                        DappPage: dappPageUrl,
                        assetType: 'V3_FEE_REWARD'
                    }
                }));
            }
            
            // Token 1 待领取费用
            if (tokensOwed1 > 0n) {
                results.push(createAssetData({
                    DappName: Dapp,
                    asset: info1.symbol,
                    asset_ca: token1_ca,
                    amount: formatUnits(tokensOwed1, info1.decimals),
                    extra: {
                        DappUrl: DappUrl,
                        type: `Fee: ${poolName}`, // 细化类型，包含池子名称
                        protocolContract: POSITION_MANAGER_ADDR,
                        parentPool: poolName,
                        DappPage: dappPageUrl,
                        assetType: 'V3_FEE_REWARD'
                    }
                }));
            }
        }

    } catch (e) {
        console.error(`[ERROR] ${Dapp} scan failed:`, e.message);
        // 返回 null 表示该协议查询失败，以便 Orchestrator 处理
        return null; 
    }
    
    return results;
}