# Smart Contract Events

This document describes the events emitted by the smart contracts, useful for frontend applications and indexers.

## BountyRegistry.sol

### BountyCreated

Emitted when a new bounty is created.

```solidity
event BountyCreated(
    uint256 indexed id,
    address indexed creator,
    uint256 reward,
    string schemaUri,
    uint256 indexed deadline
);
```

- `id`: Unique identifier for the bounty.
- `creator`: Address of the user who created the bounty.
- `reward`: Amount of ETH (in wei) locked as reward.
- `schemaUri`: IPFS CID of the JSON schema describing the required data.
- `deadline`: Unix timestamp when the bounty expires.

### BountyCompleted

Emitted when a bounty is successfully completed and the winner is selected.

```solidity
event BountyCompleted(
    uint256 indexed id,
    address indexed winner,
    string cid
);
```

- `id`: Unique identifier for the bounty.
- `winner`: Address of the user who submitted the winning data.
- `cid`: IPFS CID of the winning submission.

### BountyCancelled

Emitted when a bounty is cancelled by the creator.

```solidity
event BountyCancelled(
    uint256 indexed id,
    address indexed creator
);
```

- `id`: Unique identifier for the bounty.
- `creator`: Address of the user who cancelled the bounty.

### BountyExpired

Emitted when a bounty expires (deadline passed) and funds are reclaimed.

```solidity
event BountyExpired(
    uint256 indexed id,
    address indexed creator,
    uint256 reward
);
```

- `id`: Unique identifier for the bounty.
- `creator`: Address of the bounty creator receiving the refund.
- `reward`: Amount of ETH (in wei) refunded to the creator.

### RewardIncreased

Emitted when the bounty reward is topped up.

```solidity
event RewardIncreased(
    uint256 indexed id,
    uint256 amountAdded,
    uint256 newReward
);
```

- `id`: Unique identifier for the bounty.
- `amountAdded`: The amount of ETH added to the reward.
- `newReward`: The total reward after the increase.

### DeadlineExtended

Emitted when the bounty deadline is extended.

```solidity
event DeadlineExtended(
    uint256 indexed id,
    uint256 newDeadline
);
```

- `id`: Unique identifier for the bounty.
- `newDeadline`: The new expiration timestamp.

### SubmissionIncremented

Emitted when a new submission is received (count updated).

```solidity
event SubmissionIncremented(
    uint256 indexed bountyId,
    uint256 newCount
);
```

- `bountyId`: Unique identifier for the bounty.
- `newCount`: The new total number of submissions.

## EscrowManager.sol

### FundsDeposited

Emitted when funds are deposited into escrow.

```solidity
event FundsDeposited(
    uint256 indexed bountyId,
    address indexed depositor,
    uint256 amount
);
```

### FundsReleased

Emitted when funds are released to a recipient.

```solidity
event FundsReleased(
    uint256 indexed bountyId,
    address indexed recipient,
    uint256 amount
);
```

### FundsRefunded

Emitted when funds are refunded to the depositor.

```solidity
event FundsRefunded(
    uint256 indexed bountyId,
    address indexed depositor,
    uint256 amount
);
```
