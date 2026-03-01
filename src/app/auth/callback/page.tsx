"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CallbackPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the token from URL parameters
        const token = searchParams.get("token");
        const state = searchParams.get("state");

        if (!token) {
          setError("Invalid magic link - missing token");
          setIsLoading(false);
          return;
        }

        // Verify the magic link token with your backend
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const response = await fetch(`${apiUrl}/auth/verify-magic-link`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, state }),
          // Add timeout for external service calls
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        const data = await response.json();

        if (response.ok) {
          // Redirect to the original application with authorization code
          if (data.redirect_uri) {
            window.location.href = data.redirect_uri;
          } else {
            // Fallback - redirect to consent page
            router.push(`/consent?${searchParams.toString()}`);
          }
        } else {
          setError(data.error_description || "Failed to verify magic link");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("Network error. Please try again.");
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-600 mb-8">
              ConsentKeys
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push("/auth")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-8">ConsentKeys</h1>
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
              <svg
                className="animate-spin w-6 h-6 text-blue-600"
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
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying your identity...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your magic link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackPageContent />
    </Suspense>
  );
}
