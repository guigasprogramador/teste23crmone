import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Public routes that don't require authentication
const publicRoutes = [
  "/auth",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/microsoft",
  "/api/auth/microsoft/callback",
];

// Function to check if a route is public
const isPublicRoute = (path: string) => {
  return publicRoutes.some((route) => path.startsWith(route)) || path.startsWith("/_next") || path.startsWith("/favicon.ico");
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if it's a public route
  if (isPublicRoute(path)) {
    return NextResponse.next();
  }
  
  // Check for access token cookie
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  
  // If there's no access token, try to use refresh token
  if (!accessToken) {
    // If there's no refresh token either, redirect to login
    if (!refreshToken) {
      const url = new URL("/auth/login", request.url);
      url.searchParams.set("redirect", encodeURIComponent(request.nextUrl.pathname));
      return NextResponse.redirect(url);
    }
    
    // Try to get a new access token using the refresh token
    try {
      const response = await fetch(new URL("/api/auth/refresh", request.url).toString(), {
        method: "GET",
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      
      const data = await response.json();
      
      // If token refresh successful, continue with the request and set the new token
      const newResponse = NextResponse.next();
      newResponse.cookies.set({
        name: "accessToken",
        value: data.accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      });
      
      return newResponse;
    } catch (error) {
      // If token refresh fails, redirect to login
      const url = new URL("/auth/login", request.url);
      url.searchParams.set("redirect", encodeURIComponent(request.nextUrl.pathname));
      return NextResponse.redirect(url);
    }
  }
  
  // Verify access token
  try {
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");
    await jwtVerify(accessToken, JWT_SECRET);
    
    // Token is valid, continue with the request
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, try to use refresh token
    if (refreshToken) {
      return NextResponse.redirect(new URL("/api/auth/refresh?redirect=" + encodeURIComponent(request.nextUrl.pathname), request.url));
    }
    
    // If no refresh token, redirect to login
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("redirect", encodeURIComponent(request.nextUrl.pathname));
    return NextResponse.redirect(url);
  }
}

// Configuration for the middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
