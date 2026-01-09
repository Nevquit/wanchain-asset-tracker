# Wanchain Asset Tracker

A Next.js application to track your assets across various DeFi protocols on the Wanchain blockchain. Enter a Wanchain address to get a comprehensive overview of your decentralized portfolio.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (powered by Radix UI)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Blockchain Interaction**: [ethers.js](https://ethers.io/)
- **Wanchain Services**: [iWan SDK](https://www.wanchain.org/iwan/)

---

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later is recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### 2. Clone the Repository

```bash
git clone https://github.com/wanchain/wanchain-asset-tracker.git
cd wanchain-asset-tracker
```

### 3. Install Dependencies

Install all the required packages using npm:

```bash
npm install
```

### 4. Set Up Environment Variables

The application requires API keys and RPC URLs to fetch on-chain data.

1.  Create a local environment file by copying the example file:

    ```bash
    cp .env.example .env.local
    ```

2.  Open the `.env.local` file and fill in the required values.

    ```plaintext
    # .env.local

    # Wanchain Mainnet RPC URL (public node is provided)
    WANCHAIN_RPC_URL="https://gwan-ssl.wandevs.org:56891"

    # iWan SDK API Keys (Required for PoS and Storeman protocols)
    # Obtain your keys from the iWan portal.
    IWAN_API_KEY="YOUR_IWAN_API_KEY"
    IWAN_SECRET_KEY="YOUR_IWAN_SECRET_KEY"

    # iWan SDK Hostname (DO NOT include https:// or paths)
    IWAN_RPC_URL="api.wanchain.org"
    ```

    **Important**: The `PoS` and `Storeman` protocols will fail to fetch data without valid iWan API keys. However, the `Wallet`, `XFlows`, and `xwanFarming` protocols can function without these keys.

### 5. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

The project follows a feature-centric structure within the `/src` directory.

- `/src/app`: Contains the Next.js App Router pages and API routes.
  - `/src/app/page.tsx`: The main page of the application.
  - `/src/app/api/assets/route.ts`: The backend API endpoint for fetching assets.
- `/src/components`: Reusable React components used throughout the application (e.g., `AssetCard`, `Sidebar`).
- `/src/services`: Core backend logic for fetching data from different protocols.
  - `/src/services/orchestrator.js`: The central module that dynamically discovers and runs all protocol scripts.
  - `/src/services/protocols/`: **This is the modular heart of the backend.** Each file in this directory represents a different protocol.
- `/src/config`: Shared configuration, such as RPC providers and ABIs.
- `/src/utils`: Reusable helper functions and data models.

### How to Add a New Protocol (Modular Extensibility)

Thanks to the modular design of the `orchestrator.js`, adding support for a new protocol is straightforward:

1.  Create a new JavaScript file inside the `/src/services/protocols/` directory (e.g., `myNewProtocol.js`).
2.  In this file, write and export a single asynchronous function that accepts a Wanchain address as its only argument.
3.  This function should return a `Promise` that resolves to an array of `AssetData` objects (or an empty array `[]` on failure).

The orchestrator will automatically detect, import, and execute your new file without any further configuration changes.
