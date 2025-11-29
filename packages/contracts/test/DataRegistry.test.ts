import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("DataRegistry", function () {
  async function deployFixture() {
    const [owner, creator, contributor, functionsConsumer] = await hre.ethers.getSigners();

    const BountyRegistry = await hre.ethers.getContractFactory("BountyRegistry");
    const bountyRegistry = await BountyRegistry.deploy();

    const DataRegistry = await hre.ethers.getContractFactory("DataRegistry");
    const dataRegistry = await DataRegistry.deploy(
      await bountyRegistry.getAddress(),
      functionsConsumer.address
    );

    const deadline = (await time.latest()) + 86400;
    await bountyRegistry.connect(creator).createBounty(
      "Test Bounty",
      "Description",
      "QmSchema",
      deadline,
      10,
      { value: hre.ethers.parseEther("0.1") }
    );

    return { dataRegistry, bountyRegistry, owner, creator, contributor, functionsConsumer };
  }

  describe("Deployment", function () {
    it("Should set correct addresses", async function () {
      const { dataRegistry, bountyRegistry, functionsConsumer } = await loadFixture(deployFixture);
      expect(await dataRegistry.bountyRegistry()).to.equal(await bountyRegistry.getAddress());
      expect(await dataRegistry.functionsConsumer()).to.equal(functionsConsumer.address);
    });
  });

  describe("Submit Data", function () {
    it("Should submit data for active bounty", async function () {
      const { dataRegistry, contributor } = await loadFixture(deployFixture);

      await expect(
        dataRegistry.connect(contributor).submitData(0, "QmDataCID", "metadata")
      ).to.emit(dataRegistry, "DataSubmitted")
        .withArgs(0, 0, contributor.address, "QmDataCID")
        .and.to.emit(dataRegistry, "VerificationRequested");

      const submission = await dataRegistry.getSubmission(0);
      expect(submission.contributor).to.equal(contributor.address);
      expect(submission.cid).to.equal("QmDataCID");
      expect(submission.status).to.equal(1); // VERIFYING
    });

    it("Should revert with empty CID", async function () {
      const { dataRegistry, contributor } = await loadFixture(deployFixture);

      await expect(
        dataRegistry.connect(contributor).submitData(0, "", "metadata")
      ).to.be.revertedWithCustomError(dataRegistry, "InvalidCID");
    });

    it("Should revert for inactive bounty", async function () {
      const { dataRegistry, bountyRegistry, creator, contributor } = await loadFixture(deployFixture);

      await bountyRegistry.connect(creator).cancelBounty(0);

      await expect(
        dataRegistry.connect(contributor).submitData(0, "QmDataCID", "metadata")
      ).to.be.revertedWithCustomError(dataRegistry, "BountyNotActive");
    });

    it("Should track submissions per bounty", async function () {
      const { dataRegistry, contributor } = await loadFixture(deployFixture);

      await dataRegistry.connect(contributor).submitData(0, "QmData1", "meta1");
      await dataRegistry.connect(contributor).submitData(0, "QmData2", "meta2");

      const submissions = await dataRegistry.getBountySubmissions(0);
      expect(submissions.length).to.equal(2);
      expect(submissions[0]).to.equal(0);
      expect(submissions[1]).to.equal(1);
    });
  });

  describe("Handle Verification Result", function () {
    it("Should handle verified submission", async function () {
      const { dataRegistry, bountyRegistry, contributor, functionsConsumer } = await loadFixture(deployFixture);

      await dataRegistry.connect(contributor).submitData(0, "QmDataCID", "metadata");

      await hre.ethers.provider.send("hardhat_setBalance", [
        await dataRegistry.getAddress(),
        "0x" + hre.ethers.parseEther("1").toString(16)
      ]);

      await expect(
        dataRegistry.connect(functionsConsumer).handleVerificationResult(0, true, "0x")
      ).to.emit(dataRegistry, "SubmissionVerified")
        .withArgs(0, 0, contributor.address, true)
        .and.to.emit(dataRegistry, "PaymentReleased")
        .and.to.emit(bountyRegistry, "BountyCompleted");

      const submission = await dataRegistry.getSubmission(0);
      expect(submission.status).to.equal(2); // VERIFIED
    });

    it("Should handle rejected submission", async function () {
      const { dataRegistry, contributor, functionsConsumer } = await loadFixture(deployFixture);

      await dataRegistry.connect(contributor).submitData(0, "QmDataCID", "metadata");

      await expect(
        dataRegistry.connect(functionsConsumer).handleVerificationResult(0, false, "0x")
      ).to.emit(dataRegistry, "SubmissionVerified")
        .withArgs(0, 0, contributor.address, false);

      const submission = await dataRegistry.getSubmission(0);
      expect(submission.status).to.equal(3); // REJECTED
    });

    it("Should revert if not called by FunctionsConsumer", async function () {
      const { dataRegistry, contributor } = await loadFixture(deployFixture);

      await dataRegistry.connect(contributor).submitData(0, "QmDataCID", "metadata");

      await expect(
        dataRegistry.connect(contributor).handleVerificationResult(0, true, "0x")
      ).to.be.revertedWithCustomError(dataRegistry, "Unauthorized");
    });

    it("Should revert for invalid status", async function () {
      const { dataRegistry, contributor, functionsConsumer } = await loadFixture(deployFixture);

      await dataRegistry.connect(contributor).submitData(0, "QmDataCID", "metadata");
      await dataRegistry.connect(functionsConsumer).handleVerificationResult(0, false, "0x");

      await expect(
        dataRegistry.connect(functionsConsumer).handleVerificationResult(0, true, "0x")
      ).to.be.revertedWithCustomError(dataRegistry, "InvalidStatus");
    });
  });

  describe("View Functions", function () {
    it("Should get submissions by contributor", async function () {
      const { dataRegistry, contributor } = await loadFixture(deployFixture);

      await dataRegistry.connect(contributor).submitData(0, "QmData1", "meta1");
      await dataRegistry.connect(contributor).submitData(0, "QmData2", "meta2");

      const submissions = await dataRegistry.getSubmissionsByContributor(contributor.address);
      expect(submissions.length).to.equal(2);
    });

    it("Should get total submissions", async function () {
      const { dataRegistry, contributor } = await loadFixture(deployFixture);

      await dataRegistry.connect(contributor).submitData(0, "QmData1", "meta1");
      expect(await dataRegistry.getTotalSubmissions()).to.equal(1);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set FunctionsConsumer", async function () {
      const { dataRegistry, owner } = await loadFixture(deployFixture);
      const newAddress = hre.ethers.Wallet.createRandom().address;

      await dataRegistry.connect(owner).setFunctionsConsumer(newAddress);
      expect(await dataRegistry.functionsConsumer()).to.equal(newAddress);
    });
  });
});
