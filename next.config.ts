import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy without nonces. Nonces would force every page to
 * render dynamically, defeating Cache Components / Partial Prerendering, so
 * inline scripts are allowed ('unsafe-inline', needed for Next's RSC payload).
 * Everything else is locked to our own origin: no third-party scripts,
 * no framing, no plugins, and forms can only post back to us.
 * XSS is primarily prevented by React escaping and markdown rendered without
 * raw HTML. Trade-off documented in the README.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only behind HTTPS (Vercel); would break `next start` over plain http.
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

/** Security headers applied to every route. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Opt-in caching with `use cache` + Partial Prerendering by default.
  cacheComponents: true,
  // Compile-time checking of <Link href> and router navigation targets.
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
