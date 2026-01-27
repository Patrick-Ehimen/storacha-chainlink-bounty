/**
 * Types for the Storacha Bounty SDK
 */

/**
 * Content Identifier (CID) - a unique identifier for content on IPFS
 * This is a simplified interface compatible with multiformats CID
 */
export interface CID {
  /** CID version (0 or 1) */
  readonly version: 0 | 1;
  /** The multicodec code */
  readonly code: number;
  /** The multihash bytes */
  readonly multihash: {
    readonly code: number;
    readonly size: number;
    readonly digest: Uint8Array;
    readonly bytes: Uint8Array;
  };
  /** The raw bytes of the CID */
  readonly bytes: Uint8Array;
  /** Convert to string representation */
  toString(): string;
}

/**
 * Decentralized Identifier (DID) for spaces and agents
 */
export type DID = `did:${string}:${string}`;

/**
 * Email address type for authentication
 */
export type Email = `${string}@${string}`;

/**
 * Space information returned from Storacha
 */
export interface SpaceInfo {
  /** The DID of the space */
  did: DID;
  /** Human-readable name of the space */
  name?: string;
  /** Whether this is the current active space */
  isCurrentSpace: boolean;
}

/**
 * Account information after authentication
 */
export interface AccountInfo {
  /** The DID of the account */
  did: DID;
  /** The email associated with the account */
  email: Email;
}

/**
 * Upload result containing the CID and metadata
 */
export interface UploadResult {
  /** The root CID of the uploaded content */
  cid: CID;
  /** String representation of the CID */
  cidString: string;
  /** Size of the uploaded content in bytes */
  size?: number;
}

/**
 * Options for uploading files
 */
export interface UploadOptions {
  /** Callback when a shard is stored */
  onShardStored?: (meta: ShardMeta) => void;
  /** Optional name for the upload */
  name?: string;
}

/**
 * Metadata for uploaded shards
 */
export interface ShardMeta {
  /** CID of the shard */
  cid: CID;
  /** Size of the shard in bytes */
  size: number;
}

/**
 * Options for creating a space
 */
export interface CreateSpaceOptions {
  /** Name for the new space */
  name?: string;
}

/**
 * UCAN delegation capabilities
 */
export type Capability =
  | "blob/add"
  | "blob/remove"
  | "blob/list"
  | "upload/add"
  | "upload/remove"
  | "upload/list"
  | "space/info"
  | "store/add"
  | "store/remove"
  | "store/list"
  | "*";

/**
 * Options for creating a delegation
 */
export interface DelegationOptions {
  /** Capabilities to delegate */
  capabilities: Capability[];
  /** Expiration time in seconds from now (optional) */
  expiration?: number;
}

/**
 * Delegation result
 */
export interface DelegationResult {
  /** The delegation as a serialized archive */
  archive: Uint8Array;
  /** The delegation as a base64 string for easy transport */
  base64: string;
}

/**
 * Client configuration options
 */
export interface StorachaBountyClientConfig {
  /** Custom service URL (optional, defaults to Storacha) */
  serviceUrl?: string;
}

/**
 * Authorization status
 */
export interface AuthorizationStatus {
  /** Whether the client is authorized */
  isAuthorized: boolean;
  /** The account info if authorized */
  account?: AccountInfo;
  /** The current space if set */
  currentSpace?: SpaceInfo;
}

/**
 * File input type - can be a File, Blob, or a simple object with content
 */
export interface FileInput {
  /** The file content as a Blob or Uint8Array */
  content: Blob | Uint8Array;
  /** The file name */
  name: string;
  /** Optional MIME type */
  type?: string;
}
