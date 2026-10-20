# Static Site Generator

The same TinyTank site can be published two ways: as the **PHP site** (on a server with PHP,
[Deploying](../deployment/)), or as **plain files** for a static host such as Cloudflare, with no PHP
on the server. TinyTank is then a static site generator, with everything you develop with: Twig
templates, Markdown content, data collections, translations, SEO, responsive images, Datastar in
the browser, and even forms.

You keep developing as usual (`npm run dev`, the PHP site at your local address); only the last
step changes:

```sh
npm run build                             # the CSS and JavaScript
php bin/console build:static              # the whole site, as files, in deploy/
php bin/console preview:static            # check it locally, as the host will serve it
php bin/console publish:static            # put it online (Cloudflare Workers)
```

## Static or PHP?

| | Static | PHP |
|---|---|---|
| Hosting | free on Cloudflare for most sites; nothing to maintain or update | a server with PHP 8.4 |
| Speed and resilience | every page is a file, served from Cloudflare's network | fast too (compiled ahead of time, [CDN caching](../deployment/cdn) optional) |
| Forms | sent by a small Worker ([Forms](./forms)): checks and spam honeypot, no rate limit | everything ([Forms](../features/forms)) |
| Server-side features | none: [what needs the server](./what-needs-the-server) is listed by the build | routes and controllers, Datastar server actions |
| Changes go live | rebuild and publish | `bin/console deploy` |

Most sites that only show content (a studio, a portfolio, a blog, documentation) can be static.
You can switch at any time: the same site builds both ways.

## In this section

- [How it works](./how-it-works): how pages are found and written, and broken links.
- [Configuration](./configuration): the `static` options in `config/app.php`.
- [What needs the server](./what-needs-the-server): what can't work without PHP, and `site.static`.
- [Search](./search): the blog search, filtered in the browser.
- [Forms](./forms): contact forms answered by a Cloudflare Worker.
- [Hosts](./hosts): Cloudflare, any static host, or your own adapter.
- [Preview](./preview): the build served locally, exactly as published.
- [Publishing](./publishing): the API token and `publish:static`.
- [Troubleshooting](./troubleshooting): what can go wrong, and how to find out why.
