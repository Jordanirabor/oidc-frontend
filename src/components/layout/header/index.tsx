"use client";

import { getCookie } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import ProfileView from "./profile-view";
import Link from "next/link";
import { cn } from "@/lib/utils";
interface Account {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  account_type?: string;
}
interface NavigationItem {
  name: string;
  href: string;
  current: boolean;
  external?: boolean;
}

interface HeaderProps {
  className?: string;
  navigation: NavigationItem[] | null;
}


export default function Header({ className, navigation }: HeaderProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadActiveAccount();
  }, []);

  const loadActiveAccount = async () => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/auth/accounts`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const activeAccount = data.accounts.find(
          (acc: Account) => acc.id === data.active_account_id
        );
        setAccount(activeAccount || data.accounts[0]);
      }
    } catch (err) {
      console.error("Failed to load account:", err);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
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
        body: JSON.stringify({ global: true }),
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.push("/auth");
    } catch (err) {
      toast.error("Failed to logout");
      setIsLoggingOut(false);
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <header
      className={` px-6 py-4 border-b border-slate-800 bg-bg-20 fixed top-0 left-0 right-0 z-50 ${className || ""
        }`}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Branding and user info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-fit h-10">
            <Image src="/consentkeys.svg" alt="ConsentKeys" width={120} height={40} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation */}
          {navigation && (
            <div className="items-center gap-5 font-mono text-sm text-text-secondary hidden md:flex">
              {navigation.map((item) =>
                item.external ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      item.current ? "text-primary-emphasis" : "text-text-secondary hover:text-primary-emphasis"
                    )}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      item.current ? "text-primary-emphasis" : "text-text-secondary hover:text-primary-emphasis"
                    )}
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>
          )}

          {/* Right side - Profile dropdown */}
          <ProfileView
            account={account}
            isLoading={isLoggingOut}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        </div>

      </div>
    </header>
  );
}
