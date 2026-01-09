// components/sidebar.tsx
import React from 'react';

const Sidebar = () => {
  const protocols = ["Portfolio", "Wallet", "xStake", "xFlows", "Storeman", "PoS Staking"];

  return (
    <aside className="w-64 p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Protocols</h2>
      <nav>
        <ul>
          {protocols.map((protocol) => (
            <li key={protocol} className="mb-2">
              <a href="#" className="text-gray-700 hover:text-black">{protocol}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
