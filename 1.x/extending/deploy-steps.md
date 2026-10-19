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
| `composer` | `composer dump-autoload --optimize --classmap-authoritative` |
| `cache` | empty `var/cache` |
| `routes` | compile the router |
| `blog` | compile the posts and publish their files to `public/media/blog/` (images without metadata, plus their responsive versions) |
| `pages` | compile the content pages, check that no route hides one, publish their files to `public/media/pages/` |
| `collections` | compile the data collections, publish their item folders' files to `public/media/collections/` |
| `embeds` | download the posters and titles of `::youtube` / `::vimeo` videos to `public/media/embeds/` (a failed download is a warning) |
| `translations` | compile the translation catalogues |
| `templates` | compile every Twig template |
| `vite` | cache the Vite manifest |
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

Without `before` or `after`, the step runs **just before `opcache`**, so the files it produces
are included in the Opcache warm-up.

## How steps run

- a closure receives the kernel and the console output; returning `false` stops the deploy with
  exit code 1
- a command step runs the command; a non-zero exit code stops the deploy
- app steps run with the same **production-mode** kernel as the rest of the deploy
- the `cache` step guarantees `var/cache/` exists, so later steps can write into it

## Skipping steps

```sh
ddev console deploy --skip=composer,opcache
```

An unknown step name in `--skip`, or a `before`/`after` pointing to an unknown step, is an error
before anything changes.
