// src/components/AssetCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Define a type for the asset prop
interface Asset {
  DappName: string;
  asset: string;
  amount: string;
  [key: string]: any; // Allow other properties
}

interface AssetCardProps {
  asset: Asset;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{asset.DappName}: {asset.asset}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Amount: {asset.amount}</p>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>View Details</AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableBody>
                  {Object.entries(asset.extra || {}).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell>{String(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default AssetCard;
