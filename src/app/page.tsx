// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import AddressForm from '@/components/AddressForm';
import AssetDisplay from '@/components/AssetDisplay';

// Define a type for the asset
interface Asset {
  DappName: string;
  asset: string;
  amount: string;
  [key: string]: any; // Allow other properties
}

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async (address: string) => {
    setLoading(true);
    setError(null);
    setAssets([]);

    try {
      const response = await fetch(`/api/assets?address=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      const data = await response.json();
      setAssets(data.assets);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 p-4">
          <AddressForm onSearch={fetchAssets} />
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          <AssetDisplay assets={assets} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
