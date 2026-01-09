"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface AssetCardProps {
  icon: string;
  name: string;
  balance: string;
  price: string;
  value: string;
  address: string;
}

export function AssetCard({
  icon,
  name,
  balance,
  price,
  value,
  address,
}: AssetCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return; // Don't copy if address is not available
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon ? (
            <img
              src={icon}
              alt={`${name || "Token"} icon`}
              className="w-10 h-10 mr-4 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 mr-4 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400 text-xs">N/A</span>
            </div>
          )}
          <div>
            <p className="font-bold text-lg">{name || "Unknown Token"}</p>
            <p className="text-sm text-gray-400">{balance || "N/A"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{value || "$0.00"}</p>
          <p className="text-sm text-gray-400">{price || "N/A"}</p>
        </div>
      </div>
      <div className="mt-4 pt-2 border-t border-gray-700 flex items-center justify-between">
        <p className="text-xs text-gray-500 font-mono truncate mr-2">
          {address || "No address provided"}
        </p>
        <button
          onClick={handleCopy}
          disabled={!address}
          className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
