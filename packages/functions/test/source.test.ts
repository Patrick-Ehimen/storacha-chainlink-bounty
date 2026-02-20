import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  simulateScript,
  decodeResult,
  ReturnType,
} from "@chainlink/functions-toolkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_PATH = join(__dirname, "..", "src", "source.js");
const source = readFileSync(SOURCE_PATH, "utf-8");

describe("Verification Source", () => {
  it("should load the source file", () => {
    expect(source).toBeDefined();
    expect(source.length).toBeGreaterThan(0);
    expect(source).toContain("Functions.encodeUint256");
    expect(source).toContain("args[0]");
    expect(source).toContain("args[1]");
  });

  it("should return 0 for missing arguments", async () => {
    const result = await simulateScript({
      source,
      args: [],
      maxOnChainResponseBytes: 256,
      maxExecutionTimeMs: 10_000,
      numAllowedQueries: 5,
    });

    expect(result.errorString).toBeFalsy();
    expect(result.responseBytesHexstring).toBeDefined();

    const decoded = decodeResult(
      result.responseBytesHexstring!,
      ReturnType.uint256,
    );
    expect(BigInt(decoded)).toBe(0n);
  });

  it("should return 0 for stub (placeholder logic)", async () => {
    const result = await simulateScript({
      source,
      args: ["bafyTestDataCid", "bafyTestSchemaCid"],
      maxOnChainResponseBytes: 256,
      maxExecutionTimeMs: 10_000,
      numAllowedQueries: 5,
    });

    expect(result.errorString).toBeFalsy();
    expect(result.responseBytesHexstring).toBeDefined();

    const decoded = decodeResult(
      result.responseBytesHexstring!,
      ReturnType.uint256,
    );
    // Stub always returns 0
    expect(BigInt(decoded)).toBe(0n);
  });
});
