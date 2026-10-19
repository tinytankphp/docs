# Static builds

The same site can also be published as **plain files**, for a static host such as Cloudflare Pages
or Netlify: no PHP on the server. You keep developing as usual (`npm run dev`, the PHP site at
your local address); only the last step changes.

```sh
npm run build
php bin/console build:static --base-url=https://example.com
```

The whole site is now in `deploy/`: upload that folder.

::: warning Work in progress
Static builds are new. This page describes what exists today: the build itself. The host's own
files (headers and redirects, see below) and static versions of search and forms come next.
:::

## How it works

`build:static` renders every page through your site, in production mode, exactly as the PHP site
would answer it, and writes it as a file: `/blog/my-post` becomes `deploy/blog/my-post/index.html`,
`/sitemap.xml` stays `deploy/sitemap.xml`.

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
],
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

Any static file server will do, for example PHP's:

```sh
php -S localhost:8080 -t deploy
```

The host's headers (the Content Security Policy) and redirects aren't part of that preview: they
come with the host files.
