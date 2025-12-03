## ✨ WANCHAIN-ASSET-TRACKER 项目结构与分析

本项目是一个资产追踪器，最初采用纯 JavaScript/Serverless 架构，后重构为基于 React 的结构。

### 原始项目结构 (纯 JS / Serverless)

这是项目当前的文件组织，它使用了 Vercel Serverless Functions (`api`) 和客户端原生 JS (`public/js`)：

```
WANCHAIN-ASSET-TRACKER
├── .vercel
├── api
│   └── asset-tracker.js      <- Serverless API 入口，处理后端逻辑
├── config
│   └── shared.js             <- 后端配置，可能包含前后端共享的常量
├── node_modules
├── public                    <- 静态资源目录
│   ├── images
│   ├── favicon.png
│   ├── logo.svg
│   └── js                    <- 客户端 JavaScript 逻辑
│       ├── priceFetch         <- 价格数据获取模块
│       ├── render             <- UI 渲染器模块 (WalletRenderer, xFlowsRenderer 等)
│       └── render.js          <- 渲染协调入口
├── index.html                <- 客户端入口文件
├── main.js                   <- 客户端主逻辑入口
├── services                  <- 核心业务逻辑（与 Wanchain 协议交互）
│   └── protocols
│       ├── pos.js             <- Proof-of-Stake 协议交互
│       ├── storeman.js        <- Storeman 跨链协议交互
│       ├── wallet.js          <- 钱包余额/交易查询
│       ├── xflows.js          <- 跨链 Flows 逻辑
│       ├── xStake-xWANFarming.js <- 专用质押/挖矿逻辑
│       └── orchestrator.js    <- 协议服务调度器
├── test
│   └── test-iwan.js          <- iWAN 相关的测试文件
├── utils
│   ├── assetModel.js
│   └── helpers.js
├── .env                      <- 环境变量（用于存储敏感信息）
└── package.json
```

-----

### ⚛️ 重构目标结构 (React Framework)

为了提高可维护性和模块化，我们将项目重构为标准的 React 单页应用 (SPA) 结构。

  * **目标**: 分离关注点，使用组件 (`components`) 和自定义 Hooks (`hooks`) 管理 UI 和状态。
  * **部署**: 此结构依然完全兼容 **Vercel** 部署。

<!-- end list -->

```
WANCHAIN-ASSET-TRACKER
├── .vercel
├── api
│   └── asset-tracker.js      <- 后端 Serverless API（保持不变）
├── node_modules
├── public                    <- 静态资源（保持不变）
│   └── index.html            <- React 应用的挂载点
├── src                       <- 核心源码目录
│   ├── components            <- 纯 React UI 组件（替代 Renderer）
│   │   ├── WalletCard.jsx     <- 钱包视图
│   │   ├── XFlowsTable.jsx    <- 跨链视图
│   │   └── AssetRow.jsx       <- 基础资产展示
│   ├── hooks                 <- 自定义 Hooks（封装数据和状态逻辑）
│   │   ├── useAssetPrices.js  <- 封装价格获取逻辑
│   │   └── useProtocolData.js <- 封装协议服务调用逻辑
│   ├── services              <- 业务逻辑抽象层
│   │   └── protocols          <- 与 Wanchain 协议交互的纯 JS 模块（保持不变）
│   ├── utils                 <- 辅助工具和配置
│   │   └── config
│   │       └── shared.js      <- 共享配置
│   ├── pages                 <- 顶级路由视图
│   │   └── Dashboard.jsx      <- 资产追踪器主页面
│   ├── App.jsx               <- 主应用组件（路由配置）
│   └── index.js              <- React 启动入口
└── package.json
```

### 关键职能概述

| 目录/文件 | 原始职能 | React 职能 |
| :--- | :--- | :--- |
| **`api/asset-tracker.js`** | 资产数据聚合的 API 端点。 | 保持不变，作为 Serverless 后端。 |
| **`services/protocols/`** | 封装 Wanchain 区块链交互逻辑。 | 保持不变，作为被 Hooks 调用的**数据服务层**。 |
| **`public/js/render/`** | 客户端 UI 渲染逻辑。 | 转换为 **`src/components/`**，仅负责 UI 展示。 |
| **`public/js/priceFetch/`** | 客户端价格获取逻辑。 | 转换为 **`src/hooks/useAssetPrices.js`**，负责获取和管理价格状态。 |
| **`main.js`** | JS 入口。 | 转换为 **`src/index.js`**。 |

您可以直接将上述 Markdown 内容粘贴到您的 `README.md` 文件中。