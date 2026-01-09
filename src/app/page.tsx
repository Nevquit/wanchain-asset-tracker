// src/app/page.tsx
"use client";

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AssetCard } from '@/components/AssetCard';
import { Search, ExternalLink, LoaderCircle, AlertTriangle } from 'lucide-react';

// Define the structure of an asset based on the backend API response
interface Asset {
  protocol: string;
  name: string;
  balance: number;
  price: number;
  value: number;
  address: string;
  explorerUrl: string;
  logo: string;
  link: string;
}

// Define the structure for grouped assets
interface AssetGroup {
  protocol: string;
  totalValue: number;
  assets: Asset[];
  link?: string; // Link to the DApp
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export default function HomePage() {
  const [address, setAddress] = useState('');
  const [assetGroups, setAssetGroups] = useState<AssetGroup[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFetchAssets = async () => {
    if (!address) {
      setError("Please enter a Wanchain address.");
      return;
    }
    setLoadingState('loading');
    setError(null);
    setAssetGroups([]); // Clear previous results

    try {
      const response = await fetch(`/api/assets?address=${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An unknown error occurred.");
      }

      // Group assets by protocol
      const groups: { [key: string]: AssetGroup } = {};
      data.assets.forEach((asset: Asset) => {
        if (!groups[asset.protocol]) {
          groups[asset.protocol] = {
            protocol: asset.protocol,
            totalValue: 0,
            assets: [],
            link: asset.link, // Assume link is the same for all assets in a protocol
          };
        }
        groups[asset.protocol].assets.push(asset);
        groups[asset.protocol].totalValue += asset.value;
      });

      const groupedAssets = Object.values(groups);
      const totalPortfolioValue = groupedAssets.reduce((sum, group) => sum + group.totalValue, 0);

      setAssetGroups(groupedAssets);
      setTotalValue(totalPortfolioValue);
      setLoadingState('success');

    } catch (err: any) {
      console.error("Failed to fetch assets:", err);
      setError(err.message);
      setLoadingState('error');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleFetchAssets();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="flex min-h-screen p-4 space-x-4">
      <Sidebar />
      <main className="flex-1">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your Wanchain address"
              className="w-full bg-gray-800 border border-gray-700 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleFetchAssets}
            disabled={loadingState === 'loading'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-full transition-colors"
          >
            {loadingState === 'loading' ? <LoaderCircle className="animate-spin" /> : 'Search'}
          </button>
          <div className="text-right">
            <p className="text-gray-400">Total Portfolio Value</p>
            <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        {/* Dynamic content rendering based on loading state */}
        {loadingState === 'loading' && (
          <div className="flex justify-center items-center h-64">
            <LoaderCircle className="w-12 h-12 animate-spin text-blue-500" />
          </div>
        )}

        {loadingState === 'error' && (
          <div className="flex flex-col items-center justify-center h-64 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-xl font-semibold text-red-400">Failed to fetch assets</p>
            <p className="text-gray-400 mt-2">{error}</p>
          </div>
        )}

        {loadingState === 'success' && assetGroups.length === 0 && (
          <div className="text-center h-64 flex flex-col justify-center">
            <p className="text-2xl font-semibold">No assets found for this address.</p>
            <p className="text-gray-400 mt-2">Try a different Wanchain address.</p>
          </div>
        )}

        {loadingState === 'success' && assetGroups.length > 0 && (
          <div className="space-y-8">
            {assetGroups.map((group) => (
              <section key={group.protocol}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-semibold">{group.protocol}</h2>
                    <span className="ml-4 text-lg text-gray-400">{formatCurrency(group.totalValue)}</span>
                  </div>
                  {group.link && (
                    <a
                      href={group.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-semibold py-2 px-4 rounded-full transition-colors"
                    >
                      <span>Visit DApp</span>
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.assets.map((asset) => (
                    <AssetCard
                      key={`${asset.protocol}-${asset.name}-${asset.address}`}
                      icon={asset.logo}
                      name={asset.name}
                      balance={typeof asset.balance === 'number' ? `${asset.balance.toFixed(4)} ${asset.name}` : `N/A ${asset.name}`}
                      price={formatCurrency(asset.price)}
                      value={formatCurrency(asset.value)}
                      address={asset.address}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
