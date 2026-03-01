"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface App {
  id: string;
  clientId: string;
  name: string;
  status: "pending" | "active" | "suspended" | "revoked";
  redirectUris: string[];
  scopes: string[];
  description?: string;
  websiteUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totalRequests: number;
  requestsLast24h: number;
  requestsLast7d: number;
  requestsLast30d: number;
  successRate: number;
  errorRate: number;
  avgResponseTime: number;
  topErrors: Array<{
    error: string;
    count: number;
  }>;
  requestsOverTime: Array<{
    date: string;
    requests: number;
    errors: number;
  }>;
  lastUsed?: string;
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [app, setApp] = useState<App | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "settings"
  >("overview");
  const [regeneratingSecret, setRegeneratingSecret] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const fetchAppData = useCallback(async () => {
    if (!appId) return;
    try {
      setLoading(true);
      const [appResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/developer/apps/${appId}`),
        fetch(`/api/developer/apps/${appId}/analytics`),
      ]);

      if (!appResponse.ok) {
        if (appResponse.status === 404) {
          throw new Error("Application not found");
        }
        throw new Error("Failed to fetch application");
      }

      const appData = await appResponse.json();
      setApp(appData.client);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setAppId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (appId) {
      fetchAppData();
    }
  }, [appId, fetchAppData]);

  const handleRegenerateSecret = async () => {
    if (
      !confirm(
        "Are you sure you want to regenerate the client secret? This will invalidate the current secret and may break existing integrations."
      )
    ) {
      return;
    }

    try {
      setRegeneratingSecret(true);
      const response = await fetch(
        `/api/developer/apps/${appId}/regenerate-secret`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to regenerate secret");
      }

      const data = await response.json();
      setNewSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setRegeneratingSecret(false);
    }
  };

  const handleDelete = async () => {
    if (!app) return;

    if (
      !confirm(
        `Are you sure you want to delete "${app.name}"? This action cannot be undone and will immediately stop all authentication for this application.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/developer/apps/${appId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete application");
      }

      router.push("/developer/apps");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

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

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-none bg-red-950/20 border border-red-500/30 p-4">
          <div className="text-sm text-red-400">{error}</div>
        </div>
        <div className="mt-4">
          <Link
            href="/developer/apps"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            ← Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <p className="text-slate-400">Application not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link
                href="/developer/apps"
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                Applications
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-slate-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-4 text-sm font-medium text-slate-400">
                  {app.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-slate-100">{app.name}</h1>
            <span className={`ml-3 ${getStatusBadge(app.status)}`}>
              {app.status}
            </span>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/developer/apps/${app.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-slate-700 shadow-sm text-sm font-medium font-mono rounded-none text-slate-200 bg-bg-20 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all h-10"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex cursor-pointer items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium font-mono rounded-none text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all h-10"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* New Secret Alert */}
      {newSecret && (
        <div className="mb-6 bg-yellow-950/20 border border-yellow-500/30 rounded-none p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-400">
                New Client Secret Generated
              </h3>
              <div className="mt-2 text-sm text-yellow-300/80">
                <p className="font-medium">
                  Save this secret now - it will not be shown again!
                </p>
                <p className="mt-1 font-mono break-all bg-yellow-950/30 border border-yellow-500/20 p-2 rounded-none">
                  {newSecret}
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setNewSecret(null)}
                  className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", name: "Overview" },
            { id: "analytics", name: "Analytics" },
            { id: "settings", name: "Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "overview" | "analytics" | "settings")
              }
              className={`${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Application Details */}
          <div className="bg-bg-20 border border-slate-800 shadow overflow-hidden rounded-none">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
              <h3 className="text-lg leading-6 font-medium text-slate-100">
                Application Information
              </h3>
            </div>
            <div>
              <dl>
                <div className="bg-bg-10 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-slate-400">
                    Client ID
                  </dt>
                  <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2 font-mono">
                    {app.clientId}
                  </dd>
                </div>
                {app.description && (
                  <div className="bg-bg-20 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-slate-400">
                      Description
                    </dt>
                    <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                      {app.description}
                    </dd>
                  </div>
                )}
                {app.websiteUrl && (
                  <div className="bg-bg-10 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-slate-400">
                      Website
                    </dt>
                    <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                      <Link
                        href={app.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        {app.websiteUrl}
                      </Link>
                    </dd>
                  </div>
                )}
                <div className="bg-bg-20 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-slate-400">
                    Redirect URIs
                  </dt>
                  <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                    <ul className="space-y-1">
                      {app.redirectUris.map((uri, index) => (
                        <li key={index} className="font-mono text-sm">
                          {uri}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="bg-bg-10 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-slate-400">Scopes</dt>
                  <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {app.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-none border text-xs font-medium bg-primary-emphasis/20 border-primary/30 text-primary"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
                <div className="bg-bg-20 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-slate-400">Created</dt>
                  <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                    {new Date(app.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div className="bg-bg-10 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-slate-400">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                    {new Date(app.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick Stats */}
          {analytics && (
            <div className="bg-bg-20 border border-slate-800 shadow overflow-hidden rounded-none">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
                <h3 className="text-lg leading-6 font-medium text-slate-100">
                  Quick Statistics
                </h3>
              </div>
              <div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 p-6">
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      Total Requests
                    </dt>
                    <dd className="text-2xl font-semibold text-slate-100">
                      {analytics.totalRequests.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      Requests (24h)
                    </dt>
                    <dd className="text-2xl font-semibold text-slate-100">
                      {analytics.requestsLast24h.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      Success Rate
                    </dt>
                    <dd className="text-2xl font-semibold text-slate-100">
                      {analytics.successRate.toFixed(1)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      Avg Response Time
                    </dt>
                    <dd className="text-2xl font-semibold text-slate-100">
                      {analytics.avgResponseTime}ms
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {analytics ? (
            <>
              {/* Analytics Overview */}
              <div className="bg-bg-20 border border-slate-800 shadow overflow-hidden rounded-none">
                <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
                  <h3 className="text-lg leading-6 font-medium text-slate-100">
                    Usage Analytics
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-slate-400">
                    Detailed statistics about your application&apos;s API usage.
                  </p>
                </div>
                <div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 p-6">
                    <div>
                      <dt className="text-sm font-medium text-slate-400">
                        Requests (7 days)
                      </dt>
                      <dd className="text-xl font-semibold text-slate-100">
                        {analytics.requestsLast7d.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-400">
                        Requests (30 days)
                      </dt>
                      <dd className="text-xl font-semibold text-slate-100">
                        {analytics.requestsLast30d.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-400">
                        Error Rate
                      </dt>
                      <dd className="text-xl font-semibold text-slate-100">
                        {analytics.errorRate.toFixed(2)}%
                      </dd>
                    </div>
                    {analytics.lastUsed && (
                      <div>
                        <dt className="text-sm font-medium text-slate-400">
                          Last Used
                        </dt>
                        <dd className="text-xl font-semibold text-slate-100">
                          {new Date(analytics.lastUsed).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Errors */}
              {analytics.topErrors.length > 0 && (
                <div className="bg-bg-20 border border-slate-800 shadow overflow-hidden rounded-none">
                  <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
                    <h3 className="text-lg leading-6 font-medium text-slate-100">
                      Top Errors
                    </h3>
                  </div>
                  <div>
                    <ul className="divide-y divide-slate-800">
                      {analytics.topErrors.map((error, index) => (
                        <li key={index} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-slate-100">
                              {error.error}
                            </div>
                            <div className="text-sm text-slate-400">
                              {error.count} occurrences
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-bg-20 border border-slate-800 shadow overflow-hidden rounded-none">
              <div className="px-4 py-5 sm:px-6 text-center">
                <p className="text-slate-400">
                  Analytics data is not available.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Security Settings */}
          <div className="bg-bg-20 border border-slate-800 shadow overflow-hidden rounded-none">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
              <h3 className="text-lg leading-6 font-medium text-slate-100">
                Security Settings
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Manage your application&apos;s security credentials.
              </p>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-100 mb-2">
                    Client Secret
                  </h4>
                  <p className="text-sm text-slate-400 mb-4">
                    Regenerate your client secret if it has been compromised.
                    This will invalidate the current secret.
                  </p>
                  <button
                    onClick={handleRegenerateSecret}
                    disabled={regeneratingSecret}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium font-mono rounded-none text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-10 cursor-pointer"
                  >
                    {regeneratingSecret
                      ? "Regenerating..."
                      : "Regenerate Client Secret"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-bg-20 border border-red-500/30 shadow overflow-hidden rounded-none">
            <div className="px-4 py-5 sm:px-6 border-b border-red-500/30">
              <h3 className="text-lg leading-6 font-medium text-red-400">
                Danger Zone
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-red-400/80">
                Irreversible and destructive actions.
              </p>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-100 mb-2">
                    Delete Application
                  </h4>
                  <p className="text-sm text-slate-400 mb-4">
                    Permanently delete this application and all associated data.
                    This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium font-mono rounded-none text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all h-10 cursor-pointer"
                  >
                    Delete Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
