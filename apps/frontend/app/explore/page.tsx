"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { ThemeToggle } from "../components/ThemeToggle";
import { ConnectWallet } from "../components/ConnectWallet";
import { MOCK_BOUNTIES } from "../lib/mockData";

export default function ExplorePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.nav}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <h1 className={styles.title}>Storacha Bounty</h1>
          </Link>
        </div>
        <div className={styles.nav}>
          <ThemeToggle />
          <ConnectWallet />
        </div>
      </header>

      <main className={styles.main}>
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "12px" }}>
            Explore Bounties
          </h2>
          <p style={{ color: "var(--muted)" }}>
            Discover and contribute to data bounties. Earn rewards for valid
            data submissions.
          </p>
        </div>

        <div className={styles.grid}>
          {MOCK_BOUNTIES.map((bounty) => (
            <div key={bounty.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.bountyTitle}>{bounty.title}</h3>
                <span className={styles.reward}>{bounty.reward}</span>
              </div>

              <p className={styles.description}>{bounty.description}</p>

              <div className={styles.footer}>
                <div
                  className={`${styles.status} ${bounty.status === "closed" ? styles.closed : ""}`}
                >
                  <span className={styles.statusDot} />
                  <span style={{ textTransform: "capitalize" }}>
                    {bounty.status}
                  </span>
                </div>
                <span>{bounty.participants} Contributors</span>
              </div>

              <Link
                href={`/explore/${bounty.id}`}
                className={styles.button}
                style={{
                  textDecoration: "none",
                  display: "inline-block",
                  textAlign: "center",
                }}
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
