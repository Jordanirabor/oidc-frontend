"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/header";
import { DOCS_URL } from "@/lib/utils";

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      current: pathname === "/dashboard",
    },
    {
      name: "Developer Console",
      href: "/developer",
      current: pathname === "/developer",
    },
    {
      name: "Applications",
      href: "/developer/apps",
      current: pathname === "/developer/apps",
    },
    {
      name: "Docs",
      href: DOCS_URL,
      current: false, // External link, so never current
      external: true, // Flag to indicate external link
    },
  ];

  return (
    <div className="min-h-screen bg-bg-10">
      <Header navigation={navigation} />
      <main className="max-w-7xl mx-auto py-6 px-4 mt-20">{children}</main>
    </div>
  );
}
