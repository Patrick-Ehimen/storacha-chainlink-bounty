// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IDataRegistry {
    function handleVerificationResult(
        uint256 submissionId,
        bool verified,
        bytes memory data
    ) external;
}

/**
 * @title FunctionsConsumer
 * @notice Integrates Chainlink Functions for data verification
 * @dev Requests off-chain computation and returns results to DataRegistry
 */
contract FunctionsConsumer is FunctionsClient, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    // Chainlink Functions configuration
    uint64 public subscriptionId;
    uint32 public gasLimit;
    bytes32 public donId;

    // JavaScript source code for verification
    string public verificationSource;

    // Data registry contract
    IDataRegistry public dataRegistry;

    // Mapping: requestId => submissionId
    mapping(bytes32 => uint256) public requestIdToSubmission;

    // Events
    event VerificationRequested(
        uint256 indexed submissionId,
        bytes32 indexed requestId,
        string cid
    );

    event VerificationFulfilled(
        bytes32 indexed requestId,
        uint256 indexed submissionId,
        bool verified
    );

    event ConfigUpdated(
        uint64 subscriptionId,
        uint32 gasLimit,
        bytes32 donId
    );

    event VerificationSourceUpdated(string newSource);

    // Custom errors
    error UnexpectedRequestID(bytes32 requestId);
    error InvalidArguments();

    /**
     * @notice Constructor
     * @param router Chainlink Functions router address
     * @param _subscriptionId Chainlink subscription ID
     * @param _gasLimit Gas limit for Functions callback
     * @param _donId Decentralized Oracle Network ID
     * @param _dataRegistry Address of DataRegistry contract
     */
    constructor(
        address router,
        uint64 _subscriptionId,
        uint32 _gasLimit,
        bytes32 _donId,
        address _dataRegistry
    ) FunctionsClient(router) Ownable(msg.sender) {
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
        donId = _donId;
        dataRegistry = IDataRegistry(_dataRegistry);
    }

    /**
     * @notice Request data verification via Chainlink Functions
     * @param submissionId ID of the submission to verify
     * @param cid IPFS CID of the data
     * @param schemaUri IPFS CID of the JSON Schema
     * @return requestId The Chainlink Functions request ID
     */
    function requestVerification(
        uint256 submissionId,
        string calldata cid,
        string calldata schemaUri
    ) external returns (bytes32) {
        if (bytes(cid).length == 0 || bytes(schemaUri).length == 0) {
            revert InvalidArguments();
        }

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(verificationSource);

        // Pass arguments to DON
        string[] memory args = new string[](2);
        args[0] = cid;
        args[1] = schemaUri;
        req.setArgs(args);

        // Send request to Chainlink DON
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );

        // Store mapping for callback
        requestIdToSubmission[requestId] = submissionId;

        emit VerificationRequested(submissionId, requestId, cid);

        return requestId;
    }

    /**
     * @notice Chainlink DON callback function
     * @param requestId The request ID
     * @param response The response from Functions
     * @param err Any errors from Functions
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        uint256 submissionId = requestIdToSubmission[requestId];

        if (submissionId == 0) {
            revert UnexpectedRequestID(requestId);
        }

        // Decode response (0 = rejected, 1 = verified)
        bool verified = false;
        if (response.length > 0 && err.length == 0) {
            uint256 result = abi.decode(response, (uint256));
            verified = (result == 1);
        }

        emit VerificationFulfilled(requestId, submissionId, verified);

        // Callback to DataRegistry with result
        dataRegistry.handleVerificationResult(submissionId, verified, response);

        // Cleanup mapping
        delete requestIdToSubmission[requestId];
    }

    /**
     * @notice Update verification source code (owner only)
     * @param newSource New JavaScript source code for verification
     */
    function updateVerificationSource(
        string calldata newSource
    ) external onlyOwner {
        verificationSource = newSource;
        emit VerificationSourceUpdated(newSource);
    }

    /**
     * @notice Update Chainlink Functions configuration (owner only)
     * @param _subscriptionId New subscription ID
     * @param _gasLimit New gas limit
     * @param _donId New DON ID
     */
    function updateConfig(
        uint64 _subscriptionId,
        uint32 _gasLimit,
        bytes32 _donId
    ) external onlyOwner {
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
        donId = _donId;

        emit ConfigUpdated(_subscriptionId, _gasLimit, _donId);
    }

    /**
     * @notice Update DataRegistry address (owner only)
     * @param _dataRegistry New DataRegistry address
     */
    function updateDataRegistry(address _dataRegistry) external onlyOwner {
        dataRegistry = IDataRegistry(_dataRegistry);
    }

    /**
     * @notice Get submission ID for a request ID
     * @param requestId The Chainlink Functions request ID
     * @return submissionId The corresponding submission ID
     */
    function getSubmissionId(
        bytes32 requestId
    ) external view returns (uint256) {
        return requestIdToSubmission[requestId];
    }
}
