"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastKind = "info" | "success" | "error";

type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  txHash?: `0x${string}`;
  chainId?: number;
};

type ToastContextValue = {
  addToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const explorerBaseUrls: Record<number, string> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  42161: "https://arbiscan.io",
  421614: "https://sepolia.arbiscan.io",
};

const getTxExplorerUrl = (chainId: number | undefined, hash: `0x${string}`) => {
  const base =
    (chainId && explorerBaseUrls[chainId]) ||
    explorerBaseUrls[11155111] ||
    "https://sepolia.etherscan.io";
  return `${base}/tx/${hash}`;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(1);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = nextIdRef.current++;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      addToast,
    }),
    [addToast],
  );

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    top: "1rem",
    right: "1rem",
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  };

  const getToastStyle = (kind: ToastKind): React.CSSProperties => {
    let background = "var(--card-bg)";
    let borderColor = "var(--border)";
    if (kind === "success") {
      background = "rgba(22, 163, 74, 0.1)";
      borderColor = "rgba(22, 163, 74, 0.7)";
    } else if (kind === "error") {
      background = "rgba(220, 38, 38, 0.1)";
      borderColor = "rgba(220, 38, 38, 0.7)";
    }
    return {
      minWidth: "260px",
      maxWidth: "360px",
      borderRadius: "0.75rem",
      border: `1px solid ${borderColor}`,
      background,
      padding: "0.9rem 1rem",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      boxShadow: "var(--card-shadow-hover)",
      color: "var(--foreground)",
      fontSize: "0.875rem",
    };
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 600,
    marginBottom: "0.25rem",
  };

  const descriptionStyle: React.CSSProperties = {
    margin: 0,
    marginBottom: "0.25rem",
    color: "var(--foreground-secondary)",
  };

  const linkStyle: React.CSSProperties = {
    fontSize: "0.8rem",
    textDecoration: "underline",
  };

  const closeButtonStyle: React.CSSProperties = {
    border: "none",
    background: "transparent",
    color: "var(--foreground-secondary)",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: 0,
    lineHeight: 1,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div style={containerStyle} aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <div key={toast.id} style={getToastStyle(toast.kind)}>
              <div style={{ flex: 1 }}>
                <div style={titleStyle}>{toast.title}</div>
                {toast.description && (
                  <p style={descriptionStyle}>{toast.description}</p>
                )}
                {toast.txHash && (
                  <a
                    href={getTxExplorerUrl(toast.chainId, toast.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    style={linkStyle}
                  >
                    View on block explorer
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                style={closeButtonStyle}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
