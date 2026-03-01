"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AccountContextType {
  currentAccountId: string | null;
  setCurrentAccountId: (id: string) => void;
  isLoading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

interface AccountProviderProps {
  children: ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load the current account from the backend on mount
    const loadCurrentAccount = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const response = await fetch(`${backendUrl}/auth/accounts`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentAccountId(
            data.active_account_id || data.accounts[0]?.id || null
          );
        }
      } catch (err) {
        console.error("Failed to load current account:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentAccount();
  }, []);

  return (
    <AccountContext.Provider
      value={{ currentAccountId, setCurrentAccountId, isLoading }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
}

// Helper hook to add X-Account-ID header to fetch requests
export function useAuthFetch() {
  const { currentAccountId } = useAccount();

  return async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);

    if (currentAccountId) {
      headers.set("X-Account-ID", currentAccountId);
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };
}
