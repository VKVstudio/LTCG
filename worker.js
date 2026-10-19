const REDIRECT_HOSTS = new Set([
  "www.ltcg.am",
  "ltcgarmenia.com",
  "www.ltcgarmenia.com",
  "ltcg.tax",
  "www.ltcg.tax",
]);

const CSP_HEADER = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://t.me https://wa.me mailto:",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'sha256-FGB6UuDDN3ITvUuuwx2nz16/Cr5IUVaiY9O7NRH8Exs=' 'sha256-PpG18IHQWLZgV8fxP9UuQ/rrlt0GXnicKAge7Ze5i+o=' https://static.cloudflareinsights.com",
  "connect-src 'self' https://cloudflareinsights.com https://*.cloudflareinsights.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "require-trusted-types-for 'script'",
  "upgrade-insecure-requests",
].join("; ");

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "autoplay=()",
  "camera=()",
  "display-capture=()",
  "encrypted-media=()",
  "fullscreen=(self)",
  "geolocation=()",
  "gyroscope=()",
  "hid=()",
  "idle-detection=()",
  "local-fonts=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "otp-credentials=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "serial=()",
  "usb=()",
  "web-share=(self)",
  "xr-spatial-tracking=()",
  "interest-cohort=()",
  "browsing-topics=()",
].join(", ");

const AGENT_DISCOVERY_LINKS = [
  '</.well-known/ai-catalog.json>; rel="api-catalog"; type="application/json"',
  '</.well-known/ard.json>; rel="service-desc"; type="application/json"',
  '</llms.txt>; rel="alternate"; type="text/plain"; title="LLM Summary"',
  '</llms-full.txt>; rel="alternate"; type="text/plain"; title="LLM Full Knowledge Base"',
  '</agent-skills/ltcg-legal-tax/SKILL.md>; rel="describedby"; type="text/markdown"; title="LTCG Agent Skill"',
].join(", ");

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (REDIRECT_HOSTS.has(host)) {
      url.hostname = "ltcg.am";
      url.protocol = "https:";
      url.port = "";
      return Response.redirect(url.toString(), 301);
    }

    const cleanSlugMatch = url.pathname.match(
      /^\/(home-ru|noyabr|pered-pereezdom|schet-v-banke|vnzh|ip-i-nalogi|rezidentstvo-i-crs|spravki-i-zakrytie)\/?$/
    );
    if (cleanSlugMatch) {
      const targetUrl = new URL(request.url);
      targetUrl.pathname = `/${cleanSlugMatch[1]}.html`;
      return Response.redirect(targetUrl.toString(), 301);
    }

    // Alias /.well-known/api-catalog and directory index routes
    let assetRequest = request;
    if (url.pathname === "/") {
      const aliasUrl = new URL(request.url);
      aliasUrl.pathname = "/index.html";
      assetRequest = new Request(aliasUrl.toString(), request);
    } else if (url.pathname === "/en" || url.pathname === "/en/") {
      const aliasUrl = new URL(request.url);
      aliasUrl.pathname = "/en/index.html";
      assetRequest = new Request(aliasUrl.toString(), request);
    } else if (url.pathname === "/hy" || url.pathname === "/hy/") {
      const aliasUrl = new URL(request.url);
      aliasUrl.pathname = "/hy/index.html";
      assetRequest = new Request(aliasUrl.toString(), request);
    } else if (url.pathname === "/.well-known/api-catalog") {
      const aliasUrl = new URL(request.url);
      aliasUrl.pathname = "/.well-known/ai-catalog.json";
      assetRequest = new Request(aliasUrl.toString(), request);
    }

    const res = await env.ASSETS.fetch(assetRequest);
    const headers = new Headers(res.headers);

    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", PERMISSIONS_POLICY);
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
    headers.set("Origin-Agent-Cluster", "?1");
    headers.set("X-DNS-Prefetch-Control", "off");
    headers.set("X-Permitted-Cross-Domain-Policies", "none");

    const contentType = (headers.get("Content-Type") || "").toLowerCase();
    const path = url.pathname;

    if (contentType.includes("text/html") || path === "/" || path.endsWith(".html")) {
      headers.set("Content-Security-Policy", CSP_HEADER);
      headers.set("Link", AGENT_DISCOVERY_LINKS);
      headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    } else if (path === "/llms.txt" || path === "/llms-full.txt") {
      headers.set("Content-Type", "text/plain; charset=utf-8");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Cache-Control", "public, max-age=3600");
    } else if (path.endsWith("/SKILL.md")) {
      headers.set("Content-Type", "text/markdown; charset=utf-8");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Cache-Control", "public, max-age=3600");
    } else if (path.startsWith("/.well-known/")) {
      headers.set("Content-Type", "application/json; charset=utf-8");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Cache-Control", "public, max-age=3600");
    } else if (
      path.startsWith("/assets/") ||
      path.startsWith("/css/min/") ||
      path.startsWith("/js/")
    ) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    if (host.endsWith(".workers.dev") || host.endsWith(".pages.dev")) {
      headers.set("X-Robots-Tag", "noindex, nofollow");
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  },
};
