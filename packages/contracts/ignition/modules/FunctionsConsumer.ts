import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import type { ModuleBuilder } from "@nomicfoundation/hardhat-ignition/modules";

const FunctionsConsumerModule = buildModule(
  "FunctionsConsumer",
  (m: ModuleBuilder) => {
    // Network-specific parameters - must be provided via ignition parameters
    // See config.ts for values per network
    const router = m.getParameter("router");
    const subscriptionId = m.getParameter("subscriptionId", 0);
    const gasLimit = m.getParameter("gasLimit", 300000);
    const donId = m.getParameter("donId");

    const dataRegistryAddress = m.getParameter(
      "dataRegistry",
      "0x0000000000000000000000000000000000000000",
    );

    const functionsConsumer = m.contract("FunctionsConsumer", [
      router,
      subscriptionId,
      gasLimit,
      donId,
      dataRegistryAddress,
    ]);

    return { functionsConsumer };
  },
);

export default FunctionsConsumerModule;
