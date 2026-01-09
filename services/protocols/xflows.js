import { Contract, isAddress, ZeroAddress } from 'ethers';
import { getProvider } from '../../src/config/shared.js';
import { formatUnits } from '../../src/utils/helpers.js';
import { createAssetData } from '../../src/utils/assetModel.js';

const Dapp = "xFLows";
const DappUrl = "https://xflows.wanchain.org/"; // 假设的 DApp URL

// 🚨 协议配置：核心合约地址
const POSITION_MANAGER_ADDR = "0x73fe2A8aB6a56b11657ba31718C1febc96291076";
const FACTORY_ADDR = "0xEB3e557f6FdcaBa8dC98BDA833E017866Fc168cb"; // Factory 合约地址 (用于查找 Pool)

// --- 修正：新增 ERC20 ABI ---
// 🚨 通用 ABI：获取代币符号和精度所需的最小 ERC20 ABI 片段
const ERC20_ABI = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

// 🚨 协议 ABI：
const POSITION_MANAGER_ABI = [
    // 包含 feeGrowthInsideLastX128, tokensOwed0, tokensOwed1
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
];

const FACTORY_ABI = [
    "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)"
];

const POOL_ABI = [
    // V3 价格和 Tick
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    // V3 全局费用增长
    "function feeGrowthGlobal0X128() view returns (uint256)",
    "function feeGrowthGlobal1X128() view returns (uint256)",
    // V3 Tick 费用增长 (用于计算 Outside)
    "function ticks(int24) view returns (uint128 liquidityGross,int128 liquidityNet,uint256 feeGrowthOutside0X128,uint256 feeGrowthOutside1X128,int56 tickCumulativeOutside,uint160 secondsPerLiquidityOutsideX128,uint32 secondsOutside)",
];

// Q96 - 2**96，用于 V3 价格计算
const Q96 = 2n**96n; 
// Q128 - 2**128，用于 V3 费用计算
const Q128 = 2n**128n;

// 缓存代币信息和 Pool 地址以减少重复查询
const tokenCache = {};
const poolCache = {};

// --- V3 Calculation Helpers (Start) ---

/**
 * 将 Tick 转换为 Q96 格式的平方根价格
 */
function tickToSqrtPriceX96(tick) {
    const sqrtRatio = Math.pow(1.0001, tick / 2);
    return BigInt(Math.floor(sqrtRatio * Number(Q96)));
}

/**
 * 计算给定流动性在指定价格范围内锁定的 Token 0 和 Token 1 数量 (与 V3 逻辑保持一致)
 */
function getV3Amounts(liquidity, currentTick, tickLower, tickUpper, decimals0, decimals1) {
    // ... [保持原有的 getV3Amounts 逻辑，与费用计算无关] ...
    if (liquidity === 0n) {
        return { amount0: '0', amount1: '0' };
    }

    const activeTick = Math.max(tickLower, Math.min(currentTick, tickUpper));

    const sqrtRatioA = tickToSqrtPriceX96(tickLower); 
    const sqrtRatioB = tickToSqrtPriceX96(tickUpper); 
    const sqrtRatioC = tickToSqrtPriceX96(activeTick); 

    let amount0 = 0n;
    let amount1 = 0n;

    if (activeTick === tickUpper) {
        amount0 = liquidity * (sqrtRatioB - sqrtRatioA) * Q96 / (sqrtRatioA * sqrtRatioB);
        amount1 = 0n;
    } else if (activeTick === tickLower) {
        amount0 = 0n;
        amount1 = liquidity * (sqrtRatioC - sqrtRatioA) / Q96;
    } else {
        amount0 = liquidity * (sqrtRatioB - sqrtRatioC) * Q96 / (sqrtRatioC * sqrtRatioB);
        amount1 = liquidity * (sqrtRatioC - sqrtRatioA) / Q96;
    }
    
    return {
        amount0: formatUnits(amount0 < 0n ? -amount0 : amount0, decimals0),
        amount1: formatUnits(amount1 < 0n ? -amount1 : amount1, decimals1)
    };
}

/**
 * V3 核心逻辑：计算头寸内部的 feeGrowthInsideX128
 * @param {bigint | string} feeGrowthGlobalX128 Pool 的全局费用增长
 * @param {int} lowerTick 头寸下限 Tick
 * @param {int} upperTick 头寸上限 Tick
 * @param {int} currentTick 当前 Tick
 * @param {bigint | string} lowerOutsideX128 下限 Tick 的 feeGrowthOutside
 * @param {bigint | string} upperOutsideX128 上限 Tick 的 feeGrowthOutside
 * @returns {bigint} 当前头寸的 feeGrowthInsideX128
 */
function computeFeeGrowthInside(feeGrowthGlobalX128, lowerTick, upperTick, currentTick, lowerOutsideX128, upperOutsideX128) {
    
    const feeGrowthGlobal = BigInt(feeGrowthGlobalX128);
    const lowerOutside = BigInt(lowerOutsideX128);
    const upperOutside = BigInt(upperOutsideX128);

    if (currentTick < lowerTick) {
        // P < P_a: inside = lowerOutside - upperOutside
        return lowerOutside - upperOutside;
    } else if (currentTick >= upperTick) {
        // P >= P_b: inside = upperOutside - lowerOutside
        return upperOutside - lowerOutside;
    } else {
        // P_a <= P < P_b: inside = global - lowerOutside - upperOutside
        return feeGrowthGlobal - lowerOutside - upperOutside;
    }
}

/**
 * V3 核心逻辑：计算理论上待领取的总费用 (已记录 + 实时累积)
 * @param {object} params 计算所需的全部参数
 * @returns {bigint} 理论上待领取的原始 amount
 */
function computeTheoreticalPendingFees({
    tokenIndex, // 0 or 1
    liquidity,
    currentTick,
    tickLower,
    tickUpper,
    tokensOwed,
    feeGrowthInsideLastX128,
    feeGrowthGlobal0X128,
    feeGrowthGlobal1X128,
    tickLowerData,
    tickUpperData
}) {
    // 如果流动性为 0，则仅返回已记录的 tokensOwed
    if (liquidity === 0n) {
        return BigInt(tokensOwed);
    }
    
    const isToken0 = tokenIndex === 0;
    
    // 1. 准备计算数据
    const feeGrowthGlobalX128 = isToken0 ? feeGrowthGlobal0X128 : feeGrowthGlobal1X128;
    // tickData 中的 feeGrowthOutside 是一个 BigInt
    const lowerOutsideX128 = isToken0 ? tickLowerData.feeGrowthOutside0X128 : tickLowerData.feeGrowthOutside1X128;
    const upperOutsideX128 = isToken0 ? tickUpperData.feeGrowthOutside0X128 : tickUpperData.feeGrowthOutside1X128;
    
    // 2. 计算当前的 feeGrowthInside
    const feeGrowthInsideCurr = computeFeeGrowthInside(
        feeGrowthGlobalX128, 
        tickLower, 
        tickUpper, 
        currentTick, 
        lowerOutsideX128, 
        upperOutsideX128
    );
    
    // 3. 计算自上次收集以来的增长 delta (delta = insideCurr - insideLast)
    // 所有操作都使用 BigInt
    const delta = feeGrowthInsideCurr - BigInt(feeGrowthInsideLastX128);
    
    // 4. 计算 pendingFromDelta (pending = delta * liquidity / 2^128)
    const pendingFromDelta = (delta * BigInt(liquidity)) / Q128;

    // 5. 理论上的可领取 = 合约已记录 tokensOwed + pendingFromDelta
    const theoreticalAmount = BigInt(tokensOwed) + pendingFromDelta;

    // 确保结果非负
    return theoreticalAmount > 0n ? theoreticalAmount : 0n;
}

// --- V3 Calculation Helpers (End) ---


/**
 * 辅助函数：获取代币的符号和精度
 */
async function getTokenInfo(tokenAddr) {
    if (tokenCache[tokenAddr]) {
        return tokenCache[tokenAddr];
    }
    
    // WAN 主币特殊处理
    if (tokenAddr === '0x0000000000000000000000000000000000000000') {
        return { symbol: 'WAN', decimals: 18 };
    }

    try {
        // 使用新定义的 ERC20_ABI
        const provider = getProvider();
        const contract = new Contract(tokenAddr, ERC20_ABI, provider);
        const [symbol, decimals] = await Promise.all([
            contract.symbol(),
            contract.decimals()
        ]);
        tokenCache[tokenAddr] = { symbol, decimals: Number(decimals) };
        return tokenCache[tokenAddr];
    } catch (e) {
        // 捕获失败，返回 'UNKNOWN'
        console.error(`[ERROR] Failed to fetch token info for ${tokenAddr}:`, e.message);
        return { symbol: 'UNKNOWN', decimals: 18 };
    }
}


/**
 * 核心函数：查询 xFLows (类似 Uniswap V3) 的 LP 资产和待领取的费用
 */
export async function getXFLowsAssets(userAddr) {
    const results = [];
    
    if (!isAddress(userAddr)) {
        console.error("[ERROR] Invalid user address provided.");
        return results;
    }

    try {
        const provider = getProvider();
        const pmContract = new Contract(POSITION_MANAGER_ADDR, POSITION_MANAGER_ABI, provider);
        const factoryContract = new Contract(FACTORY_ADDR, FACTORY_ABI, provider);

        // 1. 查询用户持有的 V3 LP NFT 数量
        const balance = await pmContract.balanceOf(userAddr);
        const positionCount = Number(balance);

        if (positionCount === 0) {
            return results;
        }

        console.log(`[${Dapp}] Found ${positionCount} LP positions for user.`);

        // 2. 循环获取所有 NFT ID 并查询头寸详情
        for (let i = 0; i < positionCount; i++) {
            const tokenId = await pmContract.tokenOfOwnerByIndex(userAddr, i);
            const positionDetails = await pmContract.positions(tokenId);
            
            const [
                , , 
                token0_ca, 
                token1_ca, 
                fee, 
                tickLower, 
                tickUpper, 
                liquidity, 
                feeGrowthInside0LastX128, // 新增：上次记录的 feeGrowthInside
                feeGrowthInside1LastX128, // 新增：上次记录的 feeGrowthInside
                tokensOwed0,            // 已记录的费用
                tokensOwed1             // 已记录的费用
            ] = positionDetails;

            const liquidityAmount = liquidity.toString();
            
            // 如果流动性和已记录的费用都为 0，则跳过
            if (liquidity === 0n && tokensOwed0 === 0n && tokensOwed1 === 0n) {
                continue;
            }

            // 👈 重点：这里现在可以正常获取符号了
            const [info0, info1] = await Promise.all([
                getTokenInfo(token0_ca),
                getTokenInfo(token1_ca)
            ]);

            const poolName = `${info0.symbol}/${info1.symbol} V3 LP #${tokenId.toString()}`;
            const positionType = `V3 LP NFT`;

            const tickLowerNum = Number(tickLower);
            const tickUpperNum = Number(tickUpper);
            
            let currentTick = Math.floor((tickLowerNum + tickUpperNum) / 2); // 默认使用中点作为近似值
            let finalOwed0 = tokensOwed0;
            let finalOwed1 = tokensOwed1;


            // --- V3 费用和实时 Tick 计算：关键部分 ---
            try {
                // 1. 获取 Pool 地址
                const poolAddress = await factoryContract.getPool(token0_ca, token1_ca, Number(fee));
                
                if (poolAddress && poolAddress !== ZeroAddress) {
                    const poolContract = new Contract(poolAddress, POOL_ABI, provider);
                    
                    // 2. 批量获取 Pool 实时数据
                    const [
                        slot0, 
                        feeGrowthGlobal0X128, 
                        feeGrowthGlobal1X128,
                        tickLowerData,
                        tickUpperData
                    ] = await Promise.all([
                        poolContract.slot0(),
                        poolContract.feeGrowthGlobal0X128(),
                        poolContract.feeGrowthGlobal1X128(),
                        poolContract.ticks(tickLowerNum),
                        poolContract.ticks(tickUpperNum),
                    ]);
                    
                    currentTick = Number(slot0.tick); // 使用实时 Tick

                    // 3. 计算理论上的 Pending Rewards (已记录 + 实时累积)
                    finalOwed0 = computeTheoreticalPendingFees({
                        tokenIndex: 0,
                        liquidity: liquidity,
                        currentTick: currentTick,
                        tickLower: tickLowerNum,
                        tickUpper: tickUpperNum,
                        tokensOwed: tokensOwed0,
                        feeGrowthInsideLastX128: feeGrowthInside0LastX128,
                        feeGrowthGlobal0X128: feeGrowthGlobal0X128,
                        feeGrowthGlobal1X128: feeGrowthGlobal1X128,
                        tickLowerData: tickLowerData,
                        tickUpperData: tickUpperData
                    });

                    finalOwed1 = computeTheoreticalPendingFees({
                        tokenIndex: 1,
                        liquidity: liquidity,
                        currentTick: currentTick,
                        tickLower: tickLowerNum,
                        tickUpper: tickUpperNum,
                        tokensOwed: tokensOwed1,
                        feeGrowthInsideLastX128: feeGrowthInside1LastX128,
                        feeGrowthGlobal0X128: feeGrowthGlobal0X128,
                        feeGrowthGlobal1X128: feeGrowthGlobal1X128,
                        tickLowerData: tickLowerData,
                        tickUpperData: tickUpperData
                    });
                    console.log(`[${Dapp}] Successfully fetched real-time Tick: ${currentTick} and calculated theoretical fees for #${tokenId.toString()}.`);

                } else {
                    console.warn(`[${Dapp}] Pool not found for position #${tokenId.toString()}. Using recorded fees.`);
                }
            } catch (e) {
                // 4. 回退：如果实时调用失败，则回退到仅使用已记录的 fees (tokensOwed)
                console.warn(`[${Dapp}] Failed full fee calculation for #${tokenId.toString()}. Falling back to recorded fees. Error: ${e.message}`);
                // currentTick 保持为中点近似值 (用于流动性计算)
                // finalOwed0/1 保持为 tokensOwed0/1 
            }
            // --- V3 费用和实时 Tick 计算：结束 ---


            // 计算流动性锁定的 Token 数量 (使用实时或回退的 currentTick)
            const { amount0, amount1 } = getV3Amounts(
                liquidity,
                currentTick, 
                tickLowerNum,
                tickUpperNum,
                info0.decimals,
                info1.decimals
            );
            
            // --- 构造 Primary Assets 和 Reward Assets 结构 ---
            
            const primaryAssets = [
                { 
                    symbol: info0.symbol, 
                    amount: amount0, 
                    address: token0_ca 
                },
                { 
                    symbol: info1.symbol, 
                    amount: amount1,
                    address: token1_ca
                }
            ];

            const rewardAssets = [];
            if (finalOwed0 > 0n) { // 使用理论总额
                rewardAssets.push({
                    symbol: info0.symbol,
                    // 格式化后的理论总额
                    amount: formatUnits(finalOwed0, info0.decimals), 
                    address: token0_ca,
                    rawAmount: finalOwed0.toString()
                });
            }
            if (finalOwed1 > 0n) { // 使用理论总额
                rewardAssets.push({
                    symbol: info1.symbol,
                    // 格式化后的理论总额
                    amount: formatUnits(finalOwed1, info1.decimals),
                    address: token1_ca,
                    rawAmount: finalOwed1.toString()
                });
            }


            // --- 记录流动性头寸 (LP Position) ---
            results.push(createAssetData({
                DappName: Dapp,
                asset: poolName,
                asset_ca: POSITION_MANAGER_ADDR,
                amount: '1',
                extra: {
                    DappUrl: DappUrl, // <-- 保持 DappUrl
                    type: positionType,
                    protocolContract: POSITION_MANAGER_ADDR,
                    tokenId: tokenId.toString(),
                    
                    // 结构化的资产列表
                    primary_assets: primaryAssets, 
                    reward_assets: rewardAssets,   // 待领取的费用 (现在是理论总额)

                    // 原始 V3 数据
                    token0_ca: token0_ca,
                    token1_ca: token1_ca,
                    token0_decimals: info0.decimals,
                    token1_decimals: info1.decimals,
                    liquidity: liquidityAmount,
                    feeTier: Number(fee),
                    tickRange: `${tickLower} to ${tickUpper}`,
                    currentTickEstimate: currentTick, 
                    
                    // 原始/理论 fees
                    tokensOwed0_recorded: tokensOwed0.toString(),
                    tokensOwed1_recorded: tokensOwed1.toString(),
                    theoreticalOwed0_raw: finalOwed0.toString(),
                    theoreticalOwed1_raw: finalOwed1.toString(),
                    
                    // 🚨 关键修正：移除 DappPage 字段
                    // DappPage: DappUrl, 
                    assetType: 'V3_LP_POSITION'
                }
            }));
            
        } // End of position loop

    } catch (e) {
        console.error(`[ERROR] ${Dapp} scan failed (general):`, e.message);
    }
    
    return results;
}
