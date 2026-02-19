// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EscrowManager
 * @notice Manages secure fund escrow for data bounties
 * @dev Handles deposits, withdrawals, and refunds with role-based access control
 */
contract EscrowManager is AccessControl, ReentrancyGuard {
    // Escrow record for each bounty
    struct Escrow {
        uint256 bountyId;
        address depositor;
        uint256 amount;
        EscrowStatus status;
        uint256 createdAt;
        uint256 releasedAt;
    }

    enum EscrowStatus {
        NONE,
        FUNDED,
        RELEASED,
        REFUNDED
    }

    // State variables
    mapping(uint256 => Escrow) public escrows; // bountyId => Escrow
    uint256 public totalDeposits;
    uint256 public totalReleased;
    uint256 public totalRefunded;

    // Roles
    bytes32 public constant BOUNTY_REGISTRY_ROLE = keccak256("BOUNTY_REGISTRY_ROLE");
    bytes32 public constant DATA_REGISTRY_ROLE = keccak256("DATA_REGISTRY_ROLE");
    bytes32 public constant ESCROW_MANAGER_ROLE = keccak256("ESCROW_MANAGER_ROLE");

    // Events
    event FundsDeposited(
        uint256 indexed bountyId,
        address indexed depositor,
        uint256 amount
    );

    event FundsReleased(
        uint256 indexed bountyId,
        address indexed recipient,
        uint256 amount
    );

    event FundsRefunded(
        uint256 indexed bountyId,
        address indexed depositor,
        uint256 amount
    );

    // Custom errors
    error Unauthorized();
    error InvalidAmount();
    error InvalidBountyId();
    error EscrowNotFound();
    error EscrowAlreadyExists();
    error InvalidEscrowStatus();
    error TransferFailed();
    error InvalidAddress();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============ Core Functions ============

    /**
     * @notice Deposit funds into escrow for a bounty
     * @dev Called by BountyRegistry when a bounty is created
     * @param bountyId The ID of the bounty
     * @param depositor The address of the bounty creator
     */
    function deposit(
        uint256 bountyId,
        address depositor
    ) external payable onlyRole(BOUNTY_REGISTRY_ROLE) {
        if (msg.value == 0) revert InvalidAmount();
        if (depositor == address(0)) revert InvalidAddress();
        if (escrows[bountyId].status != EscrowStatus.NONE) {
            revert EscrowAlreadyExists();
        }

        escrows[bountyId] = Escrow({
            bountyId: bountyId,
            depositor: depositor,
            amount: msg.value,
            status: EscrowStatus.FUNDED,
            createdAt: block.timestamp,
            releasedAt: 0
        });

        totalDeposits += msg.value;

        emit FundsDeposited(bountyId, depositor, msg.value);
    }

    /**
     * @notice Increase existing escrow amount
     * @dev Called by BountyRegistry when reward is increased
     * @param bountyId The ID of the bounty
     * @param depositor The address of the depositor
     */
    function increaseDeposit(
        uint256 bountyId,
        address depositor
    ) external payable onlyRole(BOUNTY_REGISTRY_ROLE) {
        if (msg.value == 0) revert InvalidAmount();
        
        Escrow storage escrow = escrows[bountyId];
        if (escrow.status != EscrowStatus.FUNDED) {
            revert InvalidEscrowStatus();
        }

        escrow.amount += msg.value;
        totalDeposits += msg.value;

        emit FundsDeposited(bountyId, depositor, msg.value);
    }

    /**
     * @notice Release escrowed funds to a verified contributor
     * @dev Called by DataRegistry when a submission is verified
     * @param bountyId The ID of the bounty
     * @param recipient The address to receive the funds
     */
    function release(
        uint256 bountyId,
        address recipient
    ) external nonReentrant onlyRole(DATA_REGISTRY_ROLE) {
        if (recipient == address(0)) revert InvalidAddress();

        Escrow storage escrow = escrows[bountyId];

        if (escrow.status != EscrowStatus.FUNDED) {
            revert InvalidEscrowStatus();
        }

        uint256 amount = escrow.amount;
        escrow.status = EscrowStatus.RELEASED;
        escrow.releasedAt = block.timestamp;

        totalReleased += amount;

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit FundsReleased(bountyId, recipient, amount);
    }

    /**
     * @notice Refund escrowed funds to the bounty creator
     * @dev Called by BountyRegistry when a bounty is cancelled
     * @param bountyId The ID of the bounty
     */
    function refund(uint256 bountyId) external nonReentrant onlyRole(BOUNTY_REGISTRY_ROLE) {
        Escrow storage escrow = escrows[bountyId];

        if (escrow.status != EscrowStatus.FUNDED) {
            revert InvalidEscrowStatus();
        }

        uint256 amount = escrow.amount;
        address depositor = escrow.depositor;

        escrow.status = EscrowStatus.REFUNDED;
        escrow.releasedAt = block.timestamp;

        totalRefunded += amount;

        (bool success, ) = depositor.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit FundsRefunded(bountyId, depositor, amount);
    }

    /**
     * @notice Emergency withdrawal by owner (for stuck funds recovery)
     * @dev Only callable by owner, should only be used in emergencies
     * @param bountyId The ID of the bounty
     * @param recipient The address to receive the funds
     */
    function emergencyWithdraw(
        uint256 bountyId,
        address recipient
    ) external nonReentrant onlyRole(ESCROW_MANAGER_ROLE) {
        if (recipient == address(0)) revert InvalidAddress();

        Escrow storage escrow = escrows[bountyId];

        if (escrow.status != EscrowStatus.FUNDED) {
            revert InvalidEscrowStatus();
        }

        uint256 amount = escrow.amount;
        escrow.status = EscrowStatus.REFUNDED;
        escrow.releasedAt = block.timestamp;

        totalRefunded += amount;

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit FundsRefunded(bountyId, recipient, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get escrow details for a bounty
     * @param bountyId The ID of the bounty
     * @return Escrow struct containing escrow information
     */
    function getEscrow(uint256 bountyId) external view returns (Escrow memory) {
        return escrows[bountyId];
    }

    /**
     * @notice Check if escrow exists and is funded for a bounty
     * @param bountyId The ID of the bounty
     * @return bool True if escrow is funded
     */
    function isEscrowFunded(uint256 bountyId) external view returns (bool) {
        return escrows[bountyId].status == EscrowStatus.FUNDED;
    }

    /**
     * @notice Get the escrowed amount for a bounty
     * @param bountyId The ID of the bounty
     * @return uint256 The escrowed amount (0 if not funded)
     */
    function getEscrowAmount(uint256 bountyId) external view returns (uint256) {
        Escrow storage escrow = escrows[bountyId];
        if (escrow.status == EscrowStatus.FUNDED) {
            return escrow.amount;
        }
        return 0;
    }

    /**
     * @notice Get the total balance held in escrow
     * @return uint256 Total contract balance
     */
    function getTotalBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get escrow statistics
     * @return deposits Total amount ever deposited
     * @return released Total amount released to contributors
     * @return refunded Total amount refunded to creators
     * @return currentBalance Current contract balance
     */
    function getStats()
        external
        view
        returns (
            uint256 deposits,
            uint256 released,
            uint256 refunded,
            uint256 currentBalance
        )
    {
        return (totalDeposits, totalReleased, totalRefunded, address(this).balance);
    }

    // ============ Receive Function ============

    /**
     * @notice Reject direct ETH transfers
     * @dev All deposits must go through the deposit() function
     */
    receive() external payable {
        revert("Use deposit() function");
    }
}
