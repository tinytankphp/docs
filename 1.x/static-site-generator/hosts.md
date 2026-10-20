# Hosts

The PHP site sends more than pages: with each one, headers (the Content Security Policy, which
tells browsers what may run on the page, and other protections), and redirects (`/blog/page/1` to
`/blog`). A static host has no PHP to send them, so the build writes them in the host's own files.

| `host` | Files | |
|---|---|---|
| `cloudflare` (default) | `<path>.html`, `_headers`, `_redirects`, `wrangler.jsonc`, and for [forms](./forms) `worker.js` | [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) with static assets |
| `none` | `<path>.html`, redirects as small HTML pages | any other host (GitHub Pages, a plain web server); the headers are lost |

## Cloudflare

`_headers` holds one rule for the whole site. Its Content Security Policy is
the strictest one that still lets every page work: what pages add to `img-src`, `media-src`,
`frame-src`, `font-src` or `style-src` (a video player's frame) is allowed site-wide, which is safe,
since those can't run code in the page; `script-src` and `connect-src` stay as the PHP site has
them. A page that adds a script source (`csp_allow()` in its template) gets a rule of its own. The
build stops if the site needs more rules than Cloudflare allows (100), or more redirects (2,000).
Vite's hashed files (`/build/…`) are cached for a year. `wrangler.jsonc` tells `npx wrangler deploy`
what to publish; it, `worker.js` and `.assetsignore` (the list of files never served) stay private.

## Your own host

A class implementing `TinyTank\Static\HostAdapter`, named in `config/app.php`
(`'host' => App\Static\MyHost::class`), with a constructor without arguments:

```php
use TinyTank\Static\Build;
use TinyTank\Static\HostAdapter;

final class MyHost implements HostAdapter
{
    /** Where a page goes, so the host serves it at the same URL: '/blog' → 'blog.html'. */
    public function file(string $path): string { … }

    /**
     * The host's own files, path => contents, from the build: $build->pages (each with the
     * `headers` the PHP site sends it) and $build->redirects (`to`, `status`).
     */
    public function files(Build $build): array { … }
}
```
