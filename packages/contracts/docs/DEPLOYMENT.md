# Deployment Guide

This project uses Hardhat Ignition for deployment.

## Prerequisites

- Node.js and pnpm installed.
- Environment variables set in `.env` (see `.env.example`).
  - `SEPOLIA_RPC_URL`
  - `ARBITRUM_SEPOLIA_RPC_URL`
  - `PRIVATE_KEY`
  - `ETHERSCAN_API_KEY` (for verification)

## Modules

The deployment modules are located in `ignition/modules/`:

- `BountyRegistry.ts`: Deploys BountyRegistry.
- `FunctionsConsumer.ts`: Deploys FunctionsConsumer with Chainlink Functions configuration.
- `DataRegistry.ts`: Deploys DataRegistry (depends on BountyRegistry and FunctionsConsumer).
- `EscrowManager.ts`: Deploys EscrowManager.
- `DeploySystem.ts`: Deploys all contracts and wires them together (sets registry addresses).

## Configuration

Chainlink Functions Router addresses and DON IDs are configured in `ignition/modules/config.ts`.
To add support for a new network, update the `FUNCTIONS_ROUTER_CONFIG` and `DON_ID_CONFIG` objects in that file.

## Deployment Commands

### Local Hardhat Network

```bash
pnpm deploy:local
```

### Sepolia Testnet

```bash
pnpm deploy:sepolia
```

### Arbitrum Sepolia Testnet

```bash
pnpm deploy:arbitrum-sepolia
```

## Verification

To verify contracts on Etherscan/Arbiscan:

```bash
npx hardhat verify --network <network_name> <contract_address> <constructor_args>
```

Ignition also supports automatic verification.
