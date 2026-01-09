import { Sidebar } from '@/components/Sidebar';
import { AssetCard } from '@/components/AssetCard';
import { Search, ExternalLink } from 'lucide-react';

const mockAssetGroups = [
  {
    protocol: 'Wallet',
    totalValue: '$12,345.67',
    link: 'https://wanscan.org/',
    assets: [
      {
        icon: 'https://wanscan.org/images/icons/wan.png',
        name: 'WAN',
        balance: '10,000 WAN',
        price: '$0.35',
        value: '$3,500.00',
        address: '0x1234...5678',
      },
      {
        icon: 'https://wanscan.org/images/icons/usdt.png',
        name: 'USDT',
        balance: '5,000 USDT',
        price: '$1.00',
        value: '$5,000.00',
        address: '0xabcd...efgh',
      },
    ],
  },
  {
    protocol: 'XFlows',
    totalValue: '$8,888.88',
    link: 'https://wanscan.org/xflows',
    assets: [
       {
        icon: 'https://wanscan.org/images/icons/wan.png',
        name: 'wanBTC',
        balance: '0.1 WBTC',
        price: '$65,000',
        value: '$6,500.00',
        address: '0xijkl...mnop',
      },
       {
        icon: 'https://wanscan.org/images/icons/usdt.png',
        name: 'wanETH',
        balance: '1 ETH',
        price: '$3,500',
        value: '$3,500.00',
        address: '0xqrst...uvwx',
      },
    ],
  },
];


export default function HomePage() {
  return (
    <div className="flex min-h-screen p-4 space-x-4">
      <Sidebar />
      <main className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Enter your Wanchain address"
              className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-right">
            <p className="text-gray-400">Total Portfolio Value</p>
            <p className="text-3xl font-bold">$21,234.55</p>
          </div>
        </div>

        <div className="space-y-8">
          {mockAssetGroups.map((group) => (
            <section key={group.protocol}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h2 className="text-2xl font-semibold">{group.protocol}</h2>
                  <span className="ml-4 text-lg text-gray-400">{group.totalValue}</span>
                </div>
                <a href={group.link} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-300">
                  <span>Visit DApp</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.assets.map((asset) => (
                  <AssetCard key={asset.name} {...asset} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
