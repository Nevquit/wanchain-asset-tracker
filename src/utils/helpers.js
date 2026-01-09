// utils/helpers.js
import { formatUnits as ethersFormatUnits } from "ethers";

/**
 * 格式化单位，并可选地截断小数位 (新增功能)
 * @param {import('ethers').BigNumberish} value - 原始 BigInt 值
 * @param {number} [decimals=18] - 代币精度
 * @param {number} [toFixed] - (可选) 要保留的小数位数
 * @returns {string} 格式化后的字符串
 */
export function formatUnits(value, decimals = 18, toFixed) {
  const formatted = ethersFormatUnits(value, decimals);

  if (toFixed !== undefined) {
    const parts = formatted.split(".");
    if (parts.length > 1) {
      return `${parts[0]}.${parts[1].substring(0, toFixed)}`;
    }
  }

  return formatted;
}
