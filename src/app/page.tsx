// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from '@/components/Sidebar';
import AssetCard from '@/components/AssetCard';

// Define a type for the asset to be used in the component
interface Asset {
  DappName: string;
  asset: string;
  amount: string;
  value: number;
  price: number;
}

export default function Home() {
  const [address, setAddress] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async () => {
    if (!address) {
      setError("Please enter a Wanchain address.");
      return;
    }
    setLoading(true);
    setError(null);
    setAssets([]);

    try {
      const response = await fetch(`/api/assets?address=${address}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assets');
      }
      const data = await response.json();
      if (!data.assets || data.assets.length === 0) {
        setError("No assets found for this address.");
      }
      setAssets(data.assets);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center space-x-2 mb-8">
          <Input
            type="text"
            placeholder="Enter Wanchain address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={fetchAssets}>Search</Button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, index) => (
            <AssetCard key={index} asset={asset} />
          ))}
        </div>
      </main>
    </div>
  );
}
