# Console commands

```sh
php bin/console list        # in DDEV: ddev console list
```

## `deploy`

Optimizes the autoloader, rebuilds every cache, publishes post files and refreshes the web
server's Opcache. See [Deploying](../deployment/) for the options and
[Deploy steps](../extending/deploy-steps) for the steps.

```sh
php bin/console deploy [--list-steps] [--skip=a,b] [--assets] [--opcache=cachetool|reload|none]
                       [--fcgi=…] [--cachetool=…] [--reload-cmd=…] [--composer=…] [--no-dev]
                       [--skip-composer] [--skip-opcache]
```

Exit codes: `0` deployed, `1` a step failed, `2` invalid options (nothing was changed).

## `cache:clear`

Deletes everything in `var/cache` (keeping `.gitkeep`) and the post, page and collection files
published to `public/media/blog/`, `public/media/pages/` and `public/media/collections/`. If a deploy left the Composer autoloader authoritative, it also runs
`composer dump-autoload`, so new classes are found again. Run it when you go back to development
after a deploy.

| Option | Default | |
|---|---|---|
| `--composer` | `composer` | Composer binary |

## `site:clean`

Removes the skeleton's examples ([Starting a site](../getting-started/checklist#_3-the-starter-content)):
the files and folders listed in `.examples`, and every block between a line containing
`example:start` and one containing `example:end` in the site's `config/`, `src/`, `templates/`,
`resources/`, `tests/`, `translations/`, `content/`, `public/` and `AGENTS.md`, then `.examples`.
It lists everything first and asks. Unbalanced markers stop it before anything changes. While
`.examples` exists, `deploy` warns that the examples are still there.

| Option | |
|---|---|
| `--dry-run` | only list what would go |
| `--force`, `-f` | don't ask |

## `build:static`

Renders the whole site into plain files for a static host ([Static Site Generator](../static-site-generator/)).

| Option | |
|---|---|
| `--out` | the output folder (default `static.out`, or `deploy`) |
| `--base-url` | the published site's address (default `static.base_url`, or `APP_URL`) |
| `--host` | `cloudflare` (default), `none`, or a `HostAdapter` class |
| `--allow-dynamic` | succeed even when pages use what needs the server (listed as a warning) |

Exit codes: `0` built, `1` broken links, pages that need the server, or the host's limits, `2` wrong
options.

## `preview:static`

Serves the static build locally, as its host will: Cloudflare's local server for the `cloudflare`
host, or PHP's with `--php`. Options: `--port` (4173), `--ip` (`0.0.0.0`), `--out`, `--php`,
`--dry-run`. See [Preview](../static-site-generator/preview).

## `publish:static`

Builds the static site and publishes it on Cloudflare Workers (`wrangler deploy`), with
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from `.env`; forms sent over SMTP get the
`SMTP_*` keys as the Worker's secrets. Options: `--no-build`, `--dry-run`. See
[Publishing](../static-site-generator/publishing).

Exit codes: `0` published, `1` the build or wrangler failed, `2` missing settings.

## `cdn:purge`

Drops pages from the CDN's cache ([CDN caching](../deployment/cdn)), with the purger set by
`CDN_PURGE` or a package.

```sh
php bin/console cdn:purge blog/my-post /it/chi-siamo        # paths on this site (APP_URL)
php bin/console cdn:purge https://example.com/blog/my-post  # full URLs
php bin/console cdn:purge --all                             # everything
```

Exit codes: `0` purged, `1` the CDN refused or no purge is set up (the message says why), `2` no
URLs and no `--all`, or both.

## Your commands

Every command class in `src/Command/` is registered automatically. See
[Console commands](../extending/commands).
