"use client";

import { IdentityCard } from "@/components/ui/identity-card";
import { MappingArrow } from "@/components/ui/mapping-arrow";
import { Eye, Lock, UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Account {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  connected_apps: {
    client_id: string;
    client_name: string;
    last_used_at?: string;
    pseudonym?: {
      handle: string;
      name: string;
      fake_email: string;
      avatar_url: string;
    };
  }[];
}

interface AccountsData {
  browser_id: string;
  active_account_id: string;
  client_name?: string;
  accounts: Account[];
}

function AccountSelectContent() {
  const [loading, setLoading] = useState(true);
  const [accountsData, setAccountsData] = useState<AccountsData | null>(null);
  const [error, setError] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [hoveredAccountId, setHoveredAccountId] = useState<string>("");
  const [processingAccountId, setProcessingAccountId] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get OIDC params from URL
  const oidcParams = {
    response_type: searchParams.get("response_type"),
    client_id: searchParams.get("client_id"),
    redirect_uri: searchParams.get("redirect_uri"),
    scope: searchParams.get("scope"),
    state: searchParams.get("state"),
    nonce: searchParams.get("nonce"),
    code_challenge: searchParams.get("code_challenge"),
    code_challenge_method: searchParams.get("code_challenge_method"),
    prompt: searchParams.get("prompt"),
  };

  // Load accounts from backend
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      // Add client_id to the request if available
      const url = new URL(`${backendUrl}/auth/accounts`);
      if (oidcParams.client_id) {
        url.searchParams.set("client_id", oidcParams.client_id);
      }

      const response = await fetch(url.toString(), {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // No session, redirect to normal auth flow
          router.push(`/auth?${searchParams.toString()}`);
          return;
        }
        throw new Error("Failed to load accounts");
      }

      const data = await response.json();
      setAccountsData(data);

      // Set first account as selected by default
      if (data.accounts && data.accounts.length > 0) {
        setSelectedAccountId(data.accounts[0].id);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load accounts";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [oidcParams.client_id, router, searchParams]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Keyboard navigation and continue handler
  const handleContinue = useCallback(async () => {
    if (!selectedAccountId || processingAccountId) return;

    try {
      setProcessingAccountId(selectedAccountId);
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      // Call the select-account endpoint
      const requestBody: Record<string, string> = {
        accountId: selectedAccountId,
        client_id: oidcParams.client_id!,
        redirect_uri: oidcParams.redirect_uri!,
        scope: oidcParams.scope!,
      };

      // Only include optional params if they have values
      if (oidcParams.state) requestBody.state = oidcParams.state;
      if (oidcParams.nonce) requestBody.nonce = oidcParams.nonce;
      if (oidcParams.code_challenge)
        requestBody.code_challenge = oidcParams.code_challenge;
      if (oidcParams.code_challenge_method)
        requestBody.code_challenge_method = oidcParams.code_challenge_method;

      const response = await fetch(`${backendUrl}/auth/select-account`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Account-ID": selectedAccountId,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.error_description || "Failed to select account";
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Redirect to consent URL
      if (data.consentUrl) {
        window.location.href = data.consentUrl;
      } else {
        throw new Error("No consent URL returned");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to select account";
      setError(errorMessage);
      toast.error(errorMessage);
      setProcessingAccountId("");
    }
  }, [selectedAccountId, processingAccountId, oidcParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!accountsData?.accounts || processingAccountId) return;

      const currentIndex = accountsData.accounts.findIndex(
        (acc) => acc.id === selectedAccountId
      );

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          if (currentIndex < accountsData.accounts.length - 1) {
            setSelectedAccountId(accountsData.accounts[currentIndex + 1].id);
          }
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedAccountId(accountsData.accounts[currentIndex - 1].id);
          }
          break;
        case "Enter":
          e.preventDefault();
          handleContinue();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [accountsData, selectedAccountId, processingAccountId, handleContinue]);

  // Wrapper for double-click: select and continue
  const handleSelectAndContinue = (accountId: string) => {
    setSelectedAccountId(accountId);
    // Use setTimeout to ensure state update happens before continue
    setTimeout(() => handleContinue(), 0);
  };

  const handleAddNewAccount = () => {
    // Redirect to auth with prompt=login to force new login
    const authUrl = new URL("/auth", window.location.origin);
    Object.entries(oidcParams).forEach(([key, value]) => {
      if (value) authUrl.searchParams.set(key, value);
    });
    authUrl.searchParams.set("prompt", "login");
    router.push(authUrl.toString());
  };

  // Generate pseudonym for preview
  const getPseudonymForAccount = (account: Account) => {
    const connectedApp = account.connected_apps.find(
      (app) => app.client_id === oidcParams.client_id
    );

    // If pseudonym exists, use it
    if (connectedApp?.pseudonym) {
      return connectedApp.pseudonym;
    }

    // Generate a preview pseudonym
    const hash = account.id.slice(0, 5);
    return {
      handle: `user${hash}`,
      name: `User ${hash}`,
      fake_email: `user-${hash}@${oidcParams.client_id?.slice(
        3,
        8
      )}.example.services`,
      avatar_url: "",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#041323] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-emphasis"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#041323] flex items-center justify-center p-4">
        <div className="p-8 bg-[#0b1d2e] border-red-500/20 max-w-md w-full rounded-2xl border">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => loadAccounts()}
            className="w-full py-2 px-4 bg-primary-emphasis text-black font-medium rounded hover:bg-primary-foreground transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#041323] flex flex-col items-center justify-center p-4">
      {/* Main Container */}
      <div className="w-full max-w-[1027px] flex flex-col gap-4">
        {/* Outer Frame */}
        <div className="bg-[#1C2B3D] border border-[rgba(217,225,255,0.12)] rounded-2xl p-[1px]">
          {/* Inner Container */}
          <div className="bg-[#0A2541] rounded-2xl shadow-[0px_4px_4px_rgba(0,0,0,0.25)] relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Panel - You (Private Sign-in) */}
              <div className="px-4 sm:px-8 pt-8 pb-6 lg:border-r border-[rgba(42,52,80,0.4)] relative">
                {/* Header */}
                <div className="flex items-start gap-2 mb-6">
                  <div className="w-9 h-9 bg-[rgba(43,127,255,0.2)] border border-[#173B65] rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-white" strokeWidth={1.67} />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium leading-[30px] text-white">
                      You(Private Sign-in)
                    </h2>
                    <p className="text-sm leading-5 tracking-[-0.150391px] text-[rgba(217,225,255,0.8)]">
                      Used only to verify you. Never shared.
                    </p>
                  </div>
                </div>

                {/* Account Cards */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 max-h-[300px] sm:max-h-[350px] overflow-y-auto">
                    {accountsData?.accounts.map((account) => {
                      const isSelected = selectedAccountId === account.id;
                      const isHovered = hoveredAccountId === account.id;

                      return (
                        <div
                          key={account.id}
                          className={`relative transition-opacity duration-200 ${
                            isSelected || isHovered || !hoveredAccountId
                              ? "opacity-100"
                              : "opacity-50"
                          }`}
                          onMouseEnter={() => setHoveredAccountId(account.id)}
                          onMouseLeave={() => setHoveredAccountId("")}
                        >
                          <IdentityCard
                            name={account.display_name}
                            email={account.email}
                            avatarUrl={account.avatar_url}
                            isSelected={isSelected}
                            isPrivate={true}
                            onClick={() => {
                              setSelectedAccountId(account.id);
                            }}
                            onDoubleClick={() => {
                              if (!processingAccountId) {
                                handleSelectAndContinue(account.id);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[rgba(42,52,80,0.4)] my-1"></div>

                  {/* Add Another Account Button */}
                  <button
                    type="button"
                    onClick={handleAddNewAccount}
                    aria-label="Add another account"
                    className="w-full rounded-[14px] border border-[rgba(217,225,255,0.12)] bg-[rgba(18,55,91,0.5)] hover:bg-[rgba(18,55,91,0.7)] hover:border-[rgba(217,225,255,0.2)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2493FB]/50"
                  >
                    <div className="flex items-center gap-3 p-[17px]">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[rgba(43,127,255,0.3)] flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-[#51A2FF]" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-base font-medium leading-6 tracking-[-0.3125px] text-[rgba(121,139,178,0.85)]">
                          Use another account
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Right Panel - What the app sees */}
              <div className="px-4 sm:px-8 pt-8 pb-6 relative flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-2 mb-6">
                  <div className="w-9 h-9 bg-[rgba(43,127,255,0.2)] border border-[#173B65] rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-white" strokeWidth={1.67} />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium leading-[30px] text-white">
                      What the app sees
                    </h2>
                    <p className="text-sm leading-5 tracking-[-0.150391px] text-[rgba(217,225,255,0.8)]">
                      The only identity shared with this app
                    </p>
                  </div>
                </div>

                {/* Pseudonym Cards */}
                <div className="flex flex-col gap-3 max-h-[260px] sm:max-h-[320px] lg:max-h-[340px] overflow-y-auto flex-1">
                  {accountsData?.accounts.map((account) => {
                    const pseudonym = getPseudonymForAccount(account);
                    const isSelected = selectedAccountId === account.id;
                    const isHovered = hoveredAccountId === account.id;

                    return (
                      <div
                        key={account.id}
                        className={`transition-opacity duration-200 ${
                          isSelected || isHovered || !hoveredAccountId
                            ? "opacity-100"
                            : "opacity-50"
                        }`}
                        onMouseEnter={() => setHoveredAccountId(account.id)}
                        onMouseLeave={() => setHoveredAccountId("")}
                      >
                        <IdentityCard
                          name={pseudonym.name}
                          email={pseudonym.fake_email}
                          avatarUrl={pseudonym.avatar_url}
                          isSelected={isSelected}
                          isPrivate={false}
                          showInfoBadge={true}
                          onClick={() => {
                            setSelectedAccountId(account.id);
                          }}
                          onDoubleClick={() => {
                            if (!processingAccountId) {
                              handleSelectAndContinue(account.id);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Continue CTA (bottom-right) */}
                <div className="pt-4 mt-4 border-t border-[rgba(42,52,80,0.4)] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!selectedAccountId || !!processingAccountId}
                    aria-label="Continue with selected account"
                    aria-busy={!!processingAccountId}
                    className={[
                      "inline-flex items-center justify-center gap-2",
                      "h-10 px-6 rounded-lg",
                      "text-base font-medium",
                      "transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-[#2493FB]/50",
                      !selectedAccountId || !!processingAccountId
                        ? "bg-[rgba(43,127,255,0.18)] text-[rgba(217,225,255,0.5)] cursor-not-allowed"
                        : "bg-[#2493FB] text-white hover:bg-[#1c7ed6]",
                    ].join(" ")}
                  >
                    {processingAccountId ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Continuing…
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </div>
              </div>

              {/* Mapping Arrow - positioned at center, hidden on mobile/tablet */}
              <div className="hidden lg:block">
                <MappingArrow />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-1 px-4">
          <p className="text-xs sm:text-sm text-center tracking-[-0.150391px] text-[rgba(217,225,255,0.6)]">
            Your identity is protected. Each vendor sees a unique pseudonym and
            pseudo email.
          </p>
          <a
            href="#"
            className="text-xs sm:text-sm text-center tracking-[-0.150391px] text-[rgba(217,225,255,0.6)] hover:text-[rgba(217,225,255,0.8)] transition-colors"
          >
            Read our Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AccountSelectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#041323] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-emphasis"></div>
        </div>
      }
    >
      <AccountSelectContent />
    </Suspense>
  );
}
