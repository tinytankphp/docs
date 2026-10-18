# Configuration reference

Every key of `config/app.php`. See [Configuration](../basics/configuration) for how settings and
environment variables fit together.

| Key | Type | Default in `config/app.php` | Description |
|---|---|---|---|
| `secret` | string | `APP_SECRET` (required) | Signs Datastar template URLs |
| `debug` | bool | `APP_DEBUG === '1'` | Development mode: no caches, drafts visible, exception pages |
| `url` | string | `APP_URL` (required, validated) | Public base URL, no trailing slash. Used for every absolute URL |
| `media_url` | string | `MEDIA_URL` or `''` | Where post and page files and video posters are served from: `''` (this site) or a CDN's `https://` base URL |
| `images.widths`, `images.sizes` | list, string | `[480, 960, 1440]`, `'(min-width: 48rem) 48rem, 100vw'` | Responsive image widths and how wide images are shown ([Images](../features/images)); also `images.presets`, `images.formats`, `images.quality` |
| `mailer.dsn`, `mailer.from` | ?string | `MAILER_DSN`, `MAILER_FROM` | Sending email for [forms](../features/forms) |
| `log.level` | string | `LOG_LEVEL`, or `debug` in development and `info` in production | The least important messages written to the [log](../features/logging) |
| `log.days` | int | `14` | Daily log files to keep |
| `log.alert_to` | ?string or list | `LOG_ALERT_TO` | Who gets an email when an error is logged (needs the mailer) |
| `log.path` | string | `var/log/app.log` | The log file (dated per day), or a stream like `php://stderr` |
| `cdn.enabled` | bool | `CDN_CACHE=1`, else off | Cache pages at a CDN ([CDN caching](../deployment/cdn)) |
| `cdn.ttl` | ?int | an hour with purging, else 5 minutes | How long the CDN keeps a page (`s-maxage`) |
| `cdn.stale_while_revalidate`, `cdn.stale_if_error` | int | `60`, `86400` | Seconds the CDN may serve an old copy while refreshing it, or while the site is down |
| `cdn.exclude` | list | `[]` | Route names never cached at the CDN (the Datastar endpoint never is) |
| `cdn.purge` | ?string | `CDN_PURGE` | `cloudflare`, `bunny` or `command`; with `cdn.cloudflare` (`zone`, `token`), `cdn.bunny` (`pull_zone`, `key`), `cdn.command` |
| `trusted_proxies` | list | from `APP_TRUSTED_PROXIES` | Reverse proxies whose `X-Forwarded-*` headers are trusted |
| `language` | string | `'en'` | The default language (no URL prefix) |
| `languages` | map | `en`, `it` | `code => ['name' => …, 'locale' => …]`; codes like `en` or `pt-br` |
| `blog.per_page` | int | `BLOG_PER_PAGE` or `20` | Posts per page on `/blog` |
| `public` | map | `[]` | Values page scripts may read through `publicConfig()`; an allowlist, refused if a value contains `APP_SECRET` |
| `csp.enabled` | bool | `true` | Send the Content Security Policy header on pages |
| `csp.report_only` | bool | `false` | Report violations in the browser console instead of blocking |
| `csp.sources` | map | `[]` | Extra sources per directive, e.g. `['frame-src' => ['https://player.vimeo.com']]` |
| `theme.default` | string | `'system'` | What visitors without a saved choice get: `'system'`, `'light'` or `'dark'` ([theme](../features/theme#a-default-other-than-the-system)) |
| `site.name` | string or map | `'TinyTank'` | Site name: titles, Open Graph, feed |
| `site.description` | string or map | | Default meta description and feed subtitle |
| `site.image` | ?string or map | `null` | Default share image (`/path` or URL) |
| `site.author` | ?string or map | `null` | Author for posts and the feed; defaults to the site name |

Each `site` value can be a map `language => value` instead, see [Languages](../features/languages#the-site-s-name-description-and-share-image).

## `config/collections.php`

Data collections and their fields: `name => ['fields' => […], 'sort' => …, 'fallback' => …, 'json' => …]`.
See [Data collections](../content/collections).

## `config/forms.php`

Forms and their fields, recipients and spam checks: `name => ['fields' => […], 'to' => …, 'subject' => …, 'reply_to' => …, 'spam' => […]]`.
See [Forms](../features/forms).

## `config/globals.php`

Optional: values for every template, as `globals` (and `$app->globals` in PHP). Returns an array,
nested as deep as you like. Public: no secrets. See [Global values](../basics/templates#global-values).

## Overrides

`Kernel::boot($root, $debug, $overrides)` merges `$overrides` over the file. These extra keys are
only meant for overrides (mostly in tests):

| Key | Default | |
|---|---|---|
| `content_dir` | `<root>/content` | where `blog/` and the collection folders live |
| `cache_dir` | `<root>/var/cache` | where compiled caches are written |
| `collections` | `config/collections.php` | collection definitions, instead of the file |
| `forms` | `config/forms.php` | form definitions, instead of the file |
| `globals` | `config/globals.php` | template globals, instead of the file |
| `images_dir` | `<root>/var/images` | where encoded images are kept (tests use a temporary folder) |
