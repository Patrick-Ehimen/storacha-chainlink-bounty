import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BountyRegistryModule from "./BountyRegistry";

const DataRegistryModule = buildModule("DataRegistry", (m) => {
  const { bountyRegistry } = m.useModule(BountyRegistryModule);

  const dataRegistry = m.contract("DataRegistry", [bountyRegistry]);

  return { dataRegistry };
});

export default DataRegistryModule;
