// Chainlink Functions Router addresses per network
export const FUNCTIONS_ROUTER_CONFIG: Record<number, string> = {
  // Sepolia
  11155111: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
  // Arbitrum Sepolia
  421614: "0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C",
  // Local Hardhat
  1337: "0x0000000000000000000000000000000000000000",
};

// DON IDs per network (bytes32 encoded)
export const DON_ID_CONFIG: Record<number, string> = {
  // Sepolia: "fun-ethereum-sepolia-1"
  11155111:
    "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
  // Arbitrum Sepolia: "fun-arbitrum-sepolia-1"
  421614: "0x66756e2d617262697472756d2d7365706f6c69612d3100000000000000000000",
  // Local Hardhat
  1337: "0x0000000000000000000000000000000000000000000000000000000000000000",
};
