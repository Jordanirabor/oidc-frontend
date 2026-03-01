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

interface FormData {
  name: string;
  description: string;
  websiteUrl: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  redirectUris: string[];
  scopes: string[];
  requirePkce: boolean;
}

const AVAILABLE_SCOPES = [
  {
    id: "openid",
    name: "OpenID",
    description: "Basic OpenID Connect authentication",
  },
  {
    id: "profile",
    name: "Profile",
    description: "Access to pseudonymous profile information",
  },
  {
    id: "email",
    name: "Email",
    description: "Access to pseudonymous email address",
  },
];

export default function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [app, setApp] = useState<App | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    websiteUrl: "",
    privacyPolicyUrl: "",
    termsOfServiceUrl: "",
    redirectUris: [""],
    scopes: ["openid"],
    requirePkce: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApp = useCallback(async () => {
    if (!appId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/developer/apps/${appId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Application not found");
        }
        throw new Error("Failed to fetch application");
      }

      const data = await response.json();
      const appData = data.client;
      setApp(appData);

      // Populate form with existing data
      setFormData({
        name: appData.name || "",
        description: appData.description || "",
        websiteUrl: appData.websiteUrl || "",
        privacyPolicyUrl: appData.privacyPolicyUrl || "",
        termsOfServiceUrl: appData.termsOfServiceUrl || "",
        redirectUris:
          appData.redirectUris.length > 0 ? appData.redirectUris : [""],
        scopes: appData.scopes || ["openid"],
        requirePkce: appData.requirePkce || false,
      });
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
      fetchApp();
    }
  }, [appId, fetchApp]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRedirectUriChange = (index: number, value: string) => {
    const newRedirectUris = [...formData.redirectUris];
    newRedirectUris[index] = value;
    setFormData((prev) => ({
      ...prev,
      redirectUris: newRedirectUris,
    }));
  };

  const addRedirectUri = () => {
    setFormData((prev) => ({
      ...prev,
      redirectUris: [...prev.redirectUris, ""],
    }));
  };

  const removeRedirectUri = (index: number) => {
    if (formData.redirectUris.length > 1) {
      const newRedirectUris = formData.redirectUris.filter(
        (_, i) => i !== index
      );
      setFormData((prev) => ({
        ...prev,
        redirectUris: newRedirectUris,
      }));
    }
  };

  const handleScopeChange = (scopeId: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        scopes: [...prev.scopes, scopeId],
      }));
    } else {
      // Don't allow removing openid scope
      if (scopeId === "openid") return;

      setFormData((prev) => ({
        ...prev,
        scopes: prev.scopes.filter((s) => s !== scopeId),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Filter out empty redirect URIs
      const cleanedData = {
        ...formData,
        redirectUris: formData.redirectUris.filter((uri) => uri.trim() !== ""),
      };

      const response = await fetch(`/api/developer/apps/${appId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update application");
      }

      // Redirect back to the application detail page
      router.push(`/developer/apps/${appId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
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

  if (error && !app) {
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
      <div className="max-w-2xl mx-auto">
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
                  <Link
                    href={`/developer/apps/${app.id}`}
                    className="ml-4 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {app.name}
                  </Link>
                </div>
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
                    Edit
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="mt-4 text-2xl font-semibold text-slate-100 font-mono">
            Edit Application
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Update your application settings and configuration.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-none bg-red-950/20 border border-red-500/30 p-4">
            <div className="text-sm text-red-400">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-bg-20 shadow px-4 py-5 sm:p-6 border border-slate-800 rounded-none">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-slate-200 font-mono">
                  Basic Information
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Basic details about your application.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-text-secondary"
                    >
                      Application Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-none border border-slate-800 shadow-sm focus:border-primary focus:ring-primary/50 focus:ring-2 sm:text-sm px-3 py-2 text-slate-200 placeholder-slate-500 bg-bg-20 h-9 outline-none transition-all"
                      placeholder="Social Media Intelligence App"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-text-secondary"
                    >
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-none border border-slate-800 shadow-sm focus:border-primary focus:ring-primary/50 focus:ring-2 sm:text-sm px-3 py-2 text-slate-200 placeholder-slate-500 bg-bg-20 outline-none transition-all"
                      placeholder="A brief description of your application..."
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="websiteUrl"
                      className="block text-sm font-medium text-text-secondary"
                    >
                      Website URL
                    </label>
                    <input
                      type="url"
                      name="websiteUrl"
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-none border border-slate-800 shadow-sm focus:border-primary focus:ring-primary/50 focus:ring-2 sm:text-sm px-3 py-2 text-slate-200 placeholder-slate-500 bg-bg-20 h-9 outline-none transition-all"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="privacyPolicyUrl"
                      className="block text-sm font-medium text-text-secondary"
                    >
                      Privacy Policy URL
                    </label>
                    <input
                      type="url"
                      name="privacyPolicyUrl"
                      id="privacyPolicyUrl"
                      value={formData.privacyPolicyUrl}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-none border border-slate-800 shadow-sm focus:border-primary focus:ring-primary/50 focus:ring-2 sm:text-sm px-3 py-2 text-slate-200 placeholder-slate-500 bg-bg-20 h-9 outline-none transition-all"
                      placeholder="https://example.com/privacy"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="termsOfServiceUrl"
                      className="block text-sm font-medium text-text-secondary"
                    >
                      Terms of Service URL
                    </label>
                    <input
                      type="url"
                      name="termsOfServiceUrl"
                      id="termsOfServiceUrl"
                      value={formData.termsOfServiceUrl}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-none border border-slate-800 shadow-sm focus:border-primary focus:ring-primary/50 focus:ring-2 sm:text-sm px-3 py-2 text-slate-200 placeholder-slate-500 bg-bg-20 h-9 outline-none transition-all"
                      placeholder="https://example.com/terms"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-20 shadow px-4 py-5 sm:p-6 border border-slate-800 rounded-none">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-slate-200 font-mono">
                  OAuth Configuration
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Configure OAuth redirect URIs and scopes.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Redirect URIs *
                    </label>
                    <p className="text-sm text-slate-400 mb-3">
                      URLs where users will be redirected after authentication.
                    </p>
                    {formData.redirectUris.map((uri, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="url"
                          required
                          value={uri}
                          onChange={(e) =>
                            handleRedirectUriChange(index, e.target.value)
                          }
                          className="flex-1 block w-full rounded-none border border-slate-800 shadow-sm focus:border-primary focus:ring-primary/50 focus:ring-2 sm:text-sm px-3 py-2 text-slate-200 placeholder-slate-500 bg-bg-20 h-9 outline-none transition-all"
                          placeholder="https://example.com/auth/callback"
                        />
                        {formData.redirectUris.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRedirectUri(index)}
                            className="ml-2 inline-flex items-center px-3 py-2 border border-slate-700 shadow-sm text-sm leading-4 font-medium font-mono text-slate-200 bg-bg-20 hover:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-none transition-all h-9"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addRedirectUri}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-slate-700 shadow-sm text-sm leading-4 font-medium font-mono text-slate-200 bg-bg-20 hover:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-none transition-all h-9"
                    >
                      Add Redirect URI
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Scopes *
                    </label>
                    <p className="text-sm text-slate-400 mb-3">
                      Select the permissions your application needs.
                    </p>
                    <div className="space-y-3">
                      {AVAILABLE_SCOPES.map((scope) => (
                        <div key={scope.id} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={scope.id}
                              type="checkbox"
                              checked={formData.scopes.includes(scope.id)}
                              onChange={(e) =>
                                handleScopeChange(scope.id, e.target.checked)
                              }
                              disabled={scope.id === "openid"}
                              className="focus:ring-primary focus:ring-2 h-4 w-4 text-primary border-slate-700 bg-bg-20 cursor-pointer disabled:cursor-not-allowed transition-all"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor={scope.id}
                              className="font-medium text-slate-200 cursor-pointer"
                            >
                              {scope.name}
                              {scope.id === "openid" && (
                                <span className="text-slate-400">
                                  {" "}
                                  (required)
                                </span>
                              )}
                            </label>
                            <p className="text-slate-400">{scope.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-2">
                      <label className="block text-sm font-medium text-slate-400">
                        Require PKCE
                      </label>
                      <div className="relative ml-2 group">
                        <svg
                          className="h-4 w-4 text-slate-400 cursor-help"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <strong className="block mb-1">
                            PKCE (Proof Key for Code Exchange)
                          </strong>
                          <p className="mb-2">
                            When enabled, PKCE will be required for all
                            authorization requests. This provides additional
                            security by preventing authorization code
                            interception attacks.
                          </p>
                          <p className="font-semibold mb-1">Recommended for:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Single-page applications (SPAs)</li>
                            <li>Mobile applications</li>
                            <li>Any public client that cannot securely store secrets</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            requirePkce: !prev.requirePkce,
                          }))
                        }
                        className={`${
                          formData.requirePkce ? "bg-primary" : "bg-slate-700"
                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                        role="switch"
                        aria-checked={formData.requirePkce}
                      >
                        <span
                          className={`${
                            formData.requirePkce
                              ? "translate-x-5"
                              : "translate-x-0"
                          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                      <span className="ml-3 text-sm text-slate-400">
                        {formData.requirePkce
                          ? "PKCE is required for this application"
                          : "PKCE is optional for this application"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/developer/apps/${app.id}`}
              className="bg-bg-20 py-2 px-4 border border-slate-700 rounded-none shadow-sm text-sm font-medium font-mono text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all h-10 inline-flex items-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium font-mono rounded-none text-secondary bg-primary-emphasis hover:bg-primary-emphasis/90 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all h-10"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
