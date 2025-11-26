// utils/helpers.js (已修复为 ethers V6 兼容)

import { ethers } from 'ethers';

/**
 * 格式化数字 (BigInt 到可读字符串)
 * @param {bigint | string} value - 待格式化的 BigInt 或 BigNumber 字符串
 * @param {number} decimals - 小数位数 (默认 18)
 * @returns {string} 格式化并保留 4 位小数的字符串
 */
export function formatUnits(value, decimals = 18) {
    if (!value) return '0.0000'; // 返回 0 而不是 0.0000 
    
    try {
        // 1. 使用 ethers V6 语法进行格式化
        const formattedString = ethers.formatUnits(value, decimals);
        
        // 2. 将格式化后的字符串转换为数字，保留 4 位小数
        //    (注意：如果数字太大，使用 parseFloat 可能会失去精度，但通常够用)
        return parseFloat(formattedString).toFixed(4);

    } catch (e) {
        // console.error("FormatUnits 失败:", e); // 可以临时取消注释，查看具体错误
        return 'Error'; 
    }
}