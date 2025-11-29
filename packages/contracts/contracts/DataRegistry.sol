// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BountyRegistry.sol";

/**
 * @title DataRegistry
 * @notice Manages data submissions and verification results
 * @dev Tracks submissions, coordinates with Chainlink Functions, handles payments
 */
contract DataRegistry is Ownable, ReentrancyGuard {
    struct Submission {
        uint256 id;
        uint256 bountyId;
        address contributor;
        string cid; // IPFS CID of submitted data
        string metadata;
        SubmissionStatus status;
        uint256 submittedAt;
        uint256 verifiedAt;
    }

    enum SubmissionStatus {
        PENDING,
        VERIFYING,
        VERIFIED,
        REJECTED
    }

    // State variables
    uint256 private _submissionIdCounter;
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => uint256[]) public bountySubmissions; // bountyId => submissionIds

    // Contract references
    BountyRegistry public bountyRegistry;
    address public functionsConsumer;

    // Events
    event DataSubmitted(
        uint256 indexed submissionId,
        uint256 indexed bountyId,
        address indexed contributor,
        string cid
    );

    event VerificationRequested(
        uint256 indexed submissionId,
        uint256 indexed bountyId,
        string cid
    );

    event SubmissionVerified(
        uint256 indexed submissionId,
        uint256 indexed bountyId,
        address indexed contributor,
        bool accepted
    );

    event PaymentReleased(
        uint256 indexed submissionId,
        address indexed contributor,
        uint256 amount
    );

    // Custom errors
    error BountyNotActive();
    error InvalidCID();
    error SubmissionNotFound();
    error Unauthorized();
    error FunctionsConsumerNotSet();
    error InvalidStatus();
    error PaymentFailed();

    constructor(
        address _bountyRegistry,
        address _functionsConsumer
    ) Ownable(msg.sender) {
        bountyRegistry = BountyRegistry(_bountyRegistry);
        functionsConsumer = _functionsConsumer;
    }

    /**
     * @notice Submit data for a bounty
     * @param bountyId The ID of the bounty
     * @param cid IPFS CID of the submitted data
     * @param metadata Additional metadata (JSON string)
     * @return submissionId The ID of the created submission
     */
    function submitData(
        uint256 bountyId,
        string calldata cid,
        string calldata metadata
    ) external returns (uint256) {
        // Verify bounty is active
        if (!bountyRegistry.isBountyActive(bountyId)) {
            revert BountyNotActive();
        }

        // Validate CID
        if (bytes(cid).length == 0) revert InvalidCID();

        uint256 submissionId = _submissionIdCounter++;

        submissions[submissionId] = Submission({
            id: submissionId,
            bountyId: bountyId,
            contributor: msg.sender,
            cid: cid,
            metadata: metadata,
            status: SubmissionStatus.PENDING,
            submittedAt: block.timestamp,
            verifiedAt: 0
        });

        bountySubmissions[bountyId].push(submissionId);

        // Increment bounty submission count
        bountyRegistry.incrementSubmissions(bountyId);

        emit DataSubmitted(submissionId, bountyId, msg.sender, cid);

        // Auto-request verification
        _requestVerification(submissionId);

        return submissionId;
    }

    /**
     * @notice Internal function to request verification from Chainlink Functions
     * @param submissionId The ID of the submission
     */
    function _requestVerification(uint256 submissionId) internal {
        if (functionsConsumer == address(0)) revert FunctionsConsumerNotSet();

        Submission storage submission = submissions[submissionId];
        submission.status = SubmissionStatus.VERIFYING;

        BountyRegistry.Bounty memory bounty = bountyRegistry.getBounty(
            submission.bountyId
        );

        emit VerificationRequested(
            submissionId,
            submission.bountyId,
            submission.cid
        );

        // Note: In production, this would trigger Chainlink Functions request
        // For now, external call to FunctionsConsumer would happen here
    }

    /**
     * @notice Handle verification result from Chainlink Functions
     * @param submissionId The ID of the submission
     * @param verified Whether the data was verified
     * @param data Additional data from verification (optional)
     */
    function handleVerificationResult(
        uint256 submissionId,
        bool verified,
        bytes memory data
    ) external nonReentrant {
        // Only allow calls from FunctionsConsumer
        if (msg.sender != functionsConsumer) revert Unauthorized();

        Submission storage submission = submissions[submissionId];

        if (submission.contributor == address(0)) revert SubmissionNotFound();
        if (submission.status != SubmissionStatus.VERIFYING) {
            revert InvalidStatus();
        }

        submission.verifiedAt = block.timestamp;

        if (verified) {
            submission.status = SubmissionStatus.VERIFIED;

            // Get bounty details
            BountyRegistry.Bounty memory bounty = bountyRegistry.getBounty(
                submission.bountyId
            );

            // Mark bounty as completed
            bountyRegistry.completeBounty(
                submission.bountyId,
                submission.contributor,
                submission.cid
            );

            // Release payment to contributor
            _releasePayment(submissionId, bounty.reward);
        } else {
            submission.status = SubmissionStatus.REJECTED;
        }

        emit SubmissionVerified(
            submissionId,
            submission.bountyId,
            submission.contributor,
            verified
        );
    }

    /**
     * @notice Internal function to release payment to contributor
     * @param submissionId The ID of the submission
     * @param amount Amount to pay
     */
    function _releasePayment(uint256 submissionId, uint256 amount) internal {
        Submission storage submission = submissions[submissionId];

        // Transfer reward from BountyRegistry (it holds the funds)
        // In production, this would require BountyRegistry to have a withdrawal function
        // For now, we assume funds are held and transferred separately

        (bool success, ) = submission.contributor.call{value: amount}("");
        if (!success) revert PaymentFailed();

        emit PaymentReleased(submissionId, submission.contributor, amount);
    }

    /**
     * @notice Set the FunctionsConsumer address
     * @param _functionsConsumer Address of the FunctionsConsumer contract
     */
    function setFunctionsConsumer(address _functionsConsumer) external onlyOwner {
        functionsConsumer = _functionsConsumer;
    }

    /**
     * @notice Get submission details
     * @param submissionId The ID of the submission
     * @return Submission struct
     */
    function getSubmission(
        uint256 submissionId
    ) external view returns (Submission memory) {
        return submissions[submissionId];
    }

    /**
     * @notice Get all submissions for a bounty
     * @param bountyId The ID of the bounty
     * @return uint256[] Array of submission IDs
     */
    function getBountySubmissions(
        uint256 bountyId
    ) external view returns (uint256[] memory) {
        return bountySubmissions[bountyId];
    }

    /**
     * @notice Get submissions by contributor
     * @param contributor Address of the contributor
     * @return uint256[] Array of submission IDs
     */
    function getSubmissionsByContributor(
        address contributor
    ) external view returns (uint256[] memory) {
        uint256 count = 0;

        // First pass: count submissions
        for (uint256 i = 0; i < _submissionIdCounter; i++) {
            if (submissions[i].contributor == contributor) {
                count++;
            }
        }

        // Second pass: populate array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < _submissionIdCounter; i++) {
            if (submissions[i].contributor == contributor) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Get total number of submissions
     * @return uint256 Total submission count
     */
    function getTotalSubmissions() external view returns (uint256) {
        return _submissionIdCounter;
    }

    // Receive function to accept ETH for payments
    receive() external payable {}
}
