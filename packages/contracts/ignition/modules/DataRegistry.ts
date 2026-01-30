import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BountyRegistryModule from "./BountyRegistry";
import FunctionsConsumerModule from "./FunctionsConsumer";

const DataRegistryModule = buildModule("DataRegistry", (m) => {
  const { bountyRegistry } = m.useModule(BountyRegistryModule);
  const { functionsConsumer } = m.useModule(FunctionsConsumerModule);

  const dataRegistry = m.contract("DataRegistry", [
    bountyRegistry,
    functionsConsumer,
  ]);

  return { dataRegistry };
});

export default DataRegistryModule;
