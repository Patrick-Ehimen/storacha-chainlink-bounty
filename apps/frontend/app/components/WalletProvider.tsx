"use client";

import { ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { mainnet, sepolia, polygon, arbitrum, base, optimism } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

// Configure chains - includes testnets and popular L2s for the bounty marketplace
const config = getDefaultConfig({
  appName: "Storacha × Chainlink Bounty",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo",
  chains: [mainnet, sepolia, polygon, arbitrum, base, optimism],
  ssr: true,
});

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Custom RainbowKit theme that matches our app
const customLightTheme = lightTheme({
  accentColor: "#6366f1",
  accentColorForeground: "white",
  borderRadius: "medium",
  fontStack: "system",
});

const customDarkTheme = darkTheme({
  accentColor: "#818cf8",
  accentColorForeground: "#18181b",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

// Hook to detect theme from system preference or DOM
function useDetectTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference
    const checkTheme = () => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
    };
    
    checkTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkTheme);

    return () => mediaQuery.removeEventListener("change", checkTheme);
  }, []);

  return isDark;
}

// Inner provider that detects theme
function WalletProviderInner({ children }: { children: ReactNode }) {
  const isDark = useDetectTheme();

  return (
    <RainbowKitProvider
      theme={isDark ? customDarkTheme : customLightTheme}
      modalSize="compact"
      appInfo={{
        appName: "Storacha × Chainlink Bounty",
        learnMoreUrl: "https://docs.storacha.network",
      }}
    >
      {children}
    </RainbowKitProvider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProviderInner>{children}</WalletProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
