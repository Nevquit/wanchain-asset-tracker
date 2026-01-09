// src/components/AssetDisplay.tsx
import React from 'react';
import AssetCard from './AssetCard';

// Define a type for the asset prop
interface Asset {
  DappName: string;
  asset: string;
  amount: string;
  [key: string]: any; // Allow other properties
}

interface AssetDisplayProps {
  assets: Asset[];
}

const AssetDisplay: React.FC<AssetDisplayProps> = ({ assets }) => {
  if (assets.length === 0) {
    return (
      <main>
        <h2>No assets found.</h2>
      </main>
    );
  }

  return (
    <main>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset, index) => (
          <AssetCard key={index} asset={asset} />
        ))}
      </div>
    </main>
  );
};

export default AssetDisplay;
