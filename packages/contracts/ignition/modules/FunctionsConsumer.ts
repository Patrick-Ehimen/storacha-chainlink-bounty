import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { FUNCTIONS_ROUTER_CONFIG, DON_ID_CONFIG } from "./config";

const FunctionsConsumerModule = buildModule("FunctionsConsumer", (m) => {
  const router = m.getParameter("router", FUNCTIONS_ROUTER_CONFIG[11155111]);
  const subscriptionId = m.getParameter("subscriptionId", 0);
  const gasLimit = m.getParameter("gasLimit", 300000);
  const donId = m.getParameter("donId", DON_ID_CONFIG[11155111]);

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
});

export default FunctionsConsumerModule;
