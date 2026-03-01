/**
 * Backend API utility functions for making requests to the backend service
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export interface BackendApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string | FormData | null;
  timeout?: number;
}

export class BackendApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

/**
 * Make a request to the backend API with proper error handling and timeouts
 */
export async function backendApiRequest(
  endpoint: string,
  options: BackendApiOptions = {}
): Promise<Record<string, unknown>> {
  const { method = "GET", headers = {}, body, timeout = 30000 } = options;

  const url = `${BACKEND_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  console.log(`[Backend API] ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...(body && {
        body:
          typeof body === "string" || body instanceof FormData
            ? body
            : JSON.stringify(body),
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      console.error(
        `[Backend API] Error response: ${response.status} ${response.statusText}`
      );

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: "Backend error",
          message: `Backend returned ${response.status}: ${response.statusText}`,
        };
      }

      throw new BackendApiError(
        errorData.message || `Backend returned ${response.status}`,
        response.status,
        errorData.error,
        errorData
      );
    }

    const data = await response.json();
    console.log(`[Backend API] Success: ${method} ${url}`);
    return data;
  } catch (error: unknown) {
    console.error(`[Backend API] Request failed: ${method} ${url}`, error);

    // Re-throw BackendApiError as-is
    if (error instanceof BackendApiError) {
      throw error;
    }

    // Handle different types of network errors
    let errorMessage = "Failed to connect to backend service";
    let errorCode = "BACKEND_ERROR";

    const errorObj = error as {
      name?: string;
      code?: string;
      message?: string;
    };

    if (
      errorObj.name === "TimeoutError" ||
      errorObj.code === "UND_ERR_CONNECT_TIMEOUT"
    ) {
      errorMessage = "Backend service is not responding (timeout)";
      errorCode = "TIMEOUT";
    } else if (errorObj.code === "ECONNREFUSED") {
      errorMessage = "Cannot connect to backend service (connection refused)";
      errorCode = "CONNECTION_REFUSED";
    } else if (errorObj.code === "ENOTFOUND") {
      errorMessage = "Backend service not found (DNS error)";
      errorCode = "DNS_ERROR";
    } else if (errorObj.code === "ECONNRESET") {
      errorMessage = "Connection to backend service was reset";
      errorCode = "CONNECTION_RESET";
    }

    throw new BackendApiError(errorMessage, 500, errorCode, {
      originalError: errorObj.message || String(error),
      url,
      method,
    });
  }
}

/**
 * Convert BackendApiError to Next.js Response
 */
export function handleBackendApiError(error: unknown) {
  if (error instanceof BackendApiError) {
    return {
      status: error.status || 500,
      body: {
        error: error.code || "Backend error",
        message: error.message,
        ...(process.env.NODE_ENV === "development" && {
          details: error.details,
        }),
      },
    };
  }

  // Fallback for unexpected errors
  const errorObj = error as { message?: string };
  return {
    status: 500,
    body: {
      error: "Internal server error",
      message: "An unexpected error occurred",
      ...(process.env.NODE_ENV === "development" && {
        details: errorObj.message || String(error),
      }),
    },
  };
}
