import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Handle API errors and redirect based on status code and current path
 */
export function handleApiError(
  error: { status?: number },
  router: AppRouterInstance,
  currentPath: string
) {
  // Check for 401 (Unauthorized) or 403 (Forbidden)
  if (error?.status === 401 || error?.status === 403) {
    if (currentPath === "/dashboard") {
      // If on dashboard, redirect to login
      router.push("/auth");
    } else {
      // Anywhere else (including admin pages), redirect to dashboard
      router.push("/dashboard");
    }
    return true; // Handled
  }
  return false; // Not handled
}

/**
 * Wrapper for fetch that handles auth redirects
 */
export async function fetchWithAuth(
  url: string,
  router: AppRouterInstance,
  currentPath: string,
  options: RequestInit = {}
) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      // Create error object compatible with our handler
      const error = { status: response.status };

      if (handleApiError(error, router, currentPath)) {
        // Redirect initiated, return null or throw specific error
        return null;
      }

      // If not handled (e.g. 500, 404), throw or return response
      // For consistency with normal fetch, we return the response
      // but the caller should check response.ok
    }

    return response;
  } catch (error) {
    throw error;
  }
}
