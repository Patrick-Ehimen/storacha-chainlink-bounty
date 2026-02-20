# @storacha-chainlink/functions

Chainlink Functions verification source code for the Storacha x Chainlink Data Bounty Marketplace.

This package provides the scaffolding for the JavaScript that runs on the Chainlink Decentralized Oracle Network (DON) to verify submitted data against a JSON Schema stored on IPFS.

> **Note:** `source.js` is currently a stub that always returns `0` (rejected). Full IPFS fetching, gateway fallback, and JSON Schema validation will be implemented in [#43](https://github.com/Patrick-Ehimen/storacha-chainlink-bounty/issues/43).

## How It Works

1. A contributor submits data to a bounty via `DataRegistry.submitData()`
2. The contract triggers `FunctionsConsumer.requestVerification(submissionId, cid, schemaUri)`
3. The DON executes this package's `source.js` with `args[0] = dataCid`, `args[1] = schemaCid`
4. The source fetches both from IPFS, validates data against the schema _(#43)_
5. Returns `1` (verified) or `0` (rejected) as a uint256

## DON Constraints

| Limit          | Value                 |
| -------------- | --------------------- |
| Execution time | 10 seconds            |
| Memory         | 128 MB                |
| HTTP requests  | 5 max                 |
| HTTP timeout   | 9 seconds per request |
| Response size  | 256 bytes on-chain    |

## Usage

### Programmatic

```typescript
import {
  getVerificationSource,
  simulateVerification,
} from "@storacha-chainlink/functions";

// Get the source string to store on-chain
const source = getVerificationSource();

// Simulate locally (requires Deno)
const result = await simulateVerification(dataCid, schemaCid);
console.log(result.verified); // true or false
```

### CLI Simulation

```bash
pnpm simulate -- --data-cid <CID> --schema-cid <CID>
```

### Deploying Source On-Chain

```typescript
const source = getVerificationSource();
await functionsConsumer.updateVerificationSource(source);
```

## Development

```bash
pnpm build          # Compile TypeScript
pnpm test           # Run tests (requires Deno)
pnpm test:coverage  # Run tests with coverage
pnpm lint           # Lint source files
pnpm check-types    # TypeScript type check
```
