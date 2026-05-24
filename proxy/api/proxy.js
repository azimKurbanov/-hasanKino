// Vercel Edge Function: proxies free-stream embed URLs so they load from a non-UZ origin.
// Why: vidsrc.xyz et al are DNS-blocked on Uzbek ISPs. The user's browser hits
// kino-proxy-*.vercel.app (unblocked); we fetch the real embed server-side from US/EU
// and pipe back, rewriting nested resource URLs so they also funnel through us.
//
// Scope: HTML proxy. Rewrite src/href in <script>, <link>, <iframe>, <img>, <source>.
// Runtime fetch() inside the embed's JS that hits absolute domains is NOT intercepted —
// those providers may still fail. Acceptable for v1.

export const config = { runtime: 'edge' }

const PROXY_PATH = '/api/proxy'

const STRIP_RESPONSE_HEADERS = [
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
  'cross-origin-embedder-policy',
]

function proxify(origin, targetUrl) {
  return `${origin}${PROXY_PATH}?url=${encodeURIComponent(targetUrl)}`
}

// Resolve a possibly-relative URL against base; return proxified absolute URL.
function rewriteUrl(value, base, origin) {
  if (!value) return value
  if (value.startsWith(`${origin}${PROXY_PATH}`)) return value
  if (/^(data:|blob:|javascript:|about:|#|mailto:)/i.test(value)) return value
  try {
    const absolute = new URL(value, base).toString()
    if (!/^https?:/i.test(absolute)) return value
    return proxify(origin, absolute)
  } catch {
    return value
  }
}

// Regex-rewrite a single attribute across all matching tags.
// `tagPattern` like /(<script\b[^>]*\bsrc\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
function rewriteAttr(html, tag, attr, base, origin) {
  // Match: <tag ...attr="value"  or  attr='value'  or  attr=value
  const re = new RegExp(
    `(<${tag}\\b[^>]*?\\b${attr}\\s*=\\s*)(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'gi'
  )
  return html.replace(re, (_m, prefix, dq, sq, bare) => {
    const raw = dq ?? sq ?? bare
    const rewritten = rewriteUrl(raw, base, origin)
    if (dq != null)   return `${prefix}"${rewritten}"`
    if (sq != null)   return `${prefix}'${rewritten}'`
    return `${prefix}${rewritten}`
  })
}

// Inject a <base> so relative URLs in the embed resolve against its true origin.
// Browsers consult <base> before doing relative-URL resolution; with this, any
// runtime JS like `fetch('/api/foo')` will hit vidsrc.xyz/api/foo, not our proxy
// (we re-route that via the rewritten <script> src below — once JS loaded, its
// own absolute-URL fetches we can't intercept, but relative ones go through <base>).
//
// Actually NO — <base> with an external href would cause subresources to bypass our
// proxy. We want them THROUGH us. So we do not set <base>. Relative URLs are
// rewritten at parse time by our regex pass; runtime relative fetches will use the
// proxy URL as their document base (since the document was served from us), which
// means they hit OUR /api/proxy?url=... with a relative path — broken. Tradeoff.

export default async function handler(request) {
  const reqUrl = new URL(request.url)
  const target = reqUrl.searchParams.get('url')
  const origin = `${reqUrl.protocol}//${reqUrl.host}`

  if (!target) return new Response('Missing ?url= parameter', { status: 400 })

  let targetUrl
  try { targetUrl = new URL(target) } catch {
    return new Response('Invalid url', { status: 400 })
  }
  if (!/^https?:$/.test(targetUrl.protocol)) {
    return new Response('Only http/https allowed', { status: 400 })
  }

  let upstream
  try {
    upstream = await fetch(targetUrl.toString(), {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'accept': request.headers.get('accept') || '*/*',
        'accept-language': request.headers.get('accept-language') || 'en-US,en;q=0.9',
        'referer': targetUrl.origin + '/',
      },
      redirect: 'follow',
    })
  } catch (err) {
    return new Response(`Upstream fetch failed: ${err.message}`, { status: 502 })
  }

  // Strip blocking headers, add CORS.
  const headers = new Headers()
  upstream.headers.forEach((v, k) => {
    if (!STRIP_RESPONSE_HEADERS.includes(k.toLowerCase())) headers.set(k, v)
  })
  headers.set('access-control-allow-origin', '*')

  const ct = upstream.headers.get('content-type') || ''

  // Non-HTML passes through (CSS, JS, images, video chunks).
  if (!ct.includes('text/html')) {
    return new Response(upstream.body, { status: upstream.status, headers })
  }

  let html = await upstream.text()
  const base = upstream.url

  html = rewriteAttr(html, 'script', 'src',    base, origin)
  html = rewriteAttr(html, 'link',   'href',   base, origin)
  html = rewriteAttr(html, 'iframe', 'src',    base, origin)
  html = rewriteAttr(html, 'img',    'src',    base, origin)
  html = rewriteAttr(html, 'source', 'src',    base, origin)
  html = rewriteAttr(html, 'video',  'src',    base, origin)
  html = rewriteAttr(html, 'audio',  'src',    base, origin)
  html = rewriteAttr(html, 'form',   'action', base, origin)

  headers.set('content-type', 'text/html; charset=utf-8')
  headers.delete('content-length') // body size changed

  return new Response(html, { status: upstream.status, headers })
}
