"use client";

import { useEffect } from "react";
import { DOCS_URL } from "@/lib/utils";

export default function DeveloperDocsPage() {
  useEffect(() => {
    // Open external docs URL in new tab
    window.open(DOCS_URL, "_blank", "noopener,noreferrer");
    // Redirect back to developer dashboard
    window.location.href = "/developer";
  }, []);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-text-secondary">Opening documentation in new tab...</p>
      </div>
    </div>
  );
}
