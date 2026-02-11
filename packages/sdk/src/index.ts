/**
 * @storacha-chainlink/sdk
 *
 * TypeScript SDK for Storacha integration with the data bounty marketplace.
 * Provides a simplified interface for uploading data, managing spaces,
 * and handling UCAN delegations.
 *
 * @example
 * ```typescript
 * import { StorachaBountyClient } from '@storacha-chainlink/sdk';
 *
 * // Create and authorize client
 * const client = await StorachaBountyClient.create();
 * await client.authorize('user@example.com');
 *
 * // Create a space and upload data
 * const space = await client.createSpace({ name: 'my-bounty' });
 * const result = await client.uploadJSON({ bountyId: 1, data: myData });
 *
 * console.log('Uploaded to:', result.cidString);
 * console.log('Retrieve from:', client.getRetrievalUrl(result.cid));
 * ```
 *
 * @packageDocumentation
 */

// Main client export
export { StorachaBountyClient } from "./client.js";

// Type exports
export type {
  AccountInfo,
  AuthorizationStatus,
  Capability,
  CID,
  CreateSpaceOptions,
  DelegationOptions,
  DelegationResult,
  DID,
  Email,
  FileInput,
  ShardMeta,
  SpaceInfo,
  StorachaBountyClientConfig,
  UploadOptions,
  UploadResult,
} from "./types.js";
