// services/protocols/wallet.js

import { Contract } from 'ethers';
import { PROVIDER, ERC20_ABI } from '../../config/shared.js';
import { PROTOCOL_CONFIGS } from '../../config/protocols.js';
import { formatUnits } from '../../utils/helpers.js';
import { createAssetData } from '../../utils/assetModel.js';
import { logger } from '../../utils/logger.js'; // 🚨 导入结构化日志记录器

// 从中心化配置中获取本协议的配置
const config = PROTOCOL_CONFIGS.wallet;
const { Dapp, WANSCAN_URL_BASE, tokens: WALLET_TOKENS } = config;

/**
 * 核心函数：获取钱包内所有资产 (原生 WAN + ERC20)
 */
export async function getWalletAssets(address) {
    let walletAssets = [];
    const wanscanUrl = `${WANSCAN_URL_BASE}${address}`;

    // 1. 查询原生 WAN 余额
    try {
        const wanBalance = await PROVIDER.getBalance(address);
        if (wanBalance > 0n) {
            walletAssets.push(
                createAssetData({
                    DappName: Dapp,
                    asset: "WAN",
                    asset_ca: "0x0000000000000000000000000000000000000000",
                    amount: formatUnits(wanBalance),
                    extra: {
                        DappUrl: wanscanUrl,
                        type: "NativeCoin",
                        protocolContract: "",
                    }
                })
            );
        }
    } catch(e) {
        logger.error("Failed to fetch native WAN balance", { error: e.message, address });
    }

    // 2. 循环查询 ERC20 代币余额 (并行执行)
    const tokenQueries = Object.keys(WALLET_TOKENS).map(symbol =>
        fetchTokenBalance(symbol, WALLET_TOKENS[symbol], address)
    );
    const tokenResults = await Promise.all(tokenQueries);
    tokenResults.filter(Boolean).forEach(asset => walletAssets.push(asset));

    return walletAssets;
}

/**
 * 辅助函数：查询单个 ERC20 代币余额
 */
async function fetchTokenBalance(symbol, contractAddr, userAddr) {
    try {
        const contract = new Contract(contractAddr, ERC20_ABI, PROVIDER);
        const bal = await contract.balanceOf(userAddr);
        const wanscanUrl = `${WANSCAN_URL_BASE}${userAddr}#tokenBalance`;

        if (bal > 0n) {
            const decimals = await contract.decimals();
            const tokenSymbol = await contract.symbol().catch(() => symbol);

            return createAssetData({
                DappName: Dapp,
                asset: tokenSymbol,
                asset_ca: contractAddr,
                amount: formatUnits(bal, decimals),
                extra: {
                    DappUrl: wanscanUrl,
                    type: "ERC20",
                    protocolContract: contractAddr
                }
            });
        }
        return null;
    } catch (e) {
        logger.warn(`Failed to fetch ${symbol} balance`, { error: e.message, contractAddr, userAddr });
        return null;
    }
}