import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supportedLocales = ["pt-BR", "en-US"];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // gets the path
  // http://localhost:3003/legere -> legere
  const path = request.nextUrl.pathname.split("/")[1];

  if (!supportedLocales.includes(path)) {
    // redirect to the default locale
    // gets the user's language
    const language = request.headers.get("accept-language");

    // gets the first that is supported
    const supportedLocale =
      language?.split(",").find((locale) => {
        return supportedLocales.includes(locale);
      }) || "en-US";

    return NextResponse.redirect(
      new URL(`/${supportedLocale}`, request.url)
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon).*)",
    // gets the path with "/"
    // http://localhost:3003/
    "/",
  ],
};
