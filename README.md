# Wanchain Asset Tracker

![Wanchain Logo](./public/images/logo.svg)

Wanchain Asset Tracker is a tool that allows users to track their assets across various DeFi protocols on the Wanchain blockchain. Enter a Wanchain address to get a comprehensive overview of your decentralized portfolio, including wallet balances, staked assets, and liquidity positions.

## Features

- **Unified View:** See all your Wanchain assets in one place.
- **Protocol Support:** Tracks assets across multiple protocols, including PoS staking, Storeman nodes, xFlows (Uniswap V3), and xWAN Farming.
- **Real-Time Prices:** Fetches real-time price data for accurate portfolio valuation.
- **Responsive UI:** Clean and simple interface that works on both desktop and mobile devices.
- **Serverless Architecture:** Built with Vercel Serverless Functions for scalability and efficiency.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later recommended)
- [Vercel CLI](https://vercel.com/docs/cli)

### Local Development with Vercel CLI

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/wanchain/wanchain-asset-tracker.git
    cd wanchain-asset-tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    The backend service requires API keys for certain services. Copy the example environment file and fill in the required values.
    ```bash
    cp .env.example .env
    ```
    You will need to add your own API keys to the `.env` file for services like `iWAN`.

4.  **Run the development server:**

    Use the Vercel CLI to start the local development server. This will replicate the Vercel cloud environment locally.
    ```bash
    vercel dev
    ```
    The application will be available at `http://localhost:3000`.

## Deployment

This project is configured for easy deployment with [Vercel](https://vercel.com/).

1.  **Fork the repository** to your GitHub account.
2.  **Connect your GitHub account to Vercel.**
3.  **Import the forked repository** as a new project on Vercel.
4.  **Configure Environment Variables:** Add the same environment variables from your `.env` file to the Vercel project settings.
5.  **Deploy!** Vercel will automatically build and deploy the application. Any subsequent pushes to the `main` branch will trigger automatic redeployments.

## Project Structure

-   `/api`: Contains the Vercel Serverless Function that acts as the backend entry point.
-   `/public`: Holds all static frontend assets, including HTML, CSS, JavaScript, and images.
-   `/services`: Core backend logic, with separate modules for each DeFi protocol.
-   `/config`: Shared configuration files for both frontend and backend.
-   `/utils`: Reusable helper functions and data models.
