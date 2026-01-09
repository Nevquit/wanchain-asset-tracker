// test/test-iwan.js

// 注意：导入路径已更新，使用 ../ 来访问上一级目录的模块
import { getStoremanAssets } from "../services/protocols/storeman.js";
import { IWAN_CONFIG } from "../src/config/shared.js";

// --- 配置信息 ---
// 使用一个已知的 Wanchain 地址进行测试
const TEST_ADDRESS = "0x0aebb4E377bda28FCF2Ee19dBe47E721D79A10c6";
// 替换成您自己的测试地址

// --- 主测试函数 ---
async function runTest() {
  console.log(`\n--- 🚀 正在测试 getStoremanAssets ---`);
  console.log(`   目标地址: ${TEST_ADDRESS}`);
  console.log(
    `   IWAN API Key: ${IWAN_CONFIG.API_KEY.startsWith("YOUR") ? "未配置 (使用默认值)" : "已配置"}`,
  );

  if (IWAN_CONFIG.API_KEY.startsWith("YOUR")) {
    console.warn(
      "\n⚠️ 警告: 正在使用默认 API 密钥/URL。如果您未在 .env 中设置实际密钥，测试可能失败。",
    );
  }

  try {
    // 调用 services 中的函数
    const results = await getStoremanAssets(TEST_ADDRESS);

    console.log("\n✅ 测试成功 - 函数返回的 AssetData 结构数据:");
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error("\n❌ 测试失败 - 致命错误:", e.message);
  }
  console.log("\n----------------------------------------\n");
}

runTest();
