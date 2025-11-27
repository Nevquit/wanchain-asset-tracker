// api/asset-tracker.js

import { ethers } from 'ethers';
// 🚨 导入新的编排器，不再导入具体的 fetcher 函数和旧的 constants
import { fetchAllAssets } from '../services/orchestrator.js'; 


/**
 * Serverless API 主函数 (Vercel Handler)
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

    if (!ethers.isAddress(address)) {
        return res.status(400).json({ 
            error: "Invalid Wanchain address format.", 
            provided: address
        });
    }
    
    let allAssets = [];

    try {
        // 🚨 核心：一行代码运行所有协议，完全解耦
        allAssets = await fetchAllAssets(address);

        // 成功，返回 200 OK 和资产数据 (遵循 Vercel 推荐的格式)
        return res.status(200).json({ status: 200, assets: allAssets });

    } catch (err) {
        console.error("Overall Query Error:", err.message);
        // 内部错误，返回 500 Internal Server Error
        return res.status(500).json({ 
            status: 500,
            error: "An internal server error occurred during asset fetching.", 
            details: err.message
        });
    }
}