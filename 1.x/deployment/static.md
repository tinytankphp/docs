# Static builds

The same site can also be published as **plain files**, for a static host such as Cloudflare Pages
or Netlify: no PHP on the server. You keep developing as usual (`npm run dev`, the PHP site at
your local address); only the last step changes.

```sh
npm run build
php bin/console build:static --base-url=https://example.com
```

The whole site is now in `deploy/`, ready for Cloudflare Pages: upload that folder.

::: warning Work in progress
Static builds are new. Static versions of search and forms, and a preview command, come next.
:::

## How it works

`build:static` renders every page through your site, in production mode, exactly as the PHP site
would answer it, and writes it as a file.

`build:static` writes each page where the host serves it at the same URL as the PHP site: for
Cloudflare Pages, `/blog/my-post` becomes `deploy/blog/my-post.html`, which Pages serves as
`/blog/my-post` (and redirects `/blog/my-post/` and `/blog/my-post.html` there). `/sitemap.xml` stays
`deploy/sitemap.xml`.

It finds the pages by following links, starting from the home page, the sitemap, the feed and
`robots.txt`: every post, page, collection item, page of a list and translation that something
links to. Pages nothing links to (like an unlisted page) go in `static.paths`.

It also copies `public/` (your asset build, the favicon, other files; not PHP) and publishes the
images and files of posts, pages and collections, with their responsive versions, then writes
`404.html` for unknown addresses.

The build has its own cache (`var/static-cache/`), so your development cache isn't touched. It only
ever empties a folder it wrote itself (marked by a `.tinytank-static` file).

## Configuration

Optional, in `config/app.php`:

```php
'static' => [
    'out' => 'deploy',                    // the output folder (or --out)
    'base_url' => 'https://example.com',  // the site's address once published (or --base-url;
                                          // default APP_URL): used in the sitemap, the feed and share tags
    'paths' => ['/style-guide'],          // pages nothing links to
    'host' => 'cloudflare',               // or 'none', or your own class (below); or --host
],
```

## Hosts

The PHP site sends more than pages: with each one, headers (the Content Security Policy, which
tells browsers what may run on the page, and other protections), and redirects (`/blog/page/1` to
`/blog`). A static host has no PHP to send them, so the build writes them in the host's own files.

| `host` | Files | |
|---|---|---|
| `cloudflare` (default) | `<path>.html`, `_headers`, `_redirects` | [Cloudflare Pages](https://developers.cloudflare.com/pages/) |
| `none` | `<path>.html`, redirects as small HTML pages | any other host (GitHub Pages, a plain web server); the headers are lost |

For Cloudflare Pages, `_headers` holds one rule for the whole site. Its Content Security Policy is
the strictest one that still lets every page work: what pages add to `img-src`, `media-src`,
`frame-src`, `font-src` or `style-src` (a video player's frame) is allowed site-wide, which is safe,
since those can't run code in the page; `script-src` and `connect-src` stay as the PHP site has
them. A page that adds a script source (`csp_allow()` in its template) gets a rule of its own. The
build stops if the site needs more rules than Cloudflare allows (100), or more redirects (2,000).
Vite's hashed files (`/build/…`) are cached for a year.

### Your own host

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

## What needs the server

A static site has no PHP behind it, so some features can't work there:

- Datastar actions that call the server: a template action (`datastar.get('_partials/search')`),
  a custom route (the skeleton's clock)
- forms that post to the site (the contact form)

The build finds them on every page and stops with a list:

```
/blog: a Datastar GET action to the server (template _partials/blog-results)
/contact: a form posting to the site (/contact)
```

Browser-only Datastar keeps working (toggles, tabs, the theme, anything with `data-signals` and no
`@get`/`@post`), and so do JavaScript modules.

For the rest, templates can tell they're being rendered for a static build:

```twig
{% if not site.static %}
    {# the live search: only on the PHP site #}
{% endif %}
```

Static versions of search (an index searched in the browser) and of forms (posting to a service
or a function) are planned. Until then, `--allow-dynamic` builds anyway, with the list as a warning.

## Broken links

A link to a file that doesn't exist (`/media/…`, `/build/…`) or a page that doesn't answer 200 fails
the build, with the page it was linked from.

## Preview

Cloudflare's own local server applies `_headers` and `_redirects` like the real host, so you see
the exact URLs, redirects and Content Security Policy before uploading:

```sh
npx wrangler pages dev deploy
```

A preview command is planned.
