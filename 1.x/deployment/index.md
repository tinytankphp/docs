# Deploying

This page puts the **PHP site** on a server. To publish the site as plain files instead, with no
PHP on the host (Cloudflare Workers, free for most sites), see the
[Static Site Generator](../static-site-generator/).

## The deploy command

```sh
npm ci && npm run build          # or pass --assets to deploy
composer install --no-dev --optimize-autoloader
php bin/console deploy           # in DDEV: ddev console deploy
```

`deploy` runs [its steps](../extending/deploy-steps) in order: check the server and the site,
optimize the autoloader, build the new cache (routes, posts, translations, templates, the Vite
manifest) and the published files, switch the site to them, refresh the web server's Opcache, and
purge the CDN when [CDN caching](./cdn) is on.

**Run it after every change**: code, templates, content or configuration. In production, changes
aren't picked up until then.

## Build first, switch last

While `deploy` builds, the site keeps answering from the current build: the new cache and the
published files (`public/media/blog/`, `pages/`, `collections/`) are made aside, in
`var/deploy/next/`. Only when every step has succeeded does the `switch` step move them in, in a
moment. If anything fails (a post that doesn't compile, a missing template, no Vite build), the
deploy stops and **the live site is exactly as it was**.

The build it replaced is kept in `var/deploy/prev/`. To go back to it:

```sh
php bin/console deploy --rollback
```

It puts the previous cache and files back, then refreshes Opcache and purges the CDN like a deploy.
A second `--rollback` undoes the first. It restores what `deploy` builds, not your code: after a
`git pull` that broke something, check out the previous commit too.

What the site keeps between requests isn't in the cache, so deploys never reset it: the forms' rate
limits are in `var/state/`, encoded images in `var/images/`.

## Checking first

```sh
php bin/console check
```

A read-only preflight, also run first by `deploy` (its `check` step): it compiles everything into a
temporary folder and changes nothing.

| Check | |
|---|---|
| `php` | PHP 8.4 or later, with the extensions TinyTank needs; whether Opcache is on |
| `images` | GD or Imagick (an error if the content has images: they can't be published without removing their metadata), AVIF and WebP |
| `environment` | `APP_SECRET` (random, 32 characters or more), `APP_URL` (an address, `https://` in production) |
| `writable` | `var/` and `public/media/`, by the user running it |
| `content` | posts, pages, collections, components, translations and routes compile |
| `templates` | every Twig template compiles; each page's template, and its `form:`, exist |
| `pages` | no content page is hidden behind a route |
| `vite` | the Vite build exists (when there's a `vite.config.js`) and has every entry point templates name in `vite(…)` or `page_scripts` |

Errors exit with code 1 (and stop a deploy); warnings don't. `--json` prints the results for CI:

```sh
php bin/console check --json | jq '.checks[] | select(.status != "ok")'
```

Run it on a new server before the first deploy: it finds a missing extension or an unwritable
folder before anything is built.

## Options

| Option | |
|---|---|
| `--list-steps` | show the steps in order and exit |
| `--rollback` | put the previous build back ([above](#build-first-switch-last)) |
| `--skip=a,b` | leave steps out |
| `--assets` | run `npm run build` first |
| `--opcache=cachetool\|reload\|none` | how to refresh Opcache (default: `APP_OPCACHE`, else `cachetool`) |
| `--fcgi=…` | PHP-FPM socket or `host:port`, for cachetool (default: `APP_FPM_SOCKET`, else `/run/php-fpm.sock`) |
| `--cachetool=…` | the cachetool binary (default: `APP_CACHETOOL`, else `cachetool`) |
| `--reload-cmd=…` | the command for `--opcache=reload` (default: `APP_OPCACHE_RELOAD_CMD`) |
| `--composer=…` | the Composer binary |
| `--no-dev` | exclude `require-dev` packages from the autoloader |
| `--skip-composer` | same as `--skip=composer` |
| `--skip-opcache` | same as `--opcache=none` |

Set the Opcache variables once per server in its `.env`, and a plain `php bin/console deploy` does
the right thing everywhere.

## After deploying, locally

`deploy` makes the Composer autoloader **authoritative**: new classes in `src/` aren't found until
the next deploy. When you go back to development:

```sh
php bin/console cache:clear
```

It empties the caches (and `var/deploy/`: there's nothing to roll back to in development), rebuilds the normal autoloader with `composer dump-autoload` (only when a
deploy left it authoritative; `--composer=<path>` if Composer isn't on your `PATH`), and removes the
post and page files published to `public/media/`, which would otherwise shadow the originals in `content/`.

## Production checklist

- [ ] `.env` (or real environment variables) with `APP_URL`, `APP_SECRET`; `APP_DEBUG` unset
- [ ] PHP 8.4 with `intl`, `mbstring`, `xmlwriter`, `opcache`, and GD or Imagick with WebP;
      `display_errors=Off`, `log_errors=On`
- [ ] web server root at `public/`, everything else routed to `public/index.php`
- [ ] `php bin/console check` passes on the server
- [ ] `var/cache` and `var/deploy` writable by the deploy user and readable by PHP; `var/log` and
      `var/state` writable by PHP
- [ ] keep `var/images/` and `var/state/` between deploys (encoded images are reused from there; the
      forms' rate limits live there)
- [ ] the Opcache mode for this server (`APP_OPCACHE`), see [Servers & Opcache](./servers)
- [ ] HTTPS, and `APP_TRUSTED_PROXIES` if behind a proxy or load balancer
- [ ] `MAILER_DSN`, `MAILER_FROM` and `CONTACT_TO` for the contact form (send yourself a test message)
- [ ] `LOG_ALERT_TO` to hear about errors by email ([Logging](../features/logging)), and the web
      server's access log turned off or without IP addresses ([Access logs](./servers#access-logs))
- [ ] behind a CDN: `CDN_CACHE=1` and `CDN_PURGE` with its credentials ([CDN caching](./cdn)), and the
      CDN in your privacy policy
- [ ] the [style guide](../getting-started/checklist#the-style-guide) at `/style-guide`: still wanted on
      the live site?
