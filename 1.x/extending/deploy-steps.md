# Deploy steps

`bin/console deploy` runs named steps in order. Your site can add its own: a command that builds
files the site serves, a cache to warm, a notification to send.

## Built-in steps

```sh
ddev console deploy --list-steps
```

| Step | What it does |
|---|---|
| `assets` | only with `--assets`: `npm run build` |
| `check` | `bin/console check` ([Checking first](../deployment/#checking-first)): an error stops the deploy |
| `composer` | `composer dump-autoload --optimize --classmap-authoritative` |
| `cache` | start the new cache, aside, in `var/deploy/next/cache/` |
| `routes` | compile the router |
| `blog` | compile the posts and publish their files for `public/media/blog/` (images without metadata, plus their responsive versions) |
| `pages` | compile the content pages, check that no route hides one, publish their files for `public/media/pages/` |
| `collections` | compile the data collections, publish their item folders' files for `public/media/collections/` |
| `embeds` | download the posters and titles of `::youtube` / `::vimeo` videos to `public/media/embeds/` (a failed download is a warning) |
| `translations` | compile the translation catalogues |
| `templates` | compile every Twig template |
| `vite` | cache the Vite manifest; without it the deploy stops (every page needs it), unless the site has no `vite.config.js` |
| `switch` | move the new cache and files in place of the live ones, keeping those in `var/deploy/prev/` ([Build first, switch last](../deployment/#build-first-switch-last)) |
| `opcache` | refresh the web server's Opcache ([Servers & Opcache](../deployment/servers)) |
| `cdn` | purge the CDN, when [CDN caching](../deployment/cdn) is on and `CDN_PURGE` is set |

## Adding a step

In `config/bootstrap.php`:

```php
// A console command (from src/Command/)
$app->addDeployStep('audio', 'app:build-audio', 'Encode the sound files');

// A closure
$app->addDeployStep('stats', function (Kernel $app, SymfonyStyle $io): ?bool {
    $io->writeln(sprintf(' ✔ %d posts', $app->posts()->count()));

    return true; // false stops the deploy
}, 'Print stats', after: 'blog');
```

```php
$app->addDeployStep(
    string $name,
    \Closure|string $step,     // closure, or a console command name
    string $description = '',
    ?string $before = null,    // insert before this step…
    ?string $after = null,     // …or after this one
);
```

Without `before` or `after`, the step runs **just before `switch`**: what it writes into the new
cache goes live with the rest, and a failure leaves the live site as it was.

## How steps run

- a closure receives the kernel and the console output; returning `false` stops the deploy with
  exit code 1
- a command step runs the command; a non-zero exit code stops the deploy
- app steps run with the same **production-mode** kernel as the rest of the deploy
- the kernel builds the **new** cache: `$app->cacheDir` is `var/deploy/next/cache/` until `switch`,
  so a step writes there and its files go live with the rest. A step after `switch` sees the live
  site (a notification, a warm-up request); don't write into the cache from there
- the `cache` step guarantees the new cache folder exists, so later steps can write into it

## Skipping steps

```sh
ddev console deploy --skip=composer,opcache
```

An unknown step name in `--skip`, or a `before`/`after` pointing to an unknown step, is an error
before anything changes.
