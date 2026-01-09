// src/components/Sidebar.tsx
import React from 'react';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const protocols = ['Portfolio', 'Wallet', 'xStake', 'xFLows', 'Storeman', 'PoS Staking'];

  return (
    <aside className="w-64 p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Protocols</h2>
      <div className="flex flex-col space-y-2">
        {protocols.map((protocol) => (
          <Button key={protocol} variant="ghost" className="justify-start">
            {protocol}
          </Button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
