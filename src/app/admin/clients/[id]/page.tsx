"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Client {
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

interface ClientFormData {
  name: string;
  description: string;
  websiteUrl: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  redirectUris: string[];
  scopes: string[];
  status: "pending" | "active" | "suspended" | "revoked";
  requirePkce: boolean;
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    description: "",
    websiteUrl: "",
    privacyPolicyUrl: "",
    termsOfServiceUrl: "",
    redirectUris: [""],
    scopes: ["openid"],
    status: "pending",
    requirePkce: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const availableScopes = [
    { value: "openid", label: "OpenID Connect", required: true },
    { value: "profile", label: "Profile Information" },
    { value: "email", label: "Email Address" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending", description: "Awaiting approval" },
    { value: "active", label: "Active", description: "Can authenticate users" },
    {
      value: "suspended",
      label: "Suspended",
      description: "Temporarily disabled",
    },
    { value: "revoked", label: "Revoked", description: "Permanently disabled" },
  ];

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch client");
      }

      const data = await response.json();
      const clientData = data.client;
      setClient(clientData);
      setFormData({
        name: clientData.name || "",
        description: clientData.description || "",
        websiteUrl: clientData.websiteUrl || "",
        privacyPolicyUrl: clientData.privacyPolicyUrl || "",
        termsOfServiceUrl: clientData.termsOfServiceUrl || "",
        redirectUris: clientData.redirectUris || [""],
        scopes: clientData.scopes || ["openid"],
        status: clientData.status,
        requirePkce: clientData.requirePkce || false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRedirectUriChange = (index: number, value: string) => {
    const newUris = [...formData.redirectUris];
    newUris[index] = value;
    setFormData((prev) => ({ ...prev, redirectUris: newUris }));
  };

  const addRedirectUri = () => {
    setFormData((prev) => ({
      ...prev,
      redirectUris: [...prev.redirectUris, ""],
    }));
  };

  const removeRedirectUri = (index: number) => {
    if (formData.redirectUris.length > 1) {
      const newUris = formData.redirectUris.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, redirectUris: newUris }));
    }
  };

  const handleScopeChange = (scope: string, checked: boolean) => {
    if (scope === "openid") return; // OpenID is required

    const newScopes = checked
      ? [...formData.scopes, scope]
      : formData.scopes.filter((s) => s !== scope);

    setFormData((prev) => ({ ...prev, scopes: newScopes }));
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

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update client");
      }

      router.push("/admin/clients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSecret = async () => {
    if (
      !confirm(
        "Are you sure you want to regenerate the client secret? This will invalidate the current secret."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/clients/${clientId}/regenerate-secret`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to regenerate secret");
      }

      const result = await response.json();
      setNewSecret(result.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100 font-mono">Client Not Found</h2>
          <p className="mt-2 text-slate-400">
            The requested client could not be found.
          </p>
          <Link
            href="/admin/clients"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium font-mono rounded-none shadow-sm text-secondary bg-primary-emphasis hover:bg-primary-emphasis/90 h-10 transition-all"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-slate-100 sm:text-3xl sm:truncate font-mono">
              Edit Client
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Client ID: {client.clientId}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/admin/clients"
              className="inline-flex items-center px-4 py-2 border border-slate-700 rounded-none shadow-sm text-sm font-medium font-mono text-slate-200 bg-bg-20 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all h-10"
            >
              Back to Clients
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-none bg-red-950/20 border border-red-500/30 p-4">
            <div className="text-sm text-red-400">{error}</div>
          </div>
        )}

        {newSecret && (
          <div className="mt-6 bg-yellow-950/20 border border-yellow-500/30 rounded-none p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-400">
                  New Client Secret Generated
                </h3>
                <div className="mt-2 text-sm text-yellow-300/80">
                  <p>Save this secret now - it will not be displayed again:</p>
                  <code className="block mt-2 p-2 bg-yellow-950/30 border border-yellow-500/20 rounded-none text-yellow-400">
                    {newSecret}
                  </code>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setNewSecret(null)}
                    className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="bg-bg-20 border border-slate-800 shadow px-4 py-5 rounded-none sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-slate-200 font-mono">
                  Basic Information
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Basic details about your OAuth client application.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-400"
                    >
                      Application Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="mt-1 focus:ring-primary/50 focus:ring-2 focus:border-primary block w-full shadow-sm sm:text-sm border-slate-800 rounded-none px-3 py-2 bg-card text-slate-200 placeholder-slate-500 outline-none transition-all"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-slate-400"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-800 focus:outline-none focus:ring-primary/50 focus:ring-2 focus:border-primary sm:text-sm rounded-none bg-card text-slate-200"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-slate-400"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      className="mt-1 focus:ring-primary/50 focus:ring-2 focus:border-primary block w-full shadow-sm sm:text-sm border-slate-800 rounded-none px-3 py-2 bg-card text-slate-200 placeholder-slate-500 outline-none transition-all"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="websiteUrl"
                      className="block text-sm font-medium text-slate-400"
                    >
                      Website URL
                    </label>
                    <input
                      type="url"
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) =>
                        handleInputChange("websiteUrl", e.target.value)
                      }
                      className="mt-1 focus:ring-primary/50 focus:ring-2 focus:border-primary block w-full shadow-sm sm:text-sm border-slate-800 rounded-none px-3 py-2 bg-card text-slate-200 placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-20 border border-slate-800 shadow px-4 py-5 rounded-none sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-slate-200 font-mono">
                  Client Credentials
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Manage client authentication credentials.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400">
                      Client ID
                    </label>
                    <div className="mt-1 p-3 bg-bg-10 border border-slate-800 rounded-none">
                      <code className="text-sm text-slate-100">
                        {client.clientId}
                      </code>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400">
                      Client Secret
                    </label>
                    <div className="mt-1 flex">
                      <div className="flex-1 p-3 bg-bg-10 border border-slate-800 rounded-l-none">
                        <span className="text-sm text-text-secondary-50">
                          Hidden for security
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRegenerateSecret}
                        className="inline-flex items-center px-4 py-2 border border-l-0 border-slate-800 rounded-r-none shadow-sm text-sm font-medium font-mono text-slate-200 bg-bg-20 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                      >
                        Regenerate
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary-50">
                      Regenerating will invalidate the current secret.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-20 border border-slate-800 shadow px-4 py-5 rounded-none sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-slate-200 font-mono">
                  OAuth Configuration
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Configure OAuth redirect URIs and requested scopes.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400">
                      Redirect URIs *
                    </label>
                    {formData.redirectUris.map((uri, index) => (
                      <div key={index} className="mt-2 flex">
                        <input
                          type="url"
                          required
                          value={uri}
                          onChange={(e) =>
                            handleRedirectUriChange(index, e.target.value)
                          }
                          className="flex-1 focus:ring-primary/50 focus:ring-2 focus:border-primary block w-full shadow-sm sm:text-sm border-slate-800 rounded-none px-3 py-2 bg-card text-slate-200 placeholder-slate-500 outline-none transition-all"
                        />
                        {formData.redirectUris.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRedirectUri(index)}
                            className="ml-2 inline-flex items-center px-3 py-2 border border-slate-700 shadow-sm text-sm leading-4 font-medium font-mono rounded-none text-slate-200 bg-bg-20 hover:bg-slate-800/50 transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addRedirectUri}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-slate-700 shadow-sm text-sm leading-4 font-medium font-mono rounded-none text-slate-200 bg-bg-20 hover:bg-slate-800/50 transition-all"
                    >
                      Add Redirect URI
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400">
                      Requested Scopes
                    </label>
                    <div className="mt-2 space-y-2">
                      {availableScopes.map((scope) => (
                        <div key={scope.value} className="flex items-center">
                          <input
                            id={`scope-${scope.value}`}
                            type="checkbox"
                            checked={formData.scopes.includes(scope.value)}
                            onChange={(e) =>
                              handleScopeChange(scope.value, e.target.checked)
                            }
                            disabled={scope.required}
                            className="h-4 w-4 text-primary focus:ring-primary focus:ring-2 border-slate-700 rounded"
                          />
                          <label
                            htmlFor={`scope-${scope.value}`}
                            className="ml-2 block text-sm text-slate-200"
                          >
                            {scope.label}
                            {scope.required && (
                              <span className="text-red-400"> *</span>
                            )}
                          </label>
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
                          className="h-4 w-4 text-text-secondary-50 cursor-help"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-bg-10 border border-slate-800 text-slate-200 text-xs rounded-none shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
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

          <div className="bg-bg-20 border border-slate-800 shadow px-4 py-5 rounded-none sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-slate-200 font-mono">
                  Legal Information
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Links to your privacy policy and terms of service.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label
                      htmlFor="privacyPolicyUrl"
                      className="block text-sm font-medium text-slate-400"
                    >
                      Privacy Policy URL
                    </label>
                    <input
                      type="url"
                      id="privacyPolicyUrl"
                      value={formData.privacyPolicyUrl}
                      onChange={(e) =>
                        handleInputChange("privacyPolicyUrl", e.target.value)
                      }
                      className="mt-1 focus:ring-primary/50 focus:ring-2 focus:border-primary block w-full shadow-sm sm:text-sm border-slate-800 rounded-none px-3 py-2 bg-card text-slate-200 placeholder-slate-500 outline-none transition-all"
                    />
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="termsOfServiceUrl"
                      className="block text-sm font-medium text-slate-400"
                    >
                      Terms of Service URL
                    </label>
                    <input
                      type="url"
                      id="termsOfServiceUrl"
                      value={formData.termsOfServiceUrl}
                      onChange={(e) =>
                        handleInputChange("termsOfServiceUrl", e.target.value)
                      }
                      className="mt-1 focus:ring-primary/50 focus:ring-2 focus:border-primary block w-full shadow-sm sm:text-sm border-slate-800 rounded-none px-3 py-2 bg-card text-slate-200 placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/clients"
              className="bg-bg-20 py-2 px-4 border border-slate-700 rounded-none shadow-sm text-sm font-medium font-mono text-slate-200 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all h-10 inline-flex items-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium font-mono rounded-none text-secondary bg-primary-emphasis hover:bg-primary-emphasis/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all h-10"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
