import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BountySystemModule = buildModule("BountySystemModule", (m) => {
  const router = m.getParameter(
    "router",
    "0xC22a79eBA6bf4C28b746a663EBdd25Eb8c281892",
  );
  const subscriptionId = m.getParameter("subscriptionId", 0);
  const gasLimit = m.getParameter("gasLimit", 300000);
  const donId = m.getParameter(
    "donId",
    "0x66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000",
  );

  const bountyRegistry = m.contract("BountyRegistry");

  const dataRegistry = m.contract("DataRegistry", [
    bountyRegistry,
    "0x0000000000000000000000000000000000000000",
  ]);

  const functionsConsumer = m.contract("FunctionsConsumer", [
    router,
    subscriptionId,
    gasLimit,
    donId,
    dataRegistry,
  ]);

  m.call(bountyRegistry, "setDataRegistry", [dataRegistry]);

  m.call(dataRegistry, "setFunctionsConsumer", [functionsConsumer]);

  return { bountyRegistry, dataRegistry, functionsConsumer };
});

export default BountySystemModule;
