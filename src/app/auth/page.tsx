"use client";

import LoginForm from "@/components/forms/login-form";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AuthPageContent() {
  const searchParams = useSearchParams();
  const [authConfig, setAuthConfig] = useState<{
    client_id?: string;
    redirect_uri?: string;
    scope?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract OIDC parameters from URL
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope");
  const state = searchParams.get("state");
  const nonce = searchParams.get("nonce");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod = searchParams.get("code_challenge_method");
  const prompt = searchParams.get("prompt");

  // Determine if this is a third-party OAuth flow (has OIDC params in URL)
  const isThirdPartyFlow = !!(clientId && redirectUri && scope);

  // Check for existing sessions and redirect to accounts if found
  useEffect(() => {
    const checkExistingSessions = async () => {
      // Skip session check if forcing login or no OIDC params
      if (prompt === "login" || !(clientId && redirectUri && scope)) {
        setLoading(false);
        return;
      }
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const response = await fetch(`${backendUrl}/auth/accounts`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // If user has accounts, redirect to account chooser
          if (data.accounts && data.accounts.length > 0) {
            const accountsUrl = new URL("/accounts", window.location.origin);
            accountsUrl.searchParams.set("client_id", clientId!);
            accountsUrl.searchParams.set("redirect_uri", redirectUri!);
            accountsUrl.searchParams.set("scope", scope!);
            if (state) accountsUrl.searchParams.set("state", state);
            if (nonce) accountsUrl.searchParams.set("nonce", nonce);
            if (codeChallenge)
              accountsUrl.searchParams.set("code_challenge", codeChallenge);
            if (codeChallengeMethod)
              accountsUrl.searchParams.set(
                "code_challenge_method",
                codeChallengeMethod,
              );

            window.location.href = accountsUrl.toString();
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check existing sessions:", error);
      }

      setLoading(false);
    };

    checkExistingSessions();
  }, [
    clientId,
    redirectUri,
    scope,
    state,
    nonce,
    codeChallenge,
    codeChallengeMethod,
    prompt,
  ]);

  // Fetch auth config if parameters are missing
  useEffect(() => {
    const fetchAuthConfig = async () => {
      // Only fetch if critical params are missing AND we're not checking sessions
      if ((!clientId || !redirectUri || !scope) && prompt !== "login") {
        try {
          const backendUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
          const response = await fetch(`${backendUrl}/api/auth-config`);

          if (response.ok) {
            const config = await response.json();
            setAuthConfig(config);
          }
        } catch (error) {
          console.error("Failed to fetch auth config:", error);
        }
      }

      // Only set loading false if we're not checking sessions
      if (!clientId || !redirectUri || !scope || prompt === "login") {
        setLoading(false);
      }
    };

    fetchAuthConfig();
  }, [clientId, redirectUri, scope, prompt]);

  // Use auth-config values as fallback
  const finalClientId = clientId || authConfig?.client_id;
  const finalRedirectUri = redirectUri || authConfig?.redirect_uri;
  const finalScope = scope || "openid profile email";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#041323] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#041323] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <LoginForm
        clientId={finalClientId}
        redirectUri={finalRedirectUri}
        scope={finalScope}
        state={state}
        nonce={nonce}
        codeChallenge={codeChallenge}
        codeChallengeMethod={codeChallengeMethod}
        isThirdPartyFlow={isThirdPartyFlow}
      />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
