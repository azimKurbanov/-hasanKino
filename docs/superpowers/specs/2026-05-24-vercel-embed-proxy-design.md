# Vercel Embed Proxy — Design

**Date:** 2026-05-24
**Status:** approved (verbal)
**Context:** KINO movie site frontend (client/, Vite+React) needs to play stream embeds. All known free embed providers (vidsrc.xyz, 2embed.cc, vidlink.pro, etc.) are DNS-blocked on UZ ISP. Memory: `embed-providers-blocked.md`. A proxy outside Uzbekistan is the only way to reach them.

## Goal

Let the in-app video player load `vidsrc.xyz`-family embed URLs by routing them through a Vercel Edge Function that runs outside UZ, so the user's browser only talks to `*.vercel.app` (not blocked).

Non-goals (this iteration):
- m3u8/CDN chunk proxying — only the embed HTML is proxied. If the embed's CDN is also blocked, we accept failure for that provider.
- Authentication on the proxy.
- Service Worker runtime fetch interception.

## Architecture

```
Browser (UZ)
  └─ <iframe src="https://kino-proxy-xxx.vercel.app/api/proxy?url=https://vidsrc.xyz/embed/movie/123">
       │
       ▼
     Vercel Edge Function (US/EU)
       ├─ fetch(decodeURIComponent(url))
       ├─ Strip headers: X-Frame-Options, Content-Security-Policy (frame-ancestors)
       ├─ HTMLRewriter:
       │    <script src> → /api/proxy?url=...  (if abs URL)
       │    <link  href> → /api/proxy?url=...
       │    <iframe src> → /api/proxy?url=...
       │    <img  src>   → /api/proxy?url=...
       │    <a    href>  → keep (user nav)
       └─ Stream response back
```

## Files

```
proxy/
  api/proxy.js     # Edge Function — fetch + HTMLRewriter + header strip
  package.json     # type: module, no deps
  vercel.json      # functions: { runtime: edge }
  README.md        # deploy commands

client/
  .env.example     # add VITE_EMBED_PROXY_URL=
  src/components/VideoPlayer.jsx  # withProxy() helper, applied to STREAMING_EMBEDS URLs
```

## Behavior

- `STREAMING_EMBEDS.movie(id)` and `.tv(...)` URLs are wrapped through `withProxy()` before becoming iframe `src`.
- YouTube trailer URL is NOT wrapped (YouTube isn't blocked).
- If `VITE_EMBED_PROXY_URL` is unset, `withProxy()` returns the original URL — backward compat for non-UZ users.

## Risks (accepted)

- vidlink/vidsrc.cc may use absolute URLs in JS that HTMLRewriter cannot intercept — those providers may not work. User can switch source manually in the player.
- Vercel Hobby limit: 100GB/month bandwidth, 100k Edge invocations/day. For personal use: fine.
- Provider domains rot/move — periodic maintenance expected.

## Deploy steps (user)

```bash
cd proxy
npm i -g vercel
vercel login
vercel --prod
# Copy URL → client/.env → VITE_EMBED_PROXY_URL
```

## Verification (after deploy)

In playwright:
1. Set `VITE_EMBED_PROXY_URL` and restart dev.
2. Navigate to a movie page, switch player source to VidSrc.xyz.
3. Wait — should NOT show "Не удалось найти IP-адрес".
4. Iframe should at minimum load vidsrc's player UI; playback success depends on CDN reachability.
