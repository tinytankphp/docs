# Installation

## Requirements

- **PHP 8.4** with the `intl`, `mbstring`, `xmlwriter` and `opcache` extensions (Composer checks all but
  `opcache`), and **GD or Imagick** with WebP support for responsive images
- **Composer 2**
- **Node.js 22+** and npm, for the asset build
- For local development: **[DDEV](https://ddev.com)** (recommended), which provides all of the above
  in Docker

## Create a site

A TinyTank site starts from the **skeleton**, [tinytankphp/tinytank](https://github.com/tinytankphp/tinytank).
With Composer:

```sh
composer create-project tinytank/tinytank my-site
cd my-site && git init
```

Composer copies the skeleton, installs the framework (the `tinytank/framework` package, from
[Packagist](https://packagist.org/packages/tinytank/framework)), then **prepares the site** for you:

- names it after its folder: `composer.json`, `package.json`, the DDEV project (`my-site.ddev.site`);
- creates `.env` with a fresh `APP_SECRET`, the local address and debug mode on;
- lets git track `composer.lock`, so every server installs exactly what you tested;
- points CI at that lock file, and removes the files about developing TinyTank itself
  (`ROADMAP.md`, `CONTRIBUTING.md`, TinyTank's `LICENSE` and `SECURITY.md`).

::: details With GitHub's "Use this template" button
On [tinytankphp/tinytank](https://github.com/tinytankphp/tinytank), click **Use this template** to
create your site's repository, clone it, then run the preparation yourself, once:

```sh
git clone git@github.com:you/my-site.git && cd my-site
php bin/create-site.php
```
:::

## Configure

`.env` holds the settings that differ per machine; the preparation step filled in the essentials:

```ini
APP_SECRET=…                                  # signs Datastar requests; generated for you
APP_URL=https://my-site.ddev.site             # your site's public URL, no trailing slash
APP_DEBUG=1                                   # development mode
```

`APP_URL` is used for every absolute URL (canonical links, Open Graph, sitemap, feeds). Both
`APP_SECRET` and `APP_URL` are required: the app refuses to boot without them. A new secret:
`openssl rand -hex 32`. See [Configuration](../basics/configuration) for everything else.

## Run it with DDEV

```sh
ddev start
ddev composer install                # after the template button: ddev composer update
ddev npm install
ddev npm run dev                     # Vite + Tailwind with hot reload
```

Open `https://my-site.ddev.site`. Editing a template, a post or a translation reloads the page;
CSS changes apply without a reload.

::: warning Assets first
Pages need either the Vite dev server (`npm run dev`) or a build (`npm run build`): without one,
every page is an error saying "Vite manifest not found". (The tests are the exception: they render
pages without asset tags until there's a build.)
:::

::: details Without DDEV
Any PHP 8.4 setup works. Point the web server's document root at `public/` and send every request
that isn't a file to `public/index.php`. For a quick look:

```sh
composer install && npm install && npm run build
php -S localhost:8000 -t public public/index.php
```

`public/index.php` lets PHP's built-in server deliver the files in `public/` (built CSS and JS,
images) itself. The Vite dev server is configured for DDEV; outside it, run `npm run build` after
asset changes, or adjust `server.origin` in `vite.config.js`.
:::

## Check that everything works

```sh
ddev composer test       # your site's tests (PHPUnit)
ddev composer analyse    # PHPStan
```

## Next steps

- [Starting a site](./checklist): the checklist for your first hours with a new site
- [Project structure](./structure): where everything lives
- [Your first page](./first-page): a content page, a page with a controller, a little interactivity

::: tip Working with an AI coding agent
The skeleton's `AGENTS.md` tells coding agents (Claude Code, Codex, Cursor…) how a TinyTank site
works and which habits from other frameworks don't apply. For the full docs in one request, point
them at [`llms-full.txt`](https://docs.tinytank.dev/llms-full.txt) (index:
[`llms.txt`](https://docs.tinytank.dev/llms.txt)); every page also exists as Markdown, with `.md`
added to its URL.
:::
