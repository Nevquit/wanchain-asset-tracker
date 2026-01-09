// src/components/AddressForm.tsx
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddressFormProps {
  onSearch: (address: string) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSearch }) => {
  const [address, setAddress] = React.useState('');

  const handleSearch = () => {
    if (address) {
      onSearch(address);
    }
  };

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input
        type="text"
        placeholder="Enter Wanchain address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <Button type="submit" onClick={handleSearch}>
        Search
      </Button>
    </div>
  );
};

export default AddressForm;
