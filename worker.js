const REDIRECT_HOSTS = new Set([
  "www.ltcg.am",
  "ltcgarmenia.com",
  "www.ltcgarmenia.com",
  "ltcg.tax",
  "www.ltcg.tax",
]);

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

    const res = await env.ASSETS.fetch(request);
    if (host.endsWith(".workers.dev") || host.endsWith(".pages.dev")) {
      const headers = new Headers(res.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    }
    return res;
  },
};
