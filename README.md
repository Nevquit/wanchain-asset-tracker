WANCHAIN 资产追踪器 (WANCHAIN-ASSET-TRACKER)

本项目是一个资产追踪器应用，旨在通过一个统一接口查询用户在 Wanchain 生态中，包括钱包余额和各种 DeFi 协议中的资产。

项目结构概览

WANCHAIN-ASSET-TRACKER/
├── api/                             # 【后端服务入口】Vercel Serverless Function 的部署入口
│   └── asset-tracker.js             #    - 主要 API 入口：接收前端请求，调度 services/ 中的核心逻辑。
├── config/                          # 【共享配置】存放项目共享的配置信息
│   └── shared.js                    #    - 跨后端和前端的通用配置（如 RPC Provider 地址）。
├── public/                          # 【前端静态资源】Web 服务器根目录
│   ├── images/                      #    - 存放图片资源（如 favicon.png）。
│   ├── js/                          #    - 存放前端特定的 JavaScript 模块。
│   │   ├── render/                  #       - 资产渲染逻辑子模块。
│   │   │   ├── DefaultRenderer.js   #          - 默认渲染器：用于通用表格展示。
│   │   │   └── index.js             #          - 渲染器分发器：根据 DApp 名称选择渲染函数。
│   │   ├── config.js                #       - 前端界面配置或运行时配置,目前主要配置了价格获取的配置数据。
│   │   ├── priceFetcher.js          #       - 负责获取资产的实时价格数据。
│   │   └── render.js                #       - 主要的渲染调度模块。
│   ├── index.html                   #    - 应用程序的入口 HTML 文件。
│   ├── main.js                      #    - 前端主逻辑入口，处理用户交互和 API 调用。
│   └── style.css                    #    - 应用程序的样式表。
├── services/                        # 【核心业务逻辑】存放核心后端业务逻辑，被 api/ 调用
│   ├── protocols/                   #    - 包含针对每个具体 DApp 协议的资产查询逻辑。
│   │   ├── pos.js                   #       - Wanchain PoS 委托/质押资产查询。
│   │   ├── storeman.js              #       - Storeman 锁仓资产查询逻辑。
│   │   ├── wallet.js                #       - 标准 ERC20/原生代币余额查询逻辑。
│   │   ├── xflows.js                #       - xFLows (Uniswap V3) 流动性头寸和费用查询。
│   │   ├── xwanFarming.js           #       - xWAN 农场质押和奖励资产查询。
│   │── orchestrator.js          #       - 服务编排器：协调并并行调用所有协议扫描函数。
│   └── test/                        #    - 服务层的测试文件夹。
│       └── test-iwan.js             #       - iWAN SDK 接口的测试或示例文件。
├── utils/                           # 【工具函数】存放可重用的工具函数和数据模型定义
│   ├── assetModel.js                #    - 定义资产数据 (AssetData) 的标准结构。
│   └── helpers.js                   #    - 通用辅助函数，如单位格式化 (formatUnits)。
├── .env                             # 环境变量配置文件（本地开发使用）。
├── .gitignore                       # Git 忽略文件。
├── .vercel                           # Vercel 部署和配置相关文件。
└── (其他文件，如 package.json, README.md, node_modules 等)


关键工作流 (Key Workflow)

用户操作：用户在 public/index.html 界面输入地址并点击查询。

前端调用：public/main.js 调用 Vercel Serverless Function 入口 /api/asset-tracker.js。

后端调度：/api/asset-tracker.js 导入并调用 services/protocols/orchestrator.js。

协议扫描：orchestrator.js 调用所有协议文件（如 pos.js, xflows.js）来获取数据。

数据返回：聚合后的数据返回给前端。

价格获取：public/js/priceFetcher.js 确保资产价格可用。

前端渲染：public/main.js 使用 public/js/render/index.js 中定义的渲染器将数据显示在界面上。