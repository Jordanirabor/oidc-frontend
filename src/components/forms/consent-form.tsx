"use client";
import { Button } from "@/components/ui/button";

interface ConsentData {
    sessionId: string;
    clientName: string;
    clientId: string;
    scopes: string[];
    pseudonym: string;
    email?: string; // Optional - only present if email scope requested
    name?: string; // Optional - only present if profile scope requested
    avatar?: string; // Optional - only present if profile scope requested
    redirectUri: string;
}

interface ConsentFormProps {
    consentData: ConsentData;
    onConsent: (allow: boolean) => Promise<void>;
    isSubmitting: boolean;
    submittingAction: "allow" | "deny" | null;
    error: string;
}

export default function ConsentForm({
    consentData,
    onConsent,
    isSubmitting,
    submittingAction,
    error,
}: ConsentFormProps) {
    const getScopeDescription = (scope: string): string => {
        const descriptions: Record<string, string> = {
            openid: "Verify your pseudonymous identity",
            profile: "Access your pseudonymous profile information (name, avatar)",
            email: `Access your proxy email address${consentData?.email ? `: ${consentData.email}` : ""
                }`,
            address: "Access your generated address information",
        };
        return descriptions[scope] || `Access ${scope} information`;
    };

    const getScopeIcon = (scope: string): string => {
        const icons: Record<string, string> = {
            openid: "🔐",
            profile: "👤",
            email: "📧",
            address: "📍",
        };
        return icons[scope] || "📋";
    };

    return (
        <div className="md:bg-primary/15 py-8 px-4 shadow sm:px-10 text-muted rounded-none border border-ring/30">
            <h2 className="text-xl font-semibold text-text-primary text-center mb-6 font-mono">
                Authorize Application
            </h2>
            {/* Application Info */}
            <div className="mb-6 p-4 bg-primary/20 border border-ring/30 rounded-none">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-emphasis rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                {consentData.clientName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-primary-emphasis">
                            {consentData.clientName}
                        </h3>
                        <p className="text-sm text-text-muted">
                            wants to access your information
                        </p>
                    </div>
                </div>
            </div>

            {/* User Identity */}
            <div className="mb-6 p-4 bg-primary/20 rounded-none">
                <h4 className="text-sm font-medium text-text-muted mb-2">
                    Your pseudonymous identity:
                </h4>
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-emphasis to-primary-foreground rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {consentData.scopes.includes("profile") && consentData.avatar
                            ? consentData.avatar
                            : consentData.scopes.includes("profile") && consentData.name
                                ? consentData.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)
                                : consentData.pseudonym.slice(-2).toUpperCase()}
                    </div>
                    <div className="ml-3">
                        {consentData.scopes.includes("profile") && consentData.name ? (
                            <p className="text-sm font-medium text-text-primary">
                                {consentData.name}
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-text-muted">
                                Pseudonymous User
                            </p>
                        )}
                        <p className="text-xs text-text-muted">{consentData.pseudonym}</p>
                        <p className="text-xs text-text-muted">
                            Generated for this application
                        </p>
                    </div>
                </div>
            </div>

            {/* Permissions */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-text-muted mb-3">
                    This application will be able to:
                </h4>
                <div className="space-y-3">
                    {consentData.scopes.map((scope) => (
                        <div key={scope} className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                                <span className="text-lg">{getScopeIcon(scope)}</span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-text-primary capitalize">
                                    {scope}
                                </p>
                                <p className="text-xs text-text-muted">
                                    {getScopeDescription(scope)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Privacy Notice */}
            <div className="mb-6 p-4 bg-green-50 rounded-none border border-green-200">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-green-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800">
                            Privacy Protected
                        </h4>
                        <p className="text-xs text-green-700 mt-1">
                            Your real identity remains private. Only pseudonymous
                            information will be shared.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-none p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-red-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <Button
                    onClick={() => onConsent(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-none bg-text-primary text-black hover:text-text-primary hover:bg-red-10 cursor-pointer"
                >
                    {submittingAction === "deny" ? (
                        <div className="flex items-center justify-center">
                            <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Denying...
                        </div>
                    ) : (
                        "Deny"
                    )}
                </Button>
                <Button
                    onClick={() => onConsent(true)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-none bg-primary-emphasis text-black hover:text-bg-10 hover:bg-green-20 cursor-pointer"
                >
                    {submittingAction === "allow" ? (
                        <div className="flex items-center justify-center">
                            <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Allowing...
                        </div>
                    ) : (
                        "Allow"
                    )}
                </Button>
            </div>

            <div className="mt-6 text-center">
                <p className="text-xs text-text-muted">
                    By clicking &quot;Allow&quot;, you consent to share the requested
                    information with this application. You can revoke this consent at
                    any time.
                </p>
            </div>
        </div>
    );
}
