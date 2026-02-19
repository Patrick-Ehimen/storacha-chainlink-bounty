import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BountyRegistryModule from "./BountyRegistry";
import FunctionsConsumerModule from "./FunctionsConsumer";
import DataRegistryModule from "./DataRegistry";
import EscrowManagerModule from "./EscrowManager";
import { ethers } from "ethers";

const DATA_REGISTRY_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("DATA_REGISTRY_ROLE"),
);
const FUNCTIONS_CONSUMER_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("FUNCTIONS_CONSUMER_ROLE"),
);
const BOUNTY_REGISTRY_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("BOUNTY_REGISTRY_ROLE"),
);
const ESCROW_MANAGER_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("ESCROW_MANAGER_ROLE"),
);

const DeploySystemModule = buildModule("DeploySystem", (m) => {
  const { bountyRegistry } = m.useModule(BountyRegistryModule);
  const { functionsConsumer } = m.useModule(FunctionsConsumerModule);
  const { dataRegistry } = m.useModule(DataRegistryModule);
  const { escrowManager } = m.useModule(EscrowManagerModule);

  // Wire up FunctionsConsumer
  m.call(functionsConsumer, "updateDataRegistry", [dataRegistry]);

  // Wire up EscrowManager (AccessControl)
  m.call(escrowManager, "grantRole", [BOUNTY_REGISTRY_ROLE, bountyRegistry]);
  m.call(escrowManager, "grantRole", [DATA_REGISTRY_ROLE, dataRegistry]);

  const deployer = m.getAccount(0);
  m.call(escrowManager, "grantRole", [ESCROW_MANAGER_ROLE, deployer]);

  // Wire up BountyRegistry
  m.call(bountyRegistry, "setEscrowManager", [escrowManager]);
  m.call(bountyRegistry, "grantRole", [DATA_REGISTRY_ROLE, dataRegistry]);

  // Wire up DataRegistry
  m.call(dataRegistry, "setEscrowManager", [escrowManager]);
  m.call(dataRegistry, "grantRole", [
    FUNCTIONS_CONSUMER_ROLE,
    functionsConsumer,
  ]);

  return {
    bountyRegistry,
    functionsConsumer,
    dataRegistry,
    escrowManager,
  };
});

export default DeploySystemModule;
