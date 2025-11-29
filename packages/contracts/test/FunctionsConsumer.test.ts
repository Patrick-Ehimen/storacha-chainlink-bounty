import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("FunctionsConsumer", function () {
  async function deployFixture() {
    const [owner, router, dataRegistry] = await hre.ethers.getSigners();

    const FunctionsConsumer = await hre.ethers.getContractFactory("FunctionsConsumer");
    const functionsConsumer = await FunctionsConsumer.deploy(
      router.address,
      1, // subscriptionId
      300000, // gasLimit
      hre.ethers.encodeBytes32String("testDON"), // donId
      dataRegistry.address
    );

    return { functionsConsumer, owner, router, dataRegistry };
  }

  describe("Deployment", function () {
    it("Should set correct configuration", async function () {
      const { functionsConsumer, dataRegistry } = await loadFixture(deployFixture);

      expect(await functionsConsumer.subscriptionId()).to.equal(1);
      expect(await functionsConsumer.gasLimit()).to.equal(300000);
      expect(await functionsConsumer.donId()).to.equal(hre.ethers.encodeBytes32String("testDON"));
      expect(await functionsConsumer.dataRegistry()).to.equal(dataRegistry.address);
    });
  });

  describe("Request Verification", function () {
    it("Should revert with empty CID", async function () {
      const { functionsConsumer } = await loadFixture(deployFixture);

      await expect(
        functionsConsumer.requestVerification(1, "", "QmSchema")
      ).to.be.revertedWithCustomError(functionsConsumer, "InvalidArguments");
    });

    it("Should revert with empty schema", async function () {
      const { functionsConsumer } = await loadFixture(deployFixture);

      await expect(
        functionsConsumer.requestVerification(1, "QmData", "")
      ).to.be.revertedWithCustomError(functionsConsumer, "InvalidArguments");
    });
  });

  describe("Admin Functions", function () {
    it("Should update verification source", async function () {
      const { functionsConsumer, owner } = await loadFixture(deployFixture);
      const newSource = "console.log('test');";

      await expect(functionsConsumer.connect(owner).updateVerificationSource(newSource))
        .to.emit(functionsConsumer, "VerificationSourceUpdated")
        .withArgs(newSource);

      expect(await functionsConsumer.verificationSource()).to.equal(newSource);
    });

    it("Should update config", async function () {
      const { functionsConsumer, owner } = await loadFixture(deployFixture);
      const newDonId = hre.ethers.encodeBytes32String("newDON");

      await expect(functionsConsumer.connect(owner).updateConfig(2, 400000, newDonId))
        .to.emit(functionsConsumer, "ConfigUpdated")
        .withArgs(2, 400000, newDonId);

      expect(await functionsConsumer.subscriptionId()).to.equal(2);
      expect(await functionsConsumer.gasLimit()).to.equal(400000);
      expect(await functionsConsumer.donId()).to.equal(newDonId);
    });

    it("Should update DataRegistry address", async function () {
      const { functionsConsumer, owner } = await loadFixture(deployFixture);
      const newAddress = hre.ethers.Wallet.createRandom().address;

      await functionsConsumer.connect(owner).updateDataRegistry(newAddress);
      expect(await functionsConsumer.dataRegistry()).to.equal(newAddress);
    });

    it("Should revert if not owner", async function () {
      const { functionsConsumer, router } = await loadFixture(deployFixture);

      await expect(
        functionsConsumer.connect(router).updateVerificationSource("test")
      ).to.be.revertedWithCustomError(functionsConsumer, "OwnableUnauthorizedAccount");
    });
  });
});
