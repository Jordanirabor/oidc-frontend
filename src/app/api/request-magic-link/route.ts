import { NextRequest, NextResponse } from "next/server";

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
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

    console.log(`Environment BACKEND_URL: ${process.env.BACKEND_URL}`);
    console.log(`Using backend URL: ${backendUrl}`);
    console.log(`Full request URL: ${backendUrl}/request-magic-link`);
    console.log(
      "Request body received from frontend:",
      JSON.stringify(body, null, 2)
    );

    // Validate required fields
    const requiredFields = ["email", "client_id", "redirect_uri", "scope"];
    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      console.error("Body values:", {
        email: body.email,
        client_id: body.client_id,
        redirect_uri: body.redirect_uri,
        scope: body.scope,
      });
    }

    console.log("About to make fetch request...");

    const response = await fetch(`${backendUrl}/request-magic-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add timeout and proper error handling for external backend communication
        "User-Agent": "PseudoIDC-Frontend/1.0",
      },
      body: JSON.stringify(body),
      // Add timeout for external service calls
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    console.log(`Backend response status: ${response.status}`);
    console.log(
      `Backend response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text();
      console.error("Backend returned non-JSON response:", textResponse);
      return NextResponse.json(
        {
          error: "backend_error",
          error_description: `Backend returned ${
            response.status
          }: ${textResponse.substring(0, 200)}`,
        },
        {
          status: 502,
          headers: {
            "Access-Control-Allow-Origin":
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
          },
        }
      );
    }

    const data = await response.json();
    console.log("Backend response data:", data);

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
    console.error("Magic link request error:", error);

    // More detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "server_error",
        error_description: `Internal server error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
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
