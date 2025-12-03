## ✨ WANCHAIN-ASSET-TRACKER 项目结构与分析


### ⚛️ 结构 (React Framework)


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
