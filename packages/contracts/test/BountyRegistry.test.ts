import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("BountyRegistry", function () {
  async function deployFixture() {
    const [owner, creator, user] = await hre.ethers.getSigners();
    const BountyRegistry = await hre.ethers.getContractFactory("BountyRegistry");
    const registry = await BountyRegistry.deploy();
    return { registry, owner, creator, user };
  }

  describe("Deployment", function () {
    it("Should set owner and initialize counters", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.getTotalBounties()).to.equal(0);
    });
  });

  describe("Create Bounty", function () {
    it("Should create bounty with valid params", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;
      const reward = hre.ethers.parseEther("0.1");

      await expect(
        registry.connect(creator).createBounty("Title", "Desc", "QmSchema", deadline, 10, { value: reward })
      ).to.emit(registry, "BountyCreated").withArgs(0, creator.address, reward, "QmSchema", deadline);

      const bounty = await registry.getBounty(0);
      expect(bounty.creator).to.equal(creator.address);
      expect(bounty.status).to.equal(1); // ACTIVE
    });

    it("Should revert with insufficient reward", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await expect(
        registry.connect(creator).createBounty("Title", "Desc", "QmSchema", deadline, 10,
          { value: hre.ethers.parseEther("0.005") })
      ).to.be.revertedWithCustomError(registry, "InsufficientReward");
    });

    it("Should revert with past deadline", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const pastDeadline = (await time.latest()) - 1;

      await expect(
        registry.connect(creator).createBounty("Title", "Desc", "QmSchema", pastDeadline, 10,
          { value: hre.ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(registry, "InvalidDeadline");
    });

    it("Should revert with zero max submissions", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await expect(
        registry.connect(creator).createBounty("Title", "Desc", "QmSchema", deadline, 0,
          { value: hre.ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(registry, "InvalidStatus");
    });
  });

  describe("Cancel Bounty", function () {
    it("Should cancel and refund creator", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;
      const reward = hre.ethers.parseEther("0.1");

      await registry.connect(creator).createBounty("Title", "Desc", "QmSchema", deadline, 10, { value: reward });

      await expect(registry.connect(creator).cancelBounty(0))
        .to.emit(registry, "BountyCancelled")
        .withArgs(0, creator.address);

      await expect(registry.connect(creator).cancelBounty(0))
        .to.be.revertedWithCustomError(registry, "InvalidStatus");

      const bounty = await registry.getBounty(0);
      expect(bounty.status).to.equal(3); // CANCELLED
    });

    it("Should revert if not creator", async function () {
      const { registry, creator, user } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry.connect(creator).createBounty("Title", "Desc", "QmSchema", deadline, 10,
        { value: hre.ethers.parseEther("0.1") });

      await expect(
        registry.connect(user).cancelBounty(0)
      ).to.be.revertedWithCustomError(registry, "Unauthorized");
    });
  });

  describe("Complete Bounty", function () {
    it("Should complete bounty", async function () {
      const { registry, creator, user } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry.connect(creator).createBounty("Title", "Desc", "QmSchema", deadline, 10,
        { value: hre.ethers.parseEther("0.1") });

      await expect(registry.completeBounty(0, user.address, "QmData"))
        .to.emit(registry, "BountyCompleted")
        .withArgs(0, user.address, "QmData");

      const bounty = await registry.getBounty(0);
      expect(bounty.status).to.equal(2); // COMPLETED
    });
  });

  describe("Increment Submissions", function () {
    it("Should increment submission count", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry.connect(creator).createBounty("Title", "Desc", "QmSchema", deadline, 3,
        { value: hre.ethers.parseEther("0.1") });

      await expect(registry.incrementSubmissions(0))
        .to.emit(registry, "SubmissionIncremented")
        .withArgs(0, 1);

      const bounty = await registry.getBounty(0);
      expect(bounty.submissionCount).to.equal(1);
    });

    it("Should revert when max reached", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry.connect(creator).createBounty("Title", "Desc", "QmSchema", deadline, 2,
        { value: hre.ethers.parseEther("0.1") });

      await registry.incrementSubmissions(0);
      await registry.incrementSubmissions(0);

      await expect(registry.incrementSubmissions(0))
        .to.be.revertedWithCustomError(registry, "MaxSubmissionsReached");
    });
  });

  describe("View Functions", function () {
    it("Should check if bounty is active", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry.connect(creator).createBounty("Title", "Desc", "QmSchema", deadline, 10,
        { value: hre.ethers.parseEther("0.1") });

      expect(await registry.isBountyActive(0)).to.be.true;

      await registry.connect(creator).cancelBounty(0);
      expect(await registry.isBountyActive(0)).to.be.false;
    });

    it("Should get bounties by creator", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry.connect(creator).createBounty("Title 1", "Desc", "QmSchema", deadline, 10,
        { value: hre.ethers.parseEther("0.1") });
      await registry.connect(creator).createBounty("Title 2", "Desc", "QmSchema", deadline, 10,
        { value: hre.ethers.parseEther("0.1") });

      const bounties = await registry.getBountiesByCreator(creator.address);
      expect(bounties.length).to.equal(2);
      expect(bounties[0]).to.equal(0);
      expect(bounties[1]).to.equal(1);
    });
  });
});
