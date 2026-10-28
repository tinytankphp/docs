# CDN caching

A CDN (Cloudflare, Bunny, Fastly…) keeps copies of your pages on servers around the world and answers
visitors from the closest one. TinyTank can tell it which pages to keep and for how long. You get:

- **Speed everywhere:** a visitor far from your server gets the page from a nearby edge server,
  without the round trip to yours.
- **Resilience:** if your server is down or restarting, the CDN keeps serving the last copy of each
  page, for a day by default.
- **A quiet server:** a traffic spike hits the CDN, not PHP.

It's **off by default**. A new site goes live without a CDN, and you turn caching on once one is in
front of the site.

## Turning it on

1. Put the CDN in front of your site (for Cloudflare, your domain's DNS goes through it; for Bunny, a
   pull zone with your server as origin, and your domain pointing at it). See [the CDN's own
   settings](#setting-up-the-cdn) below.
2. In `.env`:

   ```sh
   CDN_CACHE=1
   CDN_PURGE=cloudflare          # or bunny, or command (see Purging)
   ```

3. Deploy.

## What the CDN is told

Every page now says:

```
Cache-Control: max-age=0, public, s-maxage=3600, stale-if-error=86400, stale-while-revalidate=60
```

| Directive | Meaning |
|---|---|
| `public` | the page is the same for everyone, so a shared cache may keep it |
| `max-age=0` | **browsers** check back each time: answered by the CDN, it's fast, and visitors always get the current page |
| `s-maxage=3600` | the **CDN** keeps the page for an hour (`ttl`) |
| `stale-while-revalidate=60` | for a minute after that, the CDN serves the old copy and fetches the new one in the background, so nobody waits for your server |
| `stale-if-error=86400` | **if your server is down**, the CDN keeps serving the last copy for a day |

The `ttl` is **an hour when the CDN can be purged** (`CDN_PURGE` is set, or a package gave a purger),
because `deploy` then clears it. **Without purging it's 5 minutes**, so a change shows up within
5 minutes anyway.

## What's never kept at the CDN

TinyTank decides most of this by itself:

| What | Why |
|---|---|
| Pages with a form (the contact page) | Their spam check prints a new token every time; they're `no-store` |
| A response that sets a cookie | A cookie is for one visitor: `no-store, private`, whatever its handler said |
| A response after `$app->noStore()` | Its handler said it's for one visitor (below) |
| The Datastar endpoint, and every request made by Datastar | They answer each request differently |
| Errors and redirects | A cached error would be the opposite of resilience |
| POST requests, server-sent events | Never cacheable |
| A response whose handler set its own `Cache-Control` | The handler knows best: `(new Response(…))->setPrivate()` stays private |

And you add:

```php
// config/app.php
'cdn' => [
    'exclude' => ['clock'],   // route names
],
```

```md
---
title: Today's menu
cdn: false                  # a content page that changes more often than you deploy
---
```

`cdn: false` applies to the page's translations too, unless they set their own. In a controller,
`$this->app->cdn->skip()` does the same for the current response.

## Not at the CDN, or nowhere

Two different things, for two different reasons:

| | `$app->cdn->skip()` (or `exclude`, `cdn: false`) | `$app->noStore()` |
|---|---|---|
| Means | "not at the CDN": the page changes too often to keep there | "nowhere": the response is for one visitor |
| `Cache-Control` | `no-cache, public`, with an ETag: browsers still revalidate it | `no-store, private`, no ETag: nobody keeps it |
| Use it for | a clock, today's menu, a live count | an account page, "Hi Ada", a basket |

A response that sets a cookie is treated like `noStore()` by itself: TinyTank has no sessions, so a
cookie means the response is for that visitor, and keeping it at a CDN would hand it to the next
one. A handler that set its own `Cache-Control` (`setPrivate()`, a `max-age`…) keeps it, unless it
also sets a cookie.

::: warning Pages that differ per visitor
Anything shown to one visitor only must never be `public`. TinyTank has no logins today; code that
adds them calls `$app->noStore()` in those responses (a login that sets a cookie gets it anyway).
:::

## Purging

**Purging** tells the CDN to drop its copies, so the next visitor gets the new page. `deploy` purges
everything as its last step, once your server answers with the new pages. If the purge fails, the
deploy reports it (exit code 1), says why, and the site itself is already deployed: fix the cause and
run `cdn:purge --all`.

To purge a few pages, for example one that looks stale:

```sh
php bin/console cdn:purge blog/my-post /it/chi-siamo     # paths on this site (APP_URL)
php bin/console cdn:purge https://example.com/blog/my-post   # full URLs
php bin/console cdn:purge --all                           # everything
```

Paths are added to `APP_URL`. In development `APP_URL` is your local site, so give the full
production URL there (and the production CDN's credentials in `.env`).

The CDN keeps one copy per exact URL: `/blog/my-post` and `/it/blog/il-mio-post` are two pages to
purge.

### Cloudflare

```sh
CDN_PURGE=cloudflare
CLOUDFLARE_ZONE_ID=…          # on the domain's Overview page
CLOUDFLARE_API_TOKEN=…        # My Profile → API Tokens → Create Token
```

Create a token with only the **Zone → Cache Purge → Purge** permission, for this zone only: if it
ever leaked, it could clear your cache, nothing else.

### Bunny

```sh
CDN_PURGE=bunny
BUNNY_PULL_ZONE_ID=…          # the number in the pull zone's URL in the dashboard
BUNNY_API_KEY=…               # Account settings → API
```

### Any CDN with a command

```sh
CDN_PURGE=command
CDN_PURGE_CMD=bin/purge-cdn
```

The command runs in the project root with the URLs as arguments, or none to purge everything. A
script calling your CDN's API or command-line tool is enough:

```sh
#!/bin/sh
# bin/purge-cdn: purge everything, or the URLs given
if [ $# -eq 0 ]; then mycdn purge --all; else mycdn purge "$@"; fi
```

### Another CDN as a package

A package can add a CDN with a class implementing `TinyTank\Cdn\Purger`:

```php
use TinyTank\Cdn\Purger;

final class FastlyPurger implements Purger
{
    public function __construct(private string $service, #[\SensitiveParameter] private string $token) {}

    public function name(): string { return 'Fastly'; }

    public function purgeAll(): void { /* POST /service/{id}/purge_all */ }

    /** @param list<string> $urls */
    public function purge(array $urls): void { /* one purge request per URL */ }
}
```

```php
// the package's register()
$app->cdn->usePurger(new FastlyPurger(getenv('FASTLY_SERVICE_ID') ?: '', getenv('FASTLY_API_TOKEN') ?: ''));
```

Throw an exception when the CDN refuses, with a message that says why and never contains the token:
`deploy` and `cdn:purge` show it. See [Writing a package](../extending/packages).

::: tip Keep tokens on the server
CDN tokens are secrets: keep them in the server's `.env` or environment, never in `config/app.php`'s
`public` values or in JavaScript. Only `deploy` and `cdn:purge` use them, on the command line.
:::

## Setting up the CDN

CDNs read the same `Cache-Control` header, but each has settings that decide whether it does. Check
the CDN's current documentation; the gist:

- **Cloudflare** doesn't cache HTML pages by default, only files like images and scripts. Add a
  **Cache Rule** for your site: "Eligible for cache", with the edge TTL taken from the origin's
  `Cache-Control`. From then on it follows TinyTank's headers. Its "Always Online" option also serves
  pages while your server is down.
- **Bunny**: in the pull zone's caching settings, set the cache expiration to **respect the origin's
  Cache-Control**, and turn on the **stale cache** options (serve while updating, serve while the
  origin is offline).
- **Others** (Fastly, CloudFront, KeyCDN…) honour `s-maxage` from the origin; look for "stale" or
  "serve stale" options for the resilience part.

Then check a page: `curl -sI https://example.com/about` should show a cache status header such as
`cf-cache-status: HIT` (Cloudflare) or `cdn-cache: HIT` (Bunny) on the second request.

This is about **pages**. To serve only images and videos from a CDN, see
[A CDN for media files](./servers#a-cdn-for-media-files) (`MEDIA_URL`); the two work together.

## Privacy

With a CDN in front of the whole site, **every visit goes through the CDN**, so it sees each
visitor's IP address and the pages they ask for. That makes it a data processor under the GDPR:

- sign its data processing agreement (DPA), and prefer a provider or region in the EU (Bunny is a
  European company; Cloudflare offers EU options);
- mention it in your privacy policy;
- check what it logs, and turn off what you don't need: many CDNs keep request logs, and some add
  analytics or bot-detection scripts and cookies to pages unless you switch them off.

TinyTank's own [log](../features/logging) still records nothing about visitors.
