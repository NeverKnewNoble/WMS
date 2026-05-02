// Next 16 renamed Middleware → Proxy. The Auth.js v5 `auth` helper still
// works as a request-aware function and applies the `authorized` callback
// declared in src/lib/auth.ts.
export { auth as proxy } from "@/lib/auth";

export const config = {
  // Run on every route except Next internals, the auth route, and static assets.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
