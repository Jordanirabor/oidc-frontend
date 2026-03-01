"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { handleApiError } from "@/lib/error-handling";
import { DOCS_URL } from "@/lib/utils";

interface DashboardStats {
  totalApps: number;
  activeApps: number;
  pendingApps: number;
  totalRequests: number;
  requestsLast24h: number;
  successRate: number;
}

interface RecentApp {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  lastUsed?: string;
}

export default function DeveloperDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, appsResponse] = await Promise.all([
        fetch("/api/developer/stats"),
        fetch("/api/developer/apps?limit=5"),
      ]);

      if (handleApiError({ status: statsResponse.status }, router, "/developer")) {
        return;
      }
      
      if (handleApiError({ status: appsResponse.status }, router, "/developer")) {
        return;
      }

      if (!statsResponse.ok || !appsResponse.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [statsData, appsData] = await Promise.all([
        statsResponse.json(),
        appsResponse.json(),
      ]);

      setStats(statsData);
      setRecentApps(appsData.clients || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white font-mono">
          Welcome to <span className="text-primary">Developer Console</span> 
        </h2>
        <p className="mt-2 text-lg text-text-secondary">
          Manage your applications and integrate privacy-focused
          authentication
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="bg-bg-20 overflow-hidden shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-white mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/developer/apps/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium shadow-sm text-secondary bg-primary-emphasis hover:bg-primary-emphasis/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Create New Application
              </Link>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300"
              >
                View Documentation
              </a>
              <Link
                href="/developer/apps"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300"
              >
                Manage Applications
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="mb-8">
          <h3 className="text-lg leading-6 text-primary font-semibold font-mono mb-4">
            Your Statistics
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-bg-20 overflow-hidden shadow rounded-none border border-slate-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-secondary-foreground"
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
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-400 truncate">
                        Total Applications
                      </dt>
                      <dd className="text-lg font-medium text-slate-100">
                        {stats.totalApps}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-20 overflow-hidden shadow rounded-none border border-slate-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-emerald-500 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-400 truncate">
                        Active Applications
                      </dt>
                      <dd className="text-lg font-medium text-slate-100">
                        {stats.activeApps}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-20 overflow-hidden shadow rounded-none border border-slate-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-400 truncate">
                        Pending Approval
                      </dt>
                      <dd className="text-lg font-medium text-slate-100">
                        {stats.pendingApps}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-20 overflow-hidden shadow rounded-none border border-slate-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-400 truncate">
                        API Requests (24h)
                      </dt>
                      <dd className="text-lg font-medium text-slate-100">
                        {stats.requestsLast24h.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-20 overflow-hidden shadow rounded-none border border-slate-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-400 truncate">
                        Success Rate
                      </dt>
                      <dd className="text-lg font-medium text-slate-100">
                        {stats.successRate.toFixed(1)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-20 overflow-hidden shadow rounded-none border border-slate-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-slate-500 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-400 truncate">
                        Total Requests
                      </dt>
                      <dd className="text-lg font-medium text-slate-100">
                        {stats.totalRequests.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Applications */}
      {recentApps.length > 0 && (
        <div className="mb-8">
          <div className="bg-bg-20 border border-slate-800 shadow overflow-hidden rounded-none">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
              <h3 className="text-lg leading-6 font-medium text-slate-100">
                Recent Applications
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Your most recently created applications
              </p>
            </div>
            <ul className="divide-y divide-slate-800">
              {recentApps.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/developer/apps/${app.id}`}
                    className="block hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
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
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-100">
                              {app.name}
                            </div>
                            <div className="text-sm text-slate-400">
                              Created{" "}
                              {new Date(app.createdAt).toLocaleDateString()}
                              {app.lastUsed && (
                                <span className="ml-2">
                                  • Last used{" "}
                                  {new Date(app.lastUsed).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-none border ${
                              app.status === "active"
                                ? "bg-green-950/30 border-green-500/30 text-green-400"
                                : app.status === "pending"
                                ? "bg-yellow-950/30 border-yellow-500/30 text-yellow-400"
                                : "bg-red-950/30 border-red-500/30 text-red-400"
                            }`}
                          >
                            {app.status}
                          </span>
                          <svg
                            className="ml-2 w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="bg-bg-10 border-t border-slate-800 px-4 py-3 sm:px-6">
              <div className="text-sm">
                <Link
                  href="/developer/apps"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View all applications →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started */}
      <div className="bg-bg-20 overflow-hidden shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">
            Getting Started
          </h3>
          <div className="prose prose-sm text-text-secondary">
            <p>
              ConsentKeys provides privacy-focused authentication for your
              applications. Users authenticate with pseudonymous identities,
              protecting their real information while still allowing your app to
              function normally.
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/developer/apps/new"
                  className="text-primary-emphasis hover:text-primary-emphasis/90"
                >
                  Create your first application
                </Link>
              </li>
              <li>
                <a
                  href={DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-emphasis hover:text-primary-emphasis/90"
                >
                  Read the integration guide
                </a>
              </li>
              <li>
                <a
                  href={`${DOCS_URL}#examples`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-emphasis hover:text-primary-emphasis/90"
                >
                  View code examples
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
