import { COINGECKO_TOKEN_MAP } from "../priceFetch/config.js";

/**
 * Formats a number into a USD currency string.
 * @param {number} value - The number to format.
 * @returns {string} - The formatted currency string.
 */
export function formatUSD(value) {
  if (isNaN(value) || value === null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a token amount, displaying a reasonable number of decimal places.
 * @param {string|number} amount - The amount to format.
 * @returns {string} - The formatted amount.
 */
export function formatAmount(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0.00";
  if (num > 1000)
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (num < 1)
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    });
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

/**
 * Shortens a blockchain address for display.
 * @param {string} address - The full address.
 * @returns {string} - The shortened address (e.g., 0x123...4567).
 */
export function formatAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Extracts a DApp URL from a list of assets.
 * @param {Array<Object>} assets - An array of assets.
 * @returns {string|null} - The DApp URL or null if not found.
 */
export function getDappUrl(assets) {
  const firstAssetWithUrl = assets.find((a) => a.extra && a.extra.DappUrl);
  return firstAssetWithUrl ? firstAssetWithUrl.extra.DappUrl : null;
}

/**
 * Renders a simple icon with the first letter of the asset symbol.
 * @param {string} symbol - The asset symbol.
 * @param {string} contractAddress - The asset's contract address.
 * @returns {string} - The HTML for the symbol icon.
 */
export function renderSymbolIcon(symbol, contractAddress) {
  const tokenInfo = COINGECKO_TOKEN_MAP[contractAddress.toLowerCase()];
  if (tokenInfo && tokenInfo.imageUrl) {
    return `<img src="${tokenInfo.imageUrl}" alt="${symbol}" class="asset-icon">`;
  }

  const initial = symbol ? symbol.charAt(0).toUpperCase() : "?";
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  const colorClass =
    colors[Math.abs(symbol.charCodeAt(0) - 65) % colors.length];
  return `<div class="asset-icon ${colorClass}">${initial}</div>`;
}

// Make copyToClipboard globally available
window.copyToClipboard = function (text, element) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalIcon = element.innerHTML;
      element.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => {
        element.innerHTML = originalIcon;
      }, 1000);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
};
