// src/components/Header.tsx
import React from "react";
import Image from "next/image";

const Header = () => {
  return (
    <header className="flex items-center p-4 border-b">
      <Image
        src="/images/logo.svg"
        alt="Wanchain Logo"
        width={32}
        height={32}
      />
      <h1 className="text-xl font-bold ml-2">Wanchain Asset Tracker</h1>
    </header>
  );
};

export default Header;
