"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface App {
  id: string;
  clientId: string;
  name: string;
  status: "pending" | "active" | "suspended" | "revoked";
  redirectUris: string[];
  scopes: string[];
  description?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
  analytics?: {
    totalRequests: number;
    requestsLast24h: number;
    successRate: number;
    lastUsed?: string;
  };
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export default function DeveloperAppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
    nextOffset: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [nameFilter, setNameFilter] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");

  const fetchApps = useCallback(
    async (offset = 0, limit = 20) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          includeAnalytics: "true",
        });

        if (statusFilter) params.append("status", statusFilter);
        if (nameFilter) params.append("name", nameFilter);

        const response = await fetch(`/api/developer/apps?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }

        const data = await response.json();
        setApps(data.clients || []);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, nameFilter]
  );

  // Debounce name input
  useEffect(() => {
    const timer = setTimeout(() => {
      setNameFilter(nameInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [nameInput]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "px-2 inline-flex text-xs leading-5 font-semibold rounded-none border";
    switch (status) {
      case "active":
        return `${baseClasses} bg-green-950/30 border-green-500/30 text-green-400`;
      case "pending":
        return `${baseClasses} bg-yellow-950/30 border-yellow-500/30 text-yellow-400`;
      case "suspended":
        return `${baseClasses} bg-red-950/30 border-red-500/30 text-red-400`;
      case "revoked":
        return `${baseClasses} bg-slate-950/30 border-slate-500/30 text-slate-400`;
      default:
        return `${baseClasses} bg-slate-950/30 border-slate-500/30 text-slate-400`;
    }
  };

  if (loading && apps.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 overflow-y-auto">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-text-secondary-50 font-mono">
            Your Applications
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Manage your applications and view their performance metrics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/developer/apps/new"
            className="inline-flex items-center justify-center border border-transparent bg-primary-emphasis px-4 py-2 text-sm font-medium text-secondary shadow-sm hover:bg-primary-emphasis/80 focus:outline-none focus:ring-2 focus:ring-primary-emphasis focus:ring-offset-2 sm:w-auto transition-all duration-300"
          >
            Create Application
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="status-filter"
            className="block text-sm font-medium text-slate-400 mb-1"
          >
            Status
          </label>
          <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full bg-card border-slate-800 text-slate-200 rounded-none">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-bg-20 border-slate-800 rounded-none">
              <SelectItem value="all" className="text-slate-200 cursor-pointer">
                All statuses
              </SelectItem>
              <SelectItem value="pending" className="text-slate-200 cursor-pointer">
                Pending
              </SelectItem>
              <SelectItem value="active" className="text-slate-200 cursor-pointer">
                Active
              </SelectItem>
              <SelectItem value="suspended" className="text-slate-200 cursor-pointer">
                Suspended
              </SelectItem>
              <SelectItem value="revoked" className="text-slate-200 cursor-pointer">
                Revoked
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label
            htmlFor="name-filter"
            className="block text-sm font-medium text-slate-400 mb-1"
          >
            Name
          </label>
          <input
            type="text"
            id="name-filter"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Search by name..."
            className="mt-1 block w-full rounded-none border border-slate-800 shadow-sm focus:border-primary focus:ring-primary/50 focus:ring-2 sm:text-sm px-3 py-2 text-slate-200 placeholder-slate-500 bg-card h-9 outline-none transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Applications Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <div
            key={app.id}
            className="bg-bg-20 overflow-hidden shadow rounded-none border border-slate-800 transition-all hover:border-slate-700"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1 mr-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-emphasis/20 border border-primary/30 rounded-none flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <h3 className="text-lg font-medium text-slate-100 truncate">
                      {app.name}
                    </h3>
                    <p
                      className="text-sm text-slate-400 font-mono truncate cursor-pointer hover:text-slate-300 transition-colors"
                      title={app.clientId}
                      onClick={() =>
                        navigator.clipboard.writeText(app.clientId)
                      }
                    >
                      {app.clientId.length > 20
                        ? `${app.clientId.substring(
                            0,
                            8
                          )}...${app.clientId.substring(
                            app.clientId.length - 8
                          )}`
                        : app.clientId}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={getStatusBadge(app.status)}>
                    {app.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 h-10">
                {app.description ? (
                  <p
                    className="text-sm text-slate-400 overflow-hidden leading-5"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      lineHeight: "1.25rem",
                      maxHeight: "2.5rem",
                    }}
                    title={app.description}
                  >
                    {app.description}
                  </p>
                ) : (
                  <div className="h-10"></div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Created {new Date(app.createdAt).toLocaleDateString()}
                </div>
                <Link
                  href={`/developer/apps/${app.id}`}
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  Manage
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {apps.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-text-primary">
            No applications
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Get started by creating your first OAuth application.
          </p>
          <div className="mt-6">
            <Link
              href="/developer/apps/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-secondary bg-primary-emphasis hover:bg-primary-emphasis/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-emphasis transition-all duration-300"
            >
              Create Application
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {pagination.offset + 1} to{" "}
            {Math.min(pagination.offset + pagination.limit, pagination.total)}{" "}
            of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                fetchApps(
                  Math.max(0, pagination.offset - pagination.limit),
                  pagination.limit
                )
              }
              disabled={pagination.offset === 0}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                fetchApps(pagination.nextOffset!, pagination.limit)
              }
              disabled={!pagination.hasMore}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
