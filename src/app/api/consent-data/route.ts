import { NextRequest, NextResponse } from "next/server";

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session");

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Missing session parameter",
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin":
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
          },
        }
      );
    }

    // Use environment variable for backend URL, fallback to localhost for development
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

    const response = await fetch(
      `${backendUrl}/consent-data?session=${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "PseudoIDC-Frontend/1.0",
        },
        // Add timeout for external service calls
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }
    );

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, {
        headers: {
          "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
        },
      });
    } else {
      return NextResponse.json(data, {
        status: response.status,
        headers: {
          "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
        },
      });
    }
  } catch (error) {
    console.error("Consent data fetch error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "Internal server error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
        },
      }
    );
  }
}
