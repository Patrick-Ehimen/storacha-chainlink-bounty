import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("BountyRegistry Events & New Features", function () {
  async function deployFixture() {
    const [owner, creator, user] = await hre.ethers.getSigners();
    const BountyRegistry =
      await hre.ethers.getContractFactory("BountyRegistry");
    const registry = await BountyRegistry.deploy();
    return { registry, owner, creator, user };
  }

  describe("Increase Reward", function () {
    it("Should increase reward and emit event", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;
      const initialReward = hre.ethers.parseEther("0.1");
      const increaseAmount = hre.ethers.parseEther("0.05");

      await registry
        .connect(creator)
        .createBounty("Title", "Desc", "QmSchema", deadline, 10, {
          value: initialReward,
        });

      await expect(
        registry.connect(creator).increaseReward(0, { value: increaseAmount }),
      )
        .to.emit(registry, "RewardIncreased")
        .withArgs(0, increaseAmount, initialReward + increaseAmount);

      const bounty = await registry.getBounty(0);
      expect(bounty.reward).to.equal(initialReward + increaseAmount);
    });

    it("Should revert if bounty not active", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry
        .connect(creator)
        .createBounty("Title", "Desc", "QmSchema", deadline, 10, {
          value: hre.ethers.parseEther("0.1"),
        });
      await registry.connect(creator).cancelBounty(0);

      await expect(
        registry
          .connect(creator)
          .increaseReward(0, { value: hre.ethers.parseEther("0.1") }),
      ).to.be.revertedWithCustomError(registry, "InvalidStatus");
    });
  });

  describe("Extend Deadline", function () {
    it("Should extend deadline and emit event", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const initialDeadline = (await time.latest()) + 86400;
      const newDeadline = initialDeadline + 3600;

      await registry
        .connect(creator)
        .createBounty("Title", "Desc", "QmSchema", initialDeadline, 10, {
          value: hre.ethers.parseEther("0.1"),
        });

      await expect(registry.connect(creator).extendDeadline(0, newDeadline))
        .to.emit(registry, "DeadlineExtended")
        .withArgs(0, newDeadline);

      const bounty = await registry.getBounty(0);
      expect(bounty.deadline).to.equal(newDeadline);
    });

    it("Should revert if new deadline is not greater", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const initialDeadline = (await time.latest()) + 86400;

      await registry
        .connect(creator)
        .createBounty("Title", "Desc", "QmSchema", initialDeadline, 10, {
          value: hre.ethers.parseEther("0.1"),
        });

      await expect(
        registry.connect(creator).extendDeadline(0, initialDeadline),
      ).to.be.revertedWithCustomError(registry, "InvalidDeadline");
    });

    it("Should revert if not creator", async function () {
      const { registry, creator, user } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry
        .connect(creator)
        .createBounty("Title", "Desc", "QmSchema", deadline, 10, {
          value: hre.ethers.parseEther("0.1"),
        });

      await expect(
        registry.connect(user).extendDeadline(0, deadline + 100),
      ).to.be.revertedWithCustomError(registry, "Unauthorized");
    });
  });

  describe("Expire Bounty", function () {
    it("Should expire bounty, refund creator, and emit event", async function () {
      const { registry, creator, user } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;
      const reward = hre.ethers.parseEther("0.1");

      await registry
        .connect(creator)
        .createBounty("Title", "Desc", "QmSchema", deadline, 10, {
          value: reward,
        });

      // Move time past deadline
      await time.increaseTo(deadline + 1);

      // Anyone can call expire
      const tx = registry.connect(user).expireBounty(0);

      await expect(tx).to.emit(registry, "BountyExpired").withArgs(0);

      await expect(tx).to.changeEtherBalances(
        [creator, registry],
        [reward, -reward],
      );

      const bounty = await registry.getBounty(0);
      expect(bounty.status).to.equal(4); // EXPIRED
    });

    it("Should revert if deadline not reached", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry
        .connect(creator)
        .createBounty("Title", "Desc", "QmSchema", deadline, 10, {
          value: hre.ethers.parseEther("0.1"),
        });

      await expect(
        registry.connect(creator).expireBounty(0),
      ).to.be.revertedWithCustomError(registry, "InvalidDeadline");
    });

    it("Should revert if already cancelled/expired/completed", async function () {
      const { registry, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await registry
        .connect(creator)
        .createBounty("Title", "Desc", "QmSchema", deadline, 10, {
          value: hre.ethers.parseEther("0.1"),
        });
      await registry.connect(creator).cancelBounty(0);

      await time.increaseTo(deadline + 1);

      await expect(
        registry.connect(creator).expireBounty(0),
      ).to.be.revertedWithCustomError(registry, "InvalidStatus");
    });
  });
});
