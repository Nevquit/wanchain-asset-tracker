// api/asset-tracker.js - Modified to handle partial failure gracefully

import { ethers } from "ethers";
import { fetchAllAssets } from "../services/orchestrator.js";

/**
 * Serverless API 主函数 (Vercel Handler)
 */
export default async function (req, res) {
  // 设置 CORS 头部
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  // 1. 获取用户地址 (从 Query 参数中获取)
  const address = req.query.address;

  // 2. 验证
  if (!address) {
    return res.status(400).json({
      error: "Missing address query parameter.",
    });
  }

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      error: "Invalid Wanchain address format.",
      provided: address,
    });
  }

  // 🚨 变量不再需要预设为 []，因为 orchestrator 现在返回一个对象
  let results = {};

  try {
    // 🚨 核心：获取包含 assets 和 failedProtocols 的对象
    // results 结构：{ assets: [...], failedProtocols: [...] }
    results = await fetchAllAssets(address);

    // 成功，返回 200 OK 状态。即使部分协议失败，只要 orchestrator 没抛出异常，
    // 我们都认为这次 API 调用是成功的（status: 200）。

    return res.status(200).json({
      status: 200,
      assets: results.assets, // 成功获取的资产
      failed_protocols: results.failedProtocols, // 失败的协议列表
    });
  } catch (err) {
    console.error("Overall Query Error:", err.message);
    // 只有当 orchestrator 本身抛出异常 (如数据库连接失败，或 Promise.allSettled 之前代码失败)
    // 才返回 500 Internal Server Error。
    return res.status(500).json({
      status: 500,
      error: "An internal server error occurred during asset fetching.",
      details: err.message,
    });
  }
}
