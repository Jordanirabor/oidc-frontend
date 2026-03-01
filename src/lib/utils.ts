import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift() || null;
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

/**
 * Validate referral code format
 * Expected format: REF-XXXXX (where X is alphanumeric) or bypass codes
 */
export function isValidReferralCode(code: string): boolean {
  if (!code) return false;

  // Allow bypass codes
  const bypassCodes = ["consent-keys-new-user"];
  if (bypassCodes.includes(code)) return true;

  // Format: REF- followed by 5+ alphanumeric characters
  const referralCodeRegex = /^REF-[A-Z0-9]{5,}$/i;
  return referralCodeRegex.test(code);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Get the documentation URL from environment variable
 * Defaults to https://docs.consentkeys.com if not set
 */
export const DOCS_URL =
  process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.consentkeys.com";