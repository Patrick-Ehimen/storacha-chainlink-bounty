# Storacha x Chainlink: Decentralized Data Bounty Marketplace

A trustless marketplace for data bounties powered by Storacha (decentralized storage) and Chainlink (oracle verification).

## 📋 Project Overview

This project integrates **Storacha** (decentralized storage on IPFS/Filecoin) with **Chainlink** (oracle network) to create a trustless marketplace where:

- 💰 **Creators** post bounties for specific datasets
- 📤 **Contributors** upload data to decentralized storage
- ✅ **Oracles** verify data quality and compliance
- 💸 **Smart Contracts** automatically release payments

## 🏗️ Monorepo Structure

This is a Turborepo monorepo containing:

### Apps

- **`apps/frontend`** - Next.js web application for creating bounties and submitting data

### Packages

- **`packages/contracts`** - Solidity smart contracts (Hardhat)
  - BountyRegistry - Manages bounty lifecycle
  - DataRegistry - Tracks data submissions
  - FunctionsConsumer - Chainlink oracle integration
  - EscrowManager - Handles payment escrow

- **`packages/sdk`** - TypeScript SDK for Storacha integration
  - Upload/retrieve data from IPFS
  - UCAN capability delegation
  - Filecoin storage proofs

- **`packages/functions`** - Chainlink Functions verification logic
  - Off-chain data validation
  - JSON Schema compliance checking
  - Quality scoring algorithms

- **`packages/eslint-config`** - Shared ESLint configuration
- **`packages/typescript-config`** - Shared TypeScript configuration

## 🚀 Quick Start

### Prerequisites

```bash
node >= 18.0.0
pnpm >= 9.0.0
```

### 1. Installation

```bash
# Clone the repository
git clone <repo-url>
cd storacha-chainlink-bounty

# Install dependencies
pnpm install
```

### 2. Environment Setup

Use the provided example files as a starting point and copy them to real `.env` files:

1. **Root env (shared defaults)**

   Copy `.env.example` to `.env` at the repository root:

   ```bash
   cp .env.example .env
   ```

   Example contents:

   ```env
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY
   PRIVATE_KEY=your_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_key
   ARBISCAN_API_KEY=your_arbiscan_key

   CHAINLINK_ROUTER=0xb83E47C2bC239B3bf370bc41e1459A34b41238D0
   SUBSCRIPTION_ID=your_subscription_id
   DON_ID=fun-ethereum-sepolia-1

   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
   NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS=0xYourBountyRegistryAddress
   NEXT_PUBLIC_DATA_REGISTRY_ADDRESS=0xYourDataRegistryAddress
   ```

2. **Contracts env**

   Inside `packages/contracts`, copy `.env.example` to `.env`:

   ```bash
   cd packages/contracts
   cp .env.example .env
   ```

   Example contents (must match the example file):

   ```env
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY
   PRIVATE_KEY=your_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_key
   ARBISCAN_API_KEY=your_arbiscan_key

   CHAINLINK_ROUTER=0xb83E47C2bC239B3bf370bc41e1459A34b41238D0
   SUBSCRIPTION_ID=your_subscription_id
   DON_ID=fun-ethereum-sepolia-1
   ```

3. **Frontend env**

   Inside `apps/frontend`, copy `.env.example` to `.env.local`:

   ```bash
   cd apps/frontend
   cp .env.example .env.local
   ```

   Example contents:

   ```env
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
   NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS=0xYourBountyRegistryAddress
   NEXT_PUBLIC_DATA_REGISTRY_ADDRESS=0xYourDataRegistryAddress
   ```

### 3. Development

Start the development environment:

```bash
# Run all packages in dev mode
pnpm dev

# Run specific package
pnpm dev --filter=@storacha-chainlink/frontend
```

### 4. Build

Build all packages:

```bash
# Build everything
pnpm build

# Build specific package
pnpm build --filter=@storacha-chainlink/contracts
```

## 📦 Package Scripts

### Contracts (`packages/contracts`)

```bash
# Compile contracts
pnpm compile

# Run tests
pnpm test

# Deploy to local network
pnpm node                    # Terminal 1: Start local node
pnpm deploy                  # Terminal 2: Deploy contracts

# Deploy to testnet
pnpm deploy:sepolia

# Verify on Etherscan
pnpm verify --network sepolia <CONTRACT_ADDRESS>

# Generate coverage report
pnpm coverage
```

### Frontend (`apps/frontend`)

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## 🎯 How It Works

### 1. Create a Bounty

```typescript
// Creator posts a bounty
await createBounty({
  title: "Weather Data Collection",
  description: "Hourly temperature readings from major cities",
  schemaUri: "bafybeischema123...", // IPFS CID of JSON Schema
  deadline: Date.now() + 7 * 24 * 60 * 60, // 7 days
  maxSubmissions: 100,
  reward: "0.5", // ETH
});
```

### 2. Upload Data to Storacha

```typescript
// Contributor uploads data
const storacha = await StorachaBountyClient.create({
  email: "contributor@example.com",
  spaceName: "weather-data",
});

const { cid } = await storacha.uploadFile(dataFile);
// Returns: bafybeidata123...
```

### 3. Submit to Smart Contract

```typescript
// Submit CID to bounty
await submitData({
  bountyId: 1,
  cid: "bafybeidata123...",
  metadata: JSON.stringify({ source: "weather-station-42" }),
});
```

### 4. Chainlink Verification

The smart contract triggers Chainlink Functions which:

- Fetches data from IPFS via multiple gateways
- Validates against the bounty's JSON Schema
- Calculates quality score
- Returns verification result on-chain

### 5. Automatic Payment

If verified, the smart contract automatically releases funds to the contributor.

## 🔐 Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│   Create Bounties | Submit Data         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Smart Contracts (Hardhat)          │
│  BountyRegistry | DataRegistry          │
│  FunctionsConsumer | EscrowManager      │
└─────────┬──────────────────┬────────────┘
          │                  │
          │                  ▼
          │        ┌──────────────────────┐
          │        │  Chainlink DON       │
          │        │  Verification Logic  │
          │        └──────────┬───────────┘
          │                   │
          ▼                   ▼
┌─────────────────────────────────────────┐
│   Storacha (IPFS + Filecoin)            │
│   Decentralized Data Storage            │
└─────────────────────────────────────────┘
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test specific package
pnpm test --filter=@storacha-chainlink/contracts

# Smart contract tests with coverage
cd packages/contracts
pnpm coverage
```

## 📝 Technology Stack

| Component           | Technology                      |
| ------------------- | ------------------------------- |
| **Storage**         | Storacha (w3up), IPFS, Filecoin |
| **Oracles**         | Chainlink Functions             |
| **Blockchain**      | Ethereum, Arbitrum (L2)         |
| **Smart Contracts** | Solidity 0.8.20, Hardhat        |
| **Frontend**        | Next.js 16, React 19            |
| **Auth**            | UCAN (ucanto)                   |

## 🛠️ Development Workflow

### Adding a New Package

```bash
# Create package directory
mkdir -p packages/my-package

# Initialize package.json
cd packages/my-package
pnpm init

# Update name to @storacha-chainlink/my-package
```

### Adding Dependencies

```bash
# Add to specific package
pnpm add <package> --filter=@storacha-chainlink/contracts

# Add dev dependency
pnpm add -D <package> --filter=@storacha-chainlink/frontend

# Add to workspace root
pnpm add -w <package>
```

## 🚢 Deployment

### Smart Contracts

1. Deploy to Sepolia testnet:

```bash
cd packages/contracts
pnpm deploy:sepolia
```

2. Verify on Etherscan:

```bash
pnpm verify --network sepolia <CONTRACT_ADDRESS>
```

3. Update frontend environment variables with deployed addresses

### Frontend

Deploy to Vercel:

```bash
cd apps/frontend
vercel --prod
```

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE_OVERVIEW.md)
- [Technical Specifications](./docs/TECHNICAL_SPECIFICATIONS.md)
- [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md)
- [Storacha Documentation](https://docs.storacha.network)
- [Chainlink Functions](https://docs.chain.link/chainlink-functions)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Storacha GitHub](https://github.com/storacha)
- [Chainlink GitHub](https://github.com/smartcontractkit/chainlink)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Turborepo Documentation](https://turborepo.com/docs)

## ⚠️ Disclaimer

This project is in **active development**. Do not use in production without:

- ✅ Complete security audit
- ✅ Comprehensive testing on testnets
- ✅ Legal review of bounty mechanics
- ✅ Insurance/risk management strategy
