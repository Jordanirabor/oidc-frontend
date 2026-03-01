import { fetchWithRetry, getCookie } from "@/lib/utils";
import { ReferralCodeResponse } from "@/types/referral";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseReferralCodeReturn {
  referralCode: string | null;
  referralCreatedAt: string | null;
  referralsEnabled: boolean;
  isLoading: boolean;
  isRegenerating: boolean;
  error: string | null;
  loadReferralCode: (accountId?: string) => Promise<void>;
  regenerateReferralCode: (accountId?: string) => Promise<void>;
}

export function useReferralCode(): UseReferralCodeReturn {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCreatedAt, setReferralCreatedAt] = useState<string | null>(
    null
  );
  const [referralsEnabled, setReferralsEnabled] = useState<boolean>(true); // Default to true for backward compatibility
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReferralCode = useCallback(async (accountId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const url = accountId
        ? `${backendUrl}/api/user/referral-code?accountId=${accountId}`
        : `${backendUrl}/api/user/referral-code`;

      const response = await fetchWithRetry(url, {
        credentials: "include",
      });

      if (response.ok) {
        const data: ReferralCodeResponse = await response.json();
        setReferralCode(data.referralCode);
        setReferralCreatedAt(data.createdAt || null);
        setReferralsEnabled(data.referralsEnabled ?? true); // Default to true if not provided
      } else {
        // Silent fail for 404s or auth errors on initial load (common when user isn't signed in yet)
        const isSilentStatus =
          response.status === 404 ||
          response.status === 401 ||
          response.status === 403;

        if (!isSilentStatus && process.env.NODE_ENV === "development") {
          const errorText = await response.text().catch(() => "");
          // Log as a string so Next's console overlay can't collapse/serialize it to `{}`.
          console.error(
            `[referral] Failed to load referral code: status=${
              response.status
            } statusText=${response.statusText} body=${
              errorText || "(empty response)"
            }`
          );
        }
        setReferralCode(null);
        setReferralCreatedAt(null);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Network error loading referral code", err);
      }
      // Don't set visible error state for initial load
    } finally {
      setIsLoading(false);
    }
  }, []);

  const regenerateReferralCode = useCallback(async (accountId?: string) => {
    setIsRegenerating(true);
    setError(null);
    try {
      // Guard: this function is often used as an onClick handler; React will pass a MouseEvent.
      // Only send accountId when it's actually a string.
      const safeAccountId =
        typeof accountId === "string" ? accountId : undefined;

      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const csrfToken = getCookie("csrf_token");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }

      const response = await fetchWithRetry(
        `${backendUrl}/api/user/referral-code/regenerate`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ accountId: safeAccountId }),
        }
      );

      if (response.ok) {
        const data: ReferralCodeResponse = await response.json();
        setReferralCode(data.referralCode);
        setReferralCreatedAt(data.createdAt || null);
        toast.success("Referral code regenerated successfully");
      } else {
        const errorText = await response.text();
        let errorMessage = "Failed to regenerate referral code";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage =
            errorData.error_description || errorData.error || errorMessage;
        } catch {
          if (process.env.NODE_ENV === "development") {
            console.error("Non-JSON error response:", errorText);
          }
        }
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error regenerating referral code", err);
      }
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRegenerating(false);
    }
  }, []);

  return {
    referralCode,
    referralCreatedAt,
    referralsEnabled,
    isLoading,
    isRegenerating,
    error,
    loadReferralCode,
    regenerateReferralCode,
  };
}
