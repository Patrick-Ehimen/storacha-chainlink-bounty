"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import styles from "./page.module.css";
import { BOUNTY_REGISTRY_ABI } from "../constants/abis";
import { BOUNTY_REGISTRY_ADDRESS } from "../constants/contracts";

const formatDate = (timestamp: bigint) => {
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
};

const getBountyStatus = (status: number) => {
  const statuses = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"];
  return statuses[status] || "UNKNOWN";
};

export default function ExplorePage() {
  const { data: totalBounties, isLoading: isLoadingTotalBounties } =
    useReadContract({
      address: BOUNTY_REGISTRY_ADDRESS,
      abi: BOUNTY_REGISTRY_ABI,
      functionName: "getTotalBounties",
    });

  const bountyIds = useMemo(() => {
    if (!totalBounties || totalBounties === 0n) return [];
    const count = Number(totalBounties);
    return Array.from({ length: count }, (_, i) => BigInt(i));
  }, [totalBounties]);

  const { data: bounties, isLoading: isLoadingBounties } = useReadContracts({
    contracts: bountyIds.map((id) => ({
      address: BOUNTY_REGISTRY_ADDRESS,
      abi: BOUNTY_REGISTRY_ABI,
      functionName: "getBounty",
      args: [id],
    })),
  });

  const isLoading = isLoadingTotalBounties || isLoadingBounties;

  const hasNoBounties =
    !isLoading &&
    (!totalBounties || totalBounties === 0n || bountyIds.length === 0);

  return (
    <main className={styles.main}>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "12px" }}>
          Explore Bounties
        </h2>
        <p style={{ color: "var(--muted)" }}>
          Discover and contribute to data bounties. Earn rewards for valid data
          submissions.
        </p>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${styles.card} ${styles.skeleton}`} />
          ))}
        </div>
      ) : hasNoBounties ? (
        <div className={styles.emptyState}>
          <h3>No bounties available yet</h3>
          <p>
            Check back later or create a new bounty to kickstart the
            marketplace.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {bounties?.map((result, index) => {
            if (!result.result) return null;
            const bounty = result.result as unknown as {
              id: bigint;
              creator: `0x${string}`;
              title: string;
              description: string;
              schemaUri: string;
              reward: bigint;
              deadline: bigint;
              status: number;
              maxSubmissions: bigint;
              submissionCount: bigint;
              createdAt: bigint;
            };
            const status = getBountyStatus(bounty.status);
            const isClosed =
              status === "COMPLETED" ||
              status === "CANCELLED" ||
              status === "EXPIRED";

            return (
              <div key={index} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.bountyTitle}>
                    #{bounty.id.toString()} {bounty.title}
                  </h3>
                  <span className={styles.reward}>
                    {formatEther(bounty.reward)} ETH
                  </span>
                </div>

                <p className={styles.description}>{bounty.description}</p>

                <div
                  style={{
                    marginTop: "1rem",
                    fontSize: "0.875rem",
                    color: "var(--muted)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span>Deadline: {formatDate(bounty.deadline)}</span>
                  <span>
                    Submissions: {bounty.submissionCount.toString()} /{" "}
                    {bounty.maxSubmissions.toString()}
                  </span>
                </div>

                <div className={styles.footer}>
                  <div
                    className={`${styles.status} ${
                      isClosed ? styles.statusClosed : ""
                    }`}
                  >
                    <span className={styles.statusDot} />
                    <span style={{ textTransform: "capitalize" }}>
                      {status.toLowerCase()}
                    </span>
                  </div>
                  <a
                    href={`/explore/${bounty.id.toString()}`}
                    className={styles.button}
                    style={{
                      textDecoration: "none",
                      display: "inline-block",
                      textAlign: "center",
                    }}
                  >
                    View Details
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
