"use client";

import ConsentForm from "@/components/forms/consent-form";
import { ReferralCodeCard } from "@/components/referral-code-card";
import { useReferralCode } from "@/hooks/use-referral-code";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  referralsEnabled?: boolean; // Optional - indicates if referral system is enabled
}

function ConsentPageContent() {
  const searchParams = useSearchParams();
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<
    "allow" | "deny" | null
  >(null);
  const [error, setError] = useState("");

  const sessionId = searchParams.get("session");

  // Use the referral code hook
  const {
    referralCode,
    referralCreatedAt,
    isRegenerating,
    loadReferralCode,
    regenerateReferralCode,
  } = useReferralCode();

  const fetchConsentData = useCallback(async () => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${backendUrl}/consent-data?session=${sessionId}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      if (response.ok) {
        setConsentData(data);
      } else {
        const errorMsg =
          data.error_description || "Failed to load consent data";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = "Network error. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    const loadConsentData = async () => {
      if (sessionId) {
        await fetchConsentData();
      } else {
        setError("Invalid session");
        setIsLoading(false);
      }
    };
    loadConsentData();
  }, [sessionId, fetchConsentData]);

  // Load referral code only if referrals are enabled
  useEffect(() => {
    if (consentData?.referralsEnabled) {
      loadReferralCode();
    }
  }, [consentData?.referralsEnabled, loadReferralCode]);

  const handleConsent = async (allow: boolean) => {
    setIsSubmitting(true);
    setSubmittingAction(allow ? "allow" : "deny");
    setError("");

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/consent`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          consent: allow,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the client application
        window.location.href = data.redirectUrl;
      } else {
        const errorMsg = data.error_description || "Failed to process consent";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = "Network error. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-5 flex justify-center">
            <Image
              src="/consentkeys.svg"
              alt="ConsentKeys"
              width={150}
              height={60}
            />
          </div>
          <div className="bg-primary/15 py-8 px-4 shadow sm:px-10">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-ring animate-spin" />
              </div>
              <p className="mt-4 text-text-muted">
                Loading consent information...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !consentData) {
    return (
      <div className="min-h-screen bg-bg-20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="text-center mb-5 flex justify-center">
              <Image
                src="/consentkeys.svg"
                alt="ConsentKeys"
                width={150}
                height={60}
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-none p-6">
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
                Error
              </h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-20 flex flex-col justify-center py-8 px-4">
      <div className="text-center mb-6">
        <Image
          src="/consentkeys.svg"
          alt="ConsentKeys"
          width={150}
          height={60}
          className="mx-auto"
        />
      </div>

      <div className={`mx-auto w-full ${
        referralCode 
          ? "max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start" 
          : "max-w-xl"
      }`}>
        {/* Left Column - Consent Form */}
        <div className="w-full">
          <ConsentForm
            consentData={consentData}
            onConsent={handleConsent}
            isSubmitting={isSubmitting}
            submittingAction={submittingAction}
            error={error}
          />
        </div>

        {/* Right Column - Referral Code */}
        {referralCode && (
          <div className="w-full">
            <ReferralCodeCard
              code={referralCode}
              createdAt={referralCreatedAt}
              onRegenerate={regenerateReferralCode}
              isRegenerating={isRegenerating}
              variant="consent"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConsentPageContent />
    </Suspense>
  );
}
