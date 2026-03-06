"use client";

import Link from "next/link";
import { useState } from "react";

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

interface Client {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  websiteUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  redirectUris: string[];
  scopes: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
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

const validateURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default function NewApplicationPage() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    client: Client;
    clientSecret: string;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const addRedirectUri = () => {
    const lastUri = formData.redirectUris[formData.redirectUris.length - 1];

    // Check if last URI is empty or invalid
    if (!lastUri.trim()) {
      setError(
        "Please fill in the current redirect URI before adding a new one",
      );
      return;
    }

    if (!validateURL(lastUri)) {
      setError("Please enter a valid URL (e.g., https://example.com/callback)");
      return;
    }

    // Clear any previous errors and add new empty URI
    setError(null);
    setFormData((prev) => ({
      ...prev,
      redirectUris: [...prev.redirectUris, ""],
    }));
  };

  const removeRedirectUri = (index: number) => {
    if (formData.redirectUris.length > 1) {
      const newRedirectUris = formData.redirectUris.filter(
        (_, i) => i !== index,
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
      // Do not allow removing openid scope
      if (scopeId === "openid") return;

      setFormData((prev) => ({
        ...prev,
        scopes: prev.scopes.filter((s) => s !== scopeId),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty redirect URIs and optional URL fields
      const cleanedData: {
        name: string;
        redirectUris: string[];
        scopes: string[];
        requirePkce: boolean;
        description?: string;
        websiteUrl?: string;
        privacyPolicyUrl?: string;
        termsOfServiceUrl?: string;
      } = {
        name: formData.name,
        redirectUris: formData.redirectUris.filter((uri) => uri.trim() !== ""),
        scopes: formData.scopes,
        requirePkce: formData.requirePkce,
      };

      // Only include optional fields if they have values
      if (formData.description.trim()) {
        cleanedData.description = formData.description;
      }
      if (formData.websiteUrl.trim()) {
        cleanedData.websiteUrl = formData.websiteUrl;
      }
      if (formData.privacyPolicyUrl.trim()) {
        cleanedData.privacyPolicyUrl = formData.privacyPolicyUrl;
      }
      if (formData.termsOfServiceUrl.trim()) {
        cleanedData.termsOfServiceUrl = formData.termsOfServiceUrl;
      }

      // Validate all redirect URIs
      if (cleanedData.redirectUris.length === 0) {
        throw new Error("At least one redirect URI is required");
      }

      for (const uri of cleanedData.redirectUris) {
        if (!validateURL(uri)) {
          throw new Error(`Invalid redirect URI: ${uri}`);
        }
      }

      const response = await fetch("/api/developer/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create application");
      }

      const data = await response.json();
      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-950/20 border border-green-500/30 rounded-none p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
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
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-400">
                  Application Created Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-300/80">
                  <p>
                    {success.client.status === "active"
                      ? `Your application "${success.client.name}" has been created and is immediately usable.`
                      : `Your application "${success.client.name}" has been created and is pending approval.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-20 border border-slate-800 shadow overflow-hidden rounded-none">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
              <h3 className="text-lg leading-6 font-medium text-slate-100">
                Application Details
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Save these credentials securely. The client secret will not be
                shown again.
              </p>
            </div>
            <div>
              <dl>
                <div className="bg-bg-10 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-slate-400">
                    Application Name
                  </dt>
                  <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                    {success.client.name}
                  </dd>
                </div>
                <div className="bg-bg-20 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-slate-400">
                    Client ID
                  </dt>
                  <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2 font-mono">
                    {success.client.clientId}
                  </dd>
                </div>
                <div className="bg-bg-10 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-slate-400">
                    Client Secret
                  </dt>
                  <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                    <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-none p-3">
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
                        <div className="ml-3">
                          <p className="text-sm text-yellow-400 font-medium">
                            Save this secret now - it will not be shown again!
                          </p>
                          <p className="mt-1 text-sm text-yellow-300/80 font-mono break-all">
                            {success.clientSecret}
                          </p>
                        </div>
                      </div>
                    </div>
                  </dd>
                </div>
                <div className="bg-bg-20 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-slate-400">Status</dt>
                  <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                    {success.client.status === "active" ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-none bg-green-950/30 border border-green-500/30 text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-none bg-yellow-950/30 border border-yellow-500/30 text-yellow-400">
                        Pending Approval
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <Link
              href="/developer/apps"
              className="inline-flex items-center px-4 py-2 border border-slate-700 shadow-sm text-sm font-medium font-mono rounded-none text-slate-200 bg-bg-20 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all h-10"
            >
              Back to Applications
            </Link>
            <Link
              href={`/developer/apps/${success.client.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium font-mono rounded-none text-secondary bg-primary-emphasis hover:bg-primary-emphasis/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all h-10"
            >
              Manage Application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-secondary-50 font-mono">
            Create New Application
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Register a new OAuth application to integrate with ConsentKeys.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
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
                    {error && (
                      <div className="mt-3 rounded-none bg-red-950/20 border border-red-500/30 p-3">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}
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
                            <p className="text-slate-400">
                              {scope.description}
                            </p>
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
                            <li>
                              Any public client that cannot securely store
                              secrets
                            </li>
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
              href="/developer/apps"
              className="bg-bg-20 py-2 px-4 border border-slate-700 rounded-none shadow-sm text-sm font-medium font-mono text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all h-10 inline-flex items-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium font-mono rounded-none text-secondary bg-primary-emphasis hover:bg-primary-emphasis/90 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all h-10"
            >
              {loading ? "Creating..." : "Create Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
