"use client";

import { useState } from "react";
import {
  Network,
  Landmark,
  Repeat,
  Briefcase,
  Copy,
  Check,
} from "lucide-react";

const protocols = [
  { name: "Wallet", icon: Briefcase },
  { name: "XFlows", icon: Repeat },
  { name: "PoS", icon: Network },
  { name: "Storeman", icon: Landmark },
];

export function Sidebar() {
  const [activeProtocol, setActiveProtocol] = useState("Wallet");
  const [isCopied, setIsCopied] = useState(false);
  const donateAddress = "0x59F35bAAE8AD7E9991aC2F6a8ae53468726B28E2";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(donateAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <aside className="w-64 bg-gray-800 p-4 rounded-lg flex flex-col">
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Wanchain</h2>
          <p className="text-sm text-gray-400">Asset Tracker</p>
        </div>
        <nav>
          <ul>
            {protocols.map((protocol) => (
              <li key={protocol.name} className="mb-2">
                <button
                  onClick={() => setActiveProtocol(protocol.name)}
                  className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
                    activeProtocol === protocol.name
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center">
                    <protocol.icon className="w-5 h-5 mr-3" />
                    <span>{protocol.name}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-2">Donate:</p>
        <div className="flex items-center justify-between bg-gray-900 rounded-md p-2">
          <p className="text-xs text-gray-300 font-mono truncate mr-2">
            {donateAddress}
          </p>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
