import { NextRequest, NextResponse } from "next/server";

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use environment variable for backend URL, fallback to localhost for development
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

    const response = await fetch(`${backendUrl}/consent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PseudoIDC-Frontend/1.0",
      },
      body: JSON.stringify(body),
      // Add timeout for external service calls
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

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
    console.error("Consent processing error:", error);
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
