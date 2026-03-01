"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { handleApiError } from "@/lib/error-handling";
import Header from "@/components/layout/header";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Try to fetch clients - if this fails with 403, user is not admin
      // This is a proxy check since we don't have a dedicated /am-i-admin endpoint yet
      const response = await fetch("/api/clients?limit=1");
      
      if (handleApiError({ status: response.status }, router, "/admin")) {
        return;
      }
      
      setChecking(false);
    } catch (error) {
      console.error("Admin access check failed", error);
      // In case of error, we let the page load and let individual components handle specific errors
      // or we could be strict and redirect to dashboard
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: "Admin Dashboard",
      href: "/admin",
      current: pathname === "/admin",
    },
    {
      name: "Clients",
      href: "/admin/clients",
      current: pathname === "/admin/clients",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Header navigation={navigation} />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mt-20">{children}</main>
    </div>
  );
}
