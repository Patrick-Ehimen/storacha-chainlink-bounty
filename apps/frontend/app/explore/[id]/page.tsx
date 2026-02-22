"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import styles from "./page.module.css";
import { BOUNTY_REGISTRY_ABI } from "../../constants/abis";
import { BOUNTY_REGISTRY_ADDRESS } from "../../constants/contracts";

type Bounty = {
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

const formatDate = (timestamp: bigint) => {
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
};

const getBountyStatus = (status: number) => {
  const statuses = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"];
  return statuses[status] || "UNKNOWN";
};

export default function BountyDetailsPage() {
  const params = useParams<{ id: string }>();
  const idParam = params?.id;

  if (!idParam) {
    return (
      <main className={styles.main}>
        <h1>Bounty not found</h1>
        <Link href="/explore" className={styles.backLink}>
          ← Back to Explore
        </Link>
      </main>
    );
  }

  const bountyId = BigInt(idParam);

  const { data, isLoading } = useReadContract({
    address: BOUNTY_REGISTRY_ADDRESS,
    abi: BOUNTY_REGISTRY_ABI,
    functionName: "getBounty",
    args: [bountyId],
  });

  if (isLoading) {
    return (
      <main className={styles.main}>
        <p>Loading bounty...</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className={styles.main}>
        <h1>Bounty not found</h1>
        <Link href="/explore" className={styles.backLink}>
          ← Back to Explore
        </Link>
      </main>
    );
  }

  const bounty = data as Bounty;
  const status = getBountyStatus(bounty.status);
  const isClosed =
    status === "COMPLETED" || status === "CANCELLED" || status === "EXPIRED";

  const creatorShort = `${bounty.creator.substring(0, 6)}...${bounty.creator.substring(38)}`;

  return (
    <main className={styles.main}>
      <Link href="/explore" className={styles.backLink}>
        ← Back to Explore
      </Link>

      <div className={styles.content}>
        <div className={styles.bountyHeader}>
          <div>
            <div
              className={`${styles.status} ${
                isClosed ? styles.statusClosed : ""
              }`}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "currentColor",
                }}
              />
              <span style={{ textTransform: "capitalize" }}>
                {status.toLowerCase()}
              </span>
            </div>
            <h1 className={styles.bountyTitle}>{bounty.title}</h1>
            <div className={styles.meta}>
              <span>Created by {creatorShort}</span>
              <span>•</span>
              <span>{bounty.submissionCount.toString()} Submissions</span>
              <span>•</span>
              <span>Ends {formatDate(bounty.deadline)}</span>
            </div>
          </div>
          <div className={styles.reward}>{formatEther(bounty.reward)} ETH</div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Description</h3>
          <p className={styles.description}>{bounty.description}</p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Requirements</h3>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              No specific requirements listed.
            </li>
          </ul>
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryButton}>Submit Data</button>
          <button className={styles.secondaryButton}>Share Bounty</button>
        </div>
      </div>
    </main>
  );
}
