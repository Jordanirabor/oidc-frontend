"use client";

import { ReferralCodeCard } from "@/components/referral-code-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useReferralCode } from "@/hooks/use-referral-code";
import { getCookie } from "@/lib/utils";
import { ExternalLink, LogOut, Plus, Shield, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Header from "@/components/layout/header";
import DeveloperBanner from "@/components/layout/developer/banner";

interface PseudonymInfo {
  handle: string;
  fake_email: string;
  name: string;
  avatar_url?: string;
}

interface ConnectedApp {
  client_id: string;
  client_name: string;
  last_used_at: string;
  revoked?: boolean;
  pseudonym: PseudonymInfo;
}

interface Account {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  connected_apps: ConnectedApp[];
}

interface AccountsOverview {
  browser_id: string;
  active_account_id: string;
  accounts: Account[];
}

export default function SessionsPage() {
  const [loading, setLoading] = useState(true);
  const [accountsData, setAccountsData] = useState<AccountsOverview | null>(
    null
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [hiddenRevokedApps, setHiddenRevokedApps] = useState<Set<string>>(
    new Set()
  );
  const router = useRouter();

  // Use the referral code hook
  const {
    referralCode,
    referralCreatedAt,
    isRegenerating,
    loadReferralCode,
    regenerateReferralCode,
  } = useReferralCode();

  useEffect(() => {
    loadAccounts();
  }, []);

  // Load referral code when selected account changes
  useEffect(() => {
    if (selectedAccountId) {
      loadReferralCode(selectedAccountId);
    }
  }, [selectedAccountId, loadReferralCode]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/auth/accounts`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push("/auth");
          // Do not set loading to false here
          return;
        }
        throw new Error("Failed to load accounts");
      }

      // Store CSRF token from response header
      const csrfToken = response.headers.get("X-CSRF-Token");
      if (csrfToken) {
        sessionStorage.setItem("csrf_token", csrfToken);
      }

      const data = await response.json();
      setAccountsData(data);
      setSelectedAccountId(
        data.active_account_id || data.accounts[0]?.id || ""
      );
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
      setLoading(false);
    }
  };

  const handleSetActiveAccount = async (accountId: string) => {
    // Optimistic: update selection immediately
    const previous = selectedAccountId;
    setSelectedAccountId(accountId);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${backendUrl}/auth/set-active-account`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle CSRF token errors by reloading to get fresh token
        if (
          response.status === 403 &&
          errorData.error === "invalid_csrf_token"
        ) {
          setError("Session expired. Refreshing page...");
          setTimeout(() => window.location.reload(), 1500);
          return;
        }

        throw new Error(
          errorData.error_description ||
          errorData.error ||
          "Failed to switch active account"
        );
      }

      // Refresh accounts so active badge updates from backend
      await loadAccounts();
    } catch (err) {
      // Revert selection if request failed
      setSelectedAccountId(previous);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to switch active account";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleLogout = async (accountId?: string, global?: boolean) => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${backendUrl}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "x-csrf-token": csrfToken }),
        },
        body: JSON.stringify({ accountId, global }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle CSRF token errors by reloading to get fresh token
        if (
          response.status === 403 &&
          errorData.error === "invalid_csrf_token"
        ) {
          setError("Session expired. Refreshing page...");
          setTimeout(() => window.location.reload(), 1500);
          return;
        }

        throw new Error("Logout failed");
      }

      if (global || accountsData?.accounts.length === 1) {
        router.push("/auth");
      } else {
        await loadAccounts();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDisconnectApp = async (accountId: string, clientId: string) => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${backendUrl}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Account-ID": accountId,
          ...(csrfToken && { "x-csrf-token": csrfToken }),
        },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle CSRF token errors by reloading to get fresh token
        if (
          response.status === 403 &&
          errorData.error === "invalid_csrf_token"
        ) {
          setError("Session expired. Refreshing page...");
          setTimeout(() => window.location.reload(), 1500);
          return;
        }

        throw new Error(
          errorData.error_description ||
          errorData.error ||
          "Failed to disconnect app"
        );
      }
      await loadAccounts();
      toast.success("App disconnected successfully");

      // Hide the revoked app after 3 seconds
      setTimeout(() => {
        setHiddenRevokedApps((prev) => new Set(prev).add(clientId));
      }, 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect app";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl mx-auto">
          <Card className="bg-bg-10 border-red-500/30 rounded-none py-8">
            <CardHeader>
              <CardTitle className="text-red-400">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">{error}</p>
              <Button
                onClick={() => loadAccounts()}
                variant="outline"
                className="border-slate-700 hover:bg-slate-800"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedAccount = accountsData?.accounts.find(
    (acc) => acc.id === selectedAccountId
  );

  return (
    <div className="min-h-screen bg-bg-10">
      <Header navigation={null} />
      <div className="w-full max-w-7xl mx-auto mt-20 px-6 lg:px-4">
        {/* Header */}
        <div className="py-6">
          <DeveloperBanner className="my-10" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
          {/* Left Column - Accounts and Connected Apps */}
          <div className="lg:col-span-2 space-y-10 order-2 lg:order-1">
            {/* Account List */}
            <Card className="bg-bg-20 border-slate-800 shadow-xl rounded-none">
              <CardHeader className="pb-4 px-6 pt-6">
                <CardTitle className="text-xl text-white font-mono">Accounts</CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  {accountsData?.accounts.length || 0} account
                  {accountsData?.accounts.length !== 1 ? "s" : ""} in this browser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6 pb-6">
                {accountsData?.accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleSetActiveAccount(account.id)}
                    className={`w-full flex items-center gap-3 p-4  border transition-all duration-200 cursor-pointer ${selectedAccountId === account.id
                      ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10"
                      : "bg-bg-10 border-slate-800 hover:bg-slate-900/50 hover:border-slate-600 hover:shadow-md"
                      }`}
                  >
                    <Avatar className="h-12 w-12 border-2 border-slate-700">
                      <AvatarImage
                        src={account.avatar_url}
                        alt={account.display_name}
                      />
                      <AvatarFallback className="bg-slate-800 text-white text-sm font-medium">
                        {getInitials(account.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-sm text-slate-100 truncate">
                        {account.display_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {account.email}
                      </p>
                    </div>
                    {account.id === accountsData?.active_account_id && (
                      <span className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                        Active
                      </span>
                    )}
                  </button>
                ))}

                <div className="mt-10 flex items-center justify-end gap-5">
                  <Button
                    onClick={() => router.push("/auth")}
                    variant="default"
                    className="w-auto h-12 font-semibold bg-primary-emphasis hover:bg-primary-emphasis/90 text-secondary-foreground rounded-none font-mono cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                  <Button
                    onClick={() => handleLogout(undefined, true)}
                    variant="destructive"
                    className="w-auto text-white h-12 font-semibold rounded-none font-mono cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Connected Apps Card */}
            {selectedAccount && (
              <Card className="bg-bg-20 border-slate-800 shadow-xl rounded-none">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-white text-xl font-mono">
                    Connected Apps
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    Applications using this identity with pseudonymous profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {selectedAccount.connected_apps.length === 0 ? (
                    <div className="border border-dashed border-slate-700 rounded-none px-6 py-12 text-center bg-bg-10">
                      <Shield className="w-10 h-10 mx-auto text-slate-500 mb-3" />
                      <p className="text-sm font-medium text-slate-200 mb-1">
                        No connected applications yet
                      </p>
                      <p className="text-xs text-slate-400">
                        When you connect this account to an app, it will appear
                        here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedAccount.connected_apps
                        .filter((app) => !hiddenRevokedApps.has(app.client_id))
                        .map((app) => (
                          <div
                            key={app.client_id}
                            className={`border rounded-none p-5 transition-all duration-200 ${app.revoked
                              ? "border-red-500/30 bg-red-950/20 opacity-60"
                              : "border-slate-800 bg-bg-10 hover:bg-slate-900/40 hover:border-primary/40"
                              }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold flex items-center gap-2 text-slate-100 text-base font-mono">
                                    {app.client_name}
                                    <ExternalLink className="w-4 h-4 text-slate-500" />
                                  </h4>
                                  {app.revoked && (
                                    <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/40 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                                      Revoked
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-400">
                                  Last used {formatDate(app.last_used_at)}
                                </p>
                                {app.revoked && (
                                  <p className="text-xs text-red-400 mt-1">
                                    Access has been revoked. This app can no
                                    longer access your data.
                                  </p>
                                )}
                              </div>
                              {!app.revoked && (
                                <Button
                                  onClick={() =>
                                    handleDisconnectApp(
                                      selectedAccount.id,
                                      app.client_id
                                    )
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 font-semibold rounded-none font-mono cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Revoke
                                </Button>
                              )}
                            </div>

                            <h4 className="text-xs text-slate-400 font-medium uppercase tracking-wider font-mono mt-8">
                              Pseudonymous Identity
                            </h4>
                            <div
                              className={`p-4 border mt-4 ${app.revoked
                                ? "bg-slate-900/40 border-slate-800/30"
                                : "bg-slate-900/70 border-slate-800/50"
                                }`}
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-100">
                                  {app.pseudonym.name}
                                </p>
                                <p className="text-xs text-slate-400 font-mono truncate">
                                  {app.pseudonym.fake_email}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Account Details */}
          {selectedAccount && (
            <div className="lg:col-span-1 space-y-10 order-1 lg:order-2">
              {/* Account Header Card */}
              <Card className="bg-bg-20 border-slate-800 shadow-xl rounded-none mb-0 lg:mb-10">
                <CardHeader className="pb-6 px-6 pt-6">
                  <div className="flex items-start justify-between flex-wrap gap-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-slate-700">
                        <AvatarImage
                          src={selectedAccount.avatar_url}
                          alt={selectedAccount.display_name}
                        />
                        <AvatarFallback className="bg-slate-800 text-white text-lg font-medium">
                          {getInitials(selectedAccount.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-2xl text-white mb-1">
                          {selectedAccount.display_name}
                        </CardTitle>
                        <CardDescription className="text-slate-300 text-base">
                          {selectedAccount.email}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center justify-end w-full">
                      <Button
                        onClick={() => handleLogout(selectedAccount.id)}
                        variant="destructive"
                        size="sm"
                        className="h-10 font-semibold rounded-none font-mono cursor-pointer text-white"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Referral Code - Desktop only (under account details) */}
              {referralCode && (
                <div className="hidden lg:block">
                  <ReferralCodeCard
                    code={referralCode}
                    createdAt={referralCreatedAt}
                    onRegenerate={() => regenerateReferralCode(selectedAccountId)}
                    isRegenerating={isRegenerating}
                    variant="dashboard"
                  />
                </div>
              )}
            </div>
          )}

          {/* Referral Code - Mobile only (at the bottom) */}
          {referralCode && (
            <div className="lg:hidden order-3">
              <ReferralCodeCard
                code={referralCode}
                createdAt={referralCreatedAt}
                onRegenerate={() => regenerateReferralCode(selectedAccountId)}
                isRegenerating={isRegenerating}
                variant="dashboard"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
