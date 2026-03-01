"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, LogOut, Plus, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Account {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
}

interface AccountsData {
  browser_id: string;
  active_account_id: string;
  accounts: Account[];
}

interface AccountSwitcherProps {
  className?: string;
  onAccountSwitch?: (accountId: string) => void;
}

export function AccountSwitcher({
  className,
  onAccountSwitch,
}: AccountSwitcherProps) {
  const [accountsData, setAccountsData] = useState<AccountsData | null>(null);
  const [currentAccountId, setCurrentAccountId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/auth/accounts`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAccountsData(data);
        setCurrentAccountId(
          data.active_account_id || data.accounts[0]?.id || ""
        );
      }
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSwitch = (accountId: string) => {
    setCurrentAccountId(accountId);

    // Update the active account in the store/context
    if (onAccountSwitch) {
      onAccountSwitch(accountId);
    }

    // Optionally refresh the page or notify other components
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      await fetch(`${backendUrl}/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ global: true }),
      });

      router.push("/auth");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || !accountsData) {
    return (
      <div className={className}>
        <Avatar className="h-8 w-8 animate-pulse">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  const currentAccount = accountsData.accounts.find(
    (acc) => acc.id === currentAccountId
  );

  if (!currentAccount) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`relative h-8 w-8 rounded-full ${className}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={currentAccount.avatar_url}
              alt={currentAccount.display_name}
            />
            <AvatarFallback>
              {getInitials(currentAccount.display_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {currentAccount.display_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentAccount.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {accountsData.accounts.length > 1 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch account
            </DropdownMenuLabel>
            {accountsData.accounts.map((account) => (
              <DropdownMenuItem
                key={account.id}
                onClick={() => handleAccountSwitch(account.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={account.avatar_url}
                      alt={account.display_name}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(account.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm">{account.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.email}
                    </p>
                  </div>
                  {account.id === currentAccountId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => router.push("/auth?prompt=login")}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add account
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Manage accounts
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out all accounts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
