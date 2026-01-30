import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BountyRegistryModule from "./BountyRegistry";
import FunctionsConsumerModule from "./FunctionsConsumer";
import DataRegistryModule from "./DataRegistry";
import EscrowManagerModule from "./EscrowManager";

const DeploySystemModule = buildModule("DeploySystem", (m) => {
  const { bountyRegistry } = m.useModule(BountyRegistryModule);
  const { functionsConsumer } = m.useModule(FunctionsConsumerModule);
  const { dataRegistry } = m.useModule(DataRegistryModule);
  const { escrowManager } = m.useModule(EscrowManagerModule);

  // Wire up FunctionsConsumer
  m.call(functionsConsumer, "updateDataRegistry", [dataRegistry]);

  // Wire up EscrowManager (bidirectional references)
  m.call(escrowManager, "setBountyRegistry", [bountyRegistry]);
  m.call(escrowManager, "setDataRegistry", [dataRegistry]);

  // Wire up BountyRegistry
  m.call(bountyRegistry, "setEscrowManager", [escrowManager]);
  m.call(bountyRegistry, "setDataRegistry", [dataRegistry]);

  // Wire up DataRegistry
  m.call(dataRegistry, "setEscrowManager", [escrowManager]);

  return {
    bountyRegistry,
    functionsConsumer,
    dataRegistry,
    escrowManager,
  };
});

export default DeploySystemModule;
