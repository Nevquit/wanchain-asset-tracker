// services/protocols/wallet.js

import { Contract } from "ethers";
import { getProvider, ERC20_ABI } from "../../src/config/shared.js";
import { formatUnits } from "../../src/utils/helpers.js";
import { createAssetData } from "../../src/utils/assetModel.js";

const Dapp = "Wallet";
const WANSCAN_URL_BASE = "https://www.wanscan.org/address/";
// 🚨 协议自治配置：Wallet 协议关注的 ERC20 列表
const WALLET_TOKENS = {
  USDT: "0x11e77E27Af5539872efEd10abaA0b408cfd9fBBD",
  USDC: "0x52A9CEA01c4CBDd669883e41758B8eB8e8E2B34b",
  ETH: "0xE3aE74D1518A76715aB4C7BeDF1af73893cd435A",
  BTC: "0x50c439B6d602297252505a6799d84eA5928bCFb6",
  XWAN: "0x2eA407Aa69be7367BF231E76B51fab9eC436766c",
};

/**
 * 核心函数：获取钱包内所有资产 (原生 WAN + ERC20)
 */
export async function getWalletAssets(address) {
  let walletAssets = [];
  const wanscanUrl = `${WANSCAN_URL_BASE}${address}`;
  const provider = getProvider();
  // 1. 查询原生 WAN 余额
  try {
    const wanBalance = await provider.getBalance(address);
    if (wanBalance > 0n) {
      walletAssets.push(
        createAssetData({
          DappName: Dapp,
          asset: "WAN",
          asset_ca: "0x0000000000000000000000000000000000000000",
          amount: formatUnits(wanBalance),
          extra: {
            // 🚨 将 type 和 contract 封装到 extra 对象中
            DappUrl: wanscanUrl,
            type: "NativeCoin",
            protocolContract: "",
          },
        }),
      );
    }
  } catch (e) {
    console.error("Failed to fetch native WAN balance:", e.message);
  }

  // 2. 循环查询 ERC20 代币余额 (并行执行)
  const tokenQueries = Object.keys(WALLET_TOKENS).map((symbol) =>
    fetchTokenBalance(symbol, WALLET_TOKENS[symbol], address),
  );
  const tokenResults = await Promise.all(tokenQueries);
  tokenResults.filter(Boolean).forEach((asset) => walletAssets.push(asset));

  return walletAssets;
}

/**
 * 辅助函数：查询单个 ERC20 代币余额
 */
async function fetchTokenBalance(symbol, contractAddr, userAddr) {
  try {
    const provider = getProvider();
    // 使用 Contract 类创建合约实例
    const contract = new Contract(contractAddr, ERC20_ABI, provider);
    const bal = await contract.balanceOf(userAddr);
    const wanscanUrl = `${WANSCAN_URL_BASE}${userAddr}#tokenBalance`;
    if (bal > 0n) {
      const decimals = await contract.decimals();
      // 尝试获取符号，如果失败则使用配置中的符号
      const tokenSymbol = await contract.symbol().catch(() => symbol);

      return createAssetData({
        DappName: Dapp,
        asset: tokenSymbol,
        asset_ca: contractAddr,
        amount: formatUnits(bal, decimals),
        extra: {
          // 🚨 将 type 和 contract 封装到 extra 对象中
          DappUrl: wanscanUrl,
          type: "ERC20",
          protocolContract: contractAddr,
        },
      });
    }
    return null;
  } catch (e) {
    console.warn(`[WARN] Failed to fetch ${symbol} balance: ${e.message}`);
    return null;
  }
}
