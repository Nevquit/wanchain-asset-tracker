"use client";

import { useState } from 'react';
import { ChevronDown, Network, Landmark, Repeat, Briefcase } from 'lucide-react';

const protocols = [
  { name: 'Wallet', icon: Briefcase },
  { name: 'XFlows', icon: Repeat },
  { name: 'PoS', icon: Network },
  { name: 'Storeman', icon: Landmark },
];

export function Sidebar() {
  const [activeProtocol, setActiveProtocol] = useState('Wallet');

  return (
    <aside className="w-64 bg-gray-800 p-4 rounded-lg">
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
                className={`w-full flex items-center justify-between p-2 rounded-md text-left ${
                  activeProtocol === protocol.name
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-700'
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
      <div className="mt-auto pt-4 border-t border-gray-700">
         <p className="text-xs text-center text-gray-500">
           Donate: 0x59F35bAAE8AD7E9991aC2F6a8ae53468726B28E2
        </p>
      </div>
    </aside>
  );
}
