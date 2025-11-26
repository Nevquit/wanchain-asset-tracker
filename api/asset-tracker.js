import { ethers } from 'ethers';
import { PROVIDER, CONTRACTS } from '../config/constants.js';
import { formatUnits } from '../utils/helpers.js';
import { 
    fetchTokenBalance, 
    fetchxWANFarming, 
    fetchIWANStatus 
} from '../services/asset-fetchers.js';


/**
 * Serverless API 主函数 (Vercel Handler)
 * 接收 HTTP 请求 (req) 并返回 JSON 响应 (res)。
 */
export default async function (req, res) {
    // 设置 CORS 头部
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    // 1. 获取用户地址 (从 Query 参数中获取)
    const address = req.query.address; 

    // 2. 验证
    if (!address) {
        return res.status(400).json({ 
            error: "Missing address query parameter."
        });
    }

    if (!ethers.utils.isAddress(address)) {
        return res.status(400).json({ 
            error: "Invalid Wanchain address format.", 
            provided: address
        });
    }

    let allAssets = [];

    try {
        // A. 查询原生 WAN 余额
        const wanBalance = await PROVIDER.getBalance(address);
        allAssets.push({
            asset: "WAN (Native)", 
            type: "钱包余额", 
            amount: formatUnits(wanBalance), 
            contract: "Native"
        });

        // B. 循环查询 ERC20 代币余额 (并行执行)
        const tokenQueries = Object.keys(CONTRACTS.ERC20).map(symbol => 
            fetchTokenBalance(symbol, CONTRACTS.ERC20[symbol], address)
        );
        const tokenResults = await Promise.all(tokenQueries);
        tokenResults.filter(Boolean).forEach(asset => allAssets.push(asset));
        
        // C. 查询 xWAN Farming 质押和奖励
        const farmingResults = await fetchxWANFarming(address); // 不再需要传入地址，fetcher 内部处理
        allAssets.push(...farmingResults);

        // D. 查询 iWAN/Storeman 状态
        const iwanResults = await fetchIWANStatus(address);
        allAssets.push(...iwanResults);


        // 成功，返回 200 OK 和资产数据
        return res.status(200).json(allAssets);

    } catch (err) {
        console.error("Overall Query Error:", err.message);
        // 内部错误，返回 500 Internal Server Error
        return res.status(500).json({ 
            error: "An internal server error occurred during asset fetching.", 
            details: err.message
        });
    }
}