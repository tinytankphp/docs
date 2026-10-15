# Security

## CSRF protection

POST, PUT, PATCH and DELETE requests must come from your own site. TinyTank uses Symfony's
[`SameOriginCsrfTokenManager`](https://symfony.com/doc/current/security/csrf.html#stateless-csrf-tokens):
the browser's `Sec-Fetch-Site` header (or `Origin` / `Referer`) must show the request came from this
site, otherwise it gets a **403**.

There's no token, no cookie and no session. Every browser sends these headers with `fetch()`, which
is how Datastar makes its requests, so nothing needs adding to forms or actions.

A route that must accept requests from elsewhere (a webhook, say) can opt out:

```php
$app->route(['POST'], '/webhooks/payments', [WebhookController::class, 'handle'], 'webhook', csrf: false);
```

Verify those requests another way, for example with the provider's signature.

Behind a reverse proxy, set `APP_TRUSTED_PROXIES` so the check sees the public host and scheme.

## Secrets

- Secrets only come from the environment or `.env`, which lives outside the `public/` web root
  and is never committed. `config/app.php` refuses to boot without `APP_SECRET`.
- Vite only inlines variables prefixed `VITE_PUBLIC_` into the bundle, so server variables can't
  reach the frontend.
- Config values reach the browser only through the `public` allowlist in `config/app.php`
  (`publicConfig()` in JavaScript), and a value containing `APP_SECRET` stops the app from booting.
- Variables passed to `datastar.get(…)` are signed but readable: never pass secrets through them.

## Images

Published images are re-saved without metadata, so a photo's GPS position, device or time never
reaches the site (see [Images](./features/images#privacy-no-metadata)).

## Forms

Form posts pass the same-origin check like every POST. Values are cleaned (no control characters, no
line breaks in single-line fields, a maximum length), the visitor only ever goes in Reply-To, and
spam checks run on this server without third parties (see [Forms](./features/forms#spam-protection)).

## Content

- Markdown is rendered with raw HTML escaped and `javascript:` links removed.
- Twig escapes all output by default.
- JSON-LD is encoded so that `</script>` in any value can't break out of the tag.
- Only whitelisted file types in a post folder are ever served or published.
- SVGs are served with a script-blocking policy in development; in production, treat SVGs from
  others as code.

## Responses

- Every response sends `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin` and `X-Frame-Options: SAMEORIGIN`.
- Pages send a strict Content Security Policy (below).
- Absolute URLs come from `APP_URL` only, so a forged `Host` header can't poison cached pages.
- Production errors are logged, never shown: visitors get a generic error page. The log holds no IP
  addresses, query strings or function arguments, and is deleted after 14 days ([Logging](./features/logging)).

## Deployment

- There's no HTTP endpoint for deployment tasks: cachetool reaches PHP-FPM through its local socket.
- The reload command comes from the server's own configuration; keep `.env` writable only by the
  deploy user.
- The cachetool phar is pinned to a version and checked against its SHA-256 hash.

## Content Security Policy

Every page tells the browser where it may load things from. By default that's **only your own
site**, so even if someone managed to inject markup into a page, the browser would refuse to load
their script, send data to their server or frame their page.

The default policy:

| Directive | Sources | Why |
|---|---|---|
| `default-src` | `'self'` | anything not listed below: your site only |
| `script-src` | `'self' 'unsafe-eval'` + the theme script's hash | your bundles; Datastar evaluates its `data-*` expressions as functions |
| `style-src` | `'self'` | your CSS |
| `style-src-attr` | `'unsafe-inline'` | `style="…"` attributes (e.g. `display: none` before `data-show` runs); they can't load anything |
| `img-src` | `'self' data:` | the icons are SVGs inlined in the CSS |
| `font-src`, `connect-src`, `media-src` | `'self'` | |
| `object-src` | `'none'` | no plugins |
| `base-uri`, `form-action`, `frame-ancestors` | `'self'` | no `<base>` hijacking, forms only post to you, only you may frame your pages |

There are no per-request nonces: a nonce makes every response different, which would break ETags and
public caching. The one inline script, the theme script, is allowed by its hash, which never changes.
The JSON blocks (`public_config()`, JSON-LD) are data, not scripts, so the policy doesn't apply to
them.

While the Vite dev server runs (debug mode), its origin and WebSocket are allowed too. With
`MEDIA_URL` set, its host is allowed in `img-src` and `media-src`.

### Allowing other hosts

When a feature needs another host (a video player, analytics, a CDN), add it to the directive it
needs in `config/app.php`:

```php
'csp' => [
    'enabled' => true,
    'report_only' => false,
    'sources' => [
        'frame-src' => ['https://www.youtube-nocookie.com'],
        'media-src' => ['https://cdn.example.com'],
    ],
],
```

or from `config/bootstrap.php`:

```php
$app->csp->allow('script-src', 'https://plausible.io')->allow('connect-src', 'https://plausible.io');
```

A directive the policy doesn't list yet (like `frame-src`) starts from `'self'`. Unknown directives
and sources containing spaces, `;` or `,` are refused, so a typo can't silently break the policy.

To try a change without breaking anything, set `report_only` to `true`: browsers then only report
what they would block, in the developer console. A controller can send its own
`Content-Security-Policy` header for one page; TinyTank then leaves it alone.

### Sources for one page

Components can allow a source on the page they appear on with `{% do csp_allow('frame-src', '…') %}`
(see [Content components](./content/components#allowing-sources-for-a-component)). The built-in video
components do this for their player, so `frame-src` lists YouTube or Vimeo only on pages that show a
video. Everything else keeps the site's policy.

### Inline scripts from Datastar

`execute_script()` runs its code as an inline `<script>`, which the policy blocks. Allow each script
by its exact code:

```php
$app->csp->allowScript("console.log('updated')");
```

Patching elements and signals needs nothing in the policy, so prefer those.

## Reporting a vulnerability

Please report security problems privately, not in a public issue: the framework repository's
**Security** tab → [Report a vulnerability](https://github.com/tinytankphp/framework/security/advisories/new).
See its [security policy](https://github.com/tinytankphp/framework/blob/main/SECURITY.md).

