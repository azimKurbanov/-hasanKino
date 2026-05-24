# kino-proxy

Edge proxy for the KINO movie site. Bypasses UZ ISP DNS blocks on free stream embeds
(`vidsrc.xyz`, `2embed.cc`, etc.) by fetching them server-side from a non-UZ origin
and rewriting nested resource URLs to also go through this proxy.

## Deploy

```bash
npm i -g vercel        # one-time
vercel login           # opens browser, login via GitHub
vercel --prod          # from inside this proxy/ folder
```

Vercel prints something like `https://kino-proxy-xxxx.vercel.app`. Put that into
the main project's `client/.env`:

```
VITE_EMBED_PROXY_URL=https://kino-proxy-xxxx.vercel.app
```

Then restart `client && npm run dev`. The video player will route stream embed iframes
through the proxy automatically.

## Endpoint

```
GET /api/proxy?url=<absolute-encoded-url>
```

Returns the upstream response with `X-Frame-Options` and `Content-Security-Policy`
headers stripped, and any `<script src>`/`<link href>`/`<iframe src>`/`<img src>` etc.
inside HTML responses rewritten to also go through `/api/proxy`.

## Limits

- Vercel Hobby plan: 100k Edge invocations/day, 100GB bandwidth/month.
- HTMLRewriting is regex-based (Edge runtime has no HTMLRewriter). Robust enough for
  vidsrc-family providers; absolute URLs constructed at runtime inside JS are NOT
  intercepted, so some providers may still fail. Switch source manually in the player.
