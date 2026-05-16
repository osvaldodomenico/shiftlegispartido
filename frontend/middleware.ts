import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const blockedPrefixes = new Set([
  "alert",
  "analytics",
  "avatar",
  "badge",
  "basic-table",
  "booking",
  "buttons",
  "call-center",
  "card",
  "chat",
  "colors",
  "column-chart",
  "crm",
  "cryptocurrency",
  "dropdown",
  "ecommerce",
  "email-details",
  "form-validation",
  "help",
  "input-forms",
  "input-layout",
  "inventory",
  "investment",
  "line-chart",
  "list",
  "lms",
  "marketdetails",
  "marketplace",
  "medical",
  "nft",
  "notification-alert",
  "pagination",
  "pie-chart",
  "podcast",
  "pricing",
  "progress-bar",
  "project-management",
  "radio",
  "real-estate",
  "sales",
  "sass",
  "settings-notification",
  "switch",
  "tab-accordion",
  "tags",
  "tooltip",
  "typography",
  "users-grid",
  "users-list",
  "wallet",
  "widgets",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/finance") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (firstSegment && blockedPrefixes.has(firstSegment)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
