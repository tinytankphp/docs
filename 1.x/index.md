# What is TinyTank?

TinyTank is a small PHP framework for sites that are **mostly static but need a little server-side
life**: a marketing site with a blog, a documentation hub, a tool with a single interactive page.
It gives you routing, Twig templates, reactive UI through [Datastar](https://data-star.dev), a
Markdown blog, translations and SEO, without a database or an admin panel.

TinyTank is freely inspired by [Craft CMS](https://craftcms.com), for its Twig-first templates,
content that templates query rather than receive, and image transforms, and by
[Datastar](https://data-star.dev), for its hypermedia approach: the server renders HTML, and the
browser stays light.

Everything a request needs (compiled routes, Twig templates, parsed blog posts, translations, the
Vite manifest) is built ahead of time into plain PHP files in `var/cache`. Opcache keeps those in
shared memory, so a production request does no parsing, no database queries and no file scanning.

```twig
{# A live search box: Datastar calls the server, which renders a Twig partial back. #}
<input data-bind:q data-on:input__debounce.200ms="{{ datastar.get('_partials/search') }}">
<ul id="results"></ul>
```

## What you get

| Area | What TinyTank provides |
|---|---|
| **Routing** | Symfony Routing, compiled to a PHP array; controllers or closures; named routes |
| **Templates** | Twig, compiled to PHP classes; `path()`, `t()`, `vite()`, `seo_tags()` and more |
| **Reactivity** | Datastar over server-sent events, with a Craft-style Twig API and signed template URLs |
| **Content** | A Markdown blog: one folder per post with its images, drafts, tags, search, pagination |
| **Languages** | `/it/…`-style URLs, `\|t` translations with plurals, a language switcher, translated posts |
| **SEO** | Titles, canonical URLs, Open Graph, Twitter cards, JSON-LD, hreflang, sitemap, Atom feeds |
| **Frontend** | Vite + Tailwind CSS with hot reload, inside DDEV |
| **Security** | Stateless CSRF protection, escaped Markdown, secrets only in the environment |
| **Deployment** | One command that compiles everything and refreshes the web server's Opcache |
| **Extending** | Services, Twig extensions, console commands and deploy steps, without editing the framework |

## Who it's for

TinyTank suits developers who know PHP and Twig and want a site that is fast, cheap to host and
easy to reason about, without a CMS. It is deliberately small: the framework itself is a few
thousand lines that you can read in an afternoon.

It is **not** a fit when you need user accounts, a database-backed admin, or editors who can't work
with Markdown files and git. Reach for a full framework or a CMS in those cases.

## How a site is built on it

A new site starts from the **TinyTank skeleton** ([tinytankphp/tinytank](https://github.com/tinytankphp/tinytank)),
which installs the framework, the [`tinytank/framework`](https://github.com/tinytankphp/framework)
package, with Composer. The site adds its own routes, controllers, templates and content, and
updates the framework with `composer update`.

[Install TinyTank →](./getting-started/installation)
