"use client";

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface AssetCardProps {
  icon: string;
  name: string;
  balance: string;
  price: string;
  value: string;
  address: string;
}

export function AssetCard({ icon, name, balance, price, value, address }: AssetCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img src={icon} alt={`${name} icon`} className="w-10 h-10 mr-4 rounded-full" />
          <div>
            <p className="font-bold text-lg">{name}</p>
            <p className="text-sm text-gray-400">{balance}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{value}</p>
          <p className="text-sm text-gray-400">{price}</p>
        </div>
      </div>
      <div className="mt-4 pt-2 border-t border-gray-700 flex items-center justify-between">
        <p className="text-xs text-gray-500 font-mono truncate mr-2">{address}</p>
        <button onClick={handleCopy} className="text-gray-400 hover:text-white">
          {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
