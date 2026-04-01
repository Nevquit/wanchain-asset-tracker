// components/asset-card.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Asset {
  DappName: string;
  asset: string;
  amount: string;
  value: number;
  price: number;
}

interface AssetCardProps {
  asset: Asset;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{asset.asset}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          <span>Protocol:</span>
          <span>{asset.DappName}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount:</span>
          <span>{parseFloat(asset.amount).toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span>Price:</span>
          <span>${asset.price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Value:</span>
          <span>${asset.value.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetCard;
