import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BountyRegistryModule = buildModule("BountyRegistry", (m) => {
  const bountyRegistry = m.contract("BountyRegistry");
  return { bountyRegistry };
});

export default BountyRegistryModule;
