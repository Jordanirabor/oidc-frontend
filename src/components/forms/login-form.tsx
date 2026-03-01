"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidReferralCode } from "@/lib/utils";
import { Eye, Lock, Mail, Shield, Users } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

interface LoginFormProps {
  clientId?: string | null;
  redirectUri?: string | null;
  scope?: string | null;
  state?: string | null;
  nonce?: string | null;
  codeChallenge?: string | null;
  codeChallengeMethod?: string | null;
}

const LoginForm = ({
  clientId,
  redirectUri,
  scope,
  state,
  nonce,
  codeChallenge,
  codeChallengeMethod,
}: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError("");

    // Validate required OIDC parameters
    if (!clientId || !redirectUri || !scope) {
      setError(
        "Missing required authentication parameters. Please try accessing this page through the proper authorization flow."
      );
      setIsEmailLoading(false);
      return;
    }

    // Validate email
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setIsEmailLoading(false);
      return;
    }

    // Validate referral code if shown
    if (showReferralInput && !referralCode) {
      setError("Please enter a referral code.");
      setIsEmailLoading(false);
      return;
    }

    // Validate referral code format
    if (
      showReferralInput &&
      referralCode &&
      !isValidReferralCode(referralCode)
    ) {
      setError(
        "Invalid referral code format. Expected format: REF-XXXXX or bypass code"
      );
      setIsEmailLoading(false);
      return;
    }

    try {
      const requestBody = {
        email,
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        ...(state && { state }),
        ...(nonce && { nonce }),
        ...(codeChallenge && { code_challenge: codeChallenge }),
        ...(codeChallengeMethod && {
          code_challenge_method: codeChallengeMethod,
        }),
        ...(showReferralInput && { referral_code: referralCode }),
      };

      if (process.env.NODE_ENV === "development") {
        console.log("Sending request with body:", requestBody);
      }

      const response = await fetch("/api/request-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
      } else {
        // Handle different types of errors
        if (response.status === 403 && data.error === "referral_required") {
          setShowReferralInput(true);
          setError(
            data.error_description || "A referral code is required to join."
          );
        } else if (
          response.status === 403 &&
          data.error === "invalid_referral_code"
        ) {
          setShowReferralInput(true);
          setError(
            data.error_description || "The provided referral code is invalid."
          );
        } else if (response.status === 400) {
          setError(
            data.error_description ||
              "Invalid request. Please check your parameters and try again."
          );
        } else if (response.status === 404) {
          setError("Authentication service not found. Please try again later.");
        } else if (response.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(
            data.error_description ||
              "Failed to send magic link. Please try again."
          );
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Network error:", err);
      }
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsEmailLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center px-4 md:px-0">
        {/* Left side - Hero content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Image
                src="/consentkeys.svg"
                alt="ConsentKeys"
                width={150}
                height={60}
              />
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight font-mono">
              Magic link
              <span className="block text-primary-emphasis">sent!</span>
            </h2>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Check your email for the secure login link. Your privacy is
              protected with our advanced authentication system.
            </p>
          </div>

          {/* Trust indicators */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-green-400">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Mail className="h-4 w-4" />
              </div>
              <span className="font-medium">Magic link sent to {email}</span>
            </div>

            <div className="flex items-center gap-3 text-green-400">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
              <span className="font-medium">Link expires in 15 minutes</span>
            </div>

            <div className="flex items-center gap-3 text-green-400">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-medium">Secure and encrypted</span>
            </div>
          </div>
        </div>

        {/* Right side - Success message */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="p-8 shadow-xl border bg-primary/15 border-ring/50 rounded-none">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-white">
                  Check your email
                </h3>
                <p className="text-text-muted">
                  We&apos;ve sent a magic link to{" "}
                  <strong className="text-white">{email}</strong>
                </p>
                <p className="text-sm text-text-muted">
                  Click the link in your email to continue signing in. The link
                  will expire in 15 minutes.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => setEmailSent(false)}
                className="w-full border border-ring/50 hover:border-primary-emphasis/50 text-text-secondary hover:text-white cursor-pointer rounded-none py-6"
              >
                Try another email
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center px-4 md:px-0">
      {/* Left side - Hero content */}
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Image
              src="/consentkeys.svg"
              alt="ConsentKeys"
              width={150}
              height={60}
            />
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight font-mono">
            Privacy-first
            <span className="block text-primary-emphasis">authentication</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Sign in without sharing your real identity. ConsentKeys protects
            your personal information with secure aliases, keeping you safe even
            during data breaches.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-green-400">
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
            <span className="font-medium">No passwords required</span>
          </div>

          <div className="flex items-center gap-3 text-green-400">
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Eye className="h-4 w-4" />
            </div>
            <span className="font-medium">Your real identity stays hidden</span>
          </div>

          <div className="flex items-center gap-3 text-green-400">
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-medium">
              Zero personal data shared with apps
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full max-w-md mx-auto lg:mx-0">
        <Card className="p-8 shadow-xl bg-primary/15 border-2 border-ring/30 min-h-[450px] flex flex-col justify-center rounded-none px-4 md:px-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold text-white font-mono">
                Secure Sign In
              </h3>
              <p className="text-muted-foreground">
                {showReferralInput
                  ? "Please enter an invite code to join"
                  : "Enter your email to receive a secure magic link"}
              </p>
            </div>

            {/* Debug info for missing OIDC parameters */}
            {(!clientId || !redirectUri || !scope) && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mb-4">
                <p className="text-yellow-400 text-sm">
                  <strong>Debug Info:</strong> Missing OIDC parameters
                </p>
                <div className="text-xs text-yellow-300 mt-1">
                  <p>Client ID: {clientId || "null"}</p>
                  <p>Redirect URI: {redirectUri || "null"}</p>
                  <p>Scope: {scope || "null"}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-white"
                >
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-[#021323] border-[#12375B] text-white placeholder:text-text-secondary focus:border-primary-emphasis rounded-none"
                    required
                  />
                </div>
              </div>

              {showReferralInput && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                  <Label
                    htmlFor="referralCode"
                    className="text-sm font-medium text-white"
                  >
                    Referral Code
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <Input
                      id="referralCode"
                      type="text"
                      placeholder="Enter referral code (e.g. REF-12345)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="pl-10 h-12 bg-[#021323] border-[#12375B] text-white placeholder:text-text-secondary focus:border-primary-emphasis rounded-none"
                      required={showReferralInput}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isEmailLoading}
                className="w-full h-12 text-base font-medium bg-primary-emphasis hover:bg-primary-foreground text-black transition-opacity rounded-none cursor-pointer"
              >
                {isEmailLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {showReferralInput
                      ? "Verifying code..."
                      : "Sending magic link..."}
                  </div>
                ) : showReferralInput ? (
                  "Join with Code"
                ) : (
                  "Send magic link"
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-sm text-text-secondary">
                Your email is only used for authentication and is never shared
                with third parties.
              </p>
              <p className="text-sm">
                <a
                  href="/dashboard"
                  className="text-primary-emphasis hover:underline cursor-pointer"
                >
                  Manage your ConsentKeys accounts
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
