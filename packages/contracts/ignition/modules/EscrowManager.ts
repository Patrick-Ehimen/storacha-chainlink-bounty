import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EscrowManagerModule = buildModule("EscrowManager", (m) => {
  const escrowManager = m.contract("EscrowManager");
  return { escrowManager };
});

export default EscrowManagerModule;
