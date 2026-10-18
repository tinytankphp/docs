# Deploying

## The deploy command

```sh
npm ci && npm run build          # or pass --assets to deploy
composer install --no-dev --optimize-autoloader
php bin/console deploy           # in DDEV: ddev console deploy
```

`deploy` runs [its steps](../extending/deploy-steps) in order: optimize the autoloader, rebuild
`var/cache` (routes, posts, translations, templates, the Vite manifest), publish post files,
refresh the web server's Opcache, and purge the CDN when [CDN caching](./cdn) is on.

**Run it after every change**: code, templates, content or configuration. In production, changes
aren't picked up until then.

## Options

| Option | |
|---|---|
| `--list-steps` | show the steps in order and exit |
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

It empties the caches, rebuilds the normal autoloader with `composer dump-autoload` (only when a
deploy left it authoritative; `--composer=<path>` if Composer isn't on your `PATH`), and removes the
post and page files published to `public/media/`, which would otherwise shadow the originals in `content/`.

## Production checklist

- [ ] `.env` (or real environment variables) with `APP_URL`, `APP_SECRET`; `APP_DEBUG` unset
- [ ] PHP 8.4 with `intl`, `mbstring`, `xmlwriter`, `opcache`, and GD or Imagick with WebP;
      `display_errors=Off`, `log_errors=On`
- [ ] web server root at `public/`, everything else routed to `public/index.php`
- [ ] `var/cache` writable by the deploy user and readable by PHP; `var/log` writable by PHP
- [ ] keep `var/images/` between deploys (encoded images are reused from there)
- [ ] the Opcache mode for this server (`APP_OPCACHE`), see [Servers & Opcache](./servers)
- [ ] HTTPS, and `APP_TRUSTED_PROXIES` if behind a proxy or load balancer
- [ ] `MAILER_DSN`, `MAILER_FROM` and `CONTACT_TO` for the contact form (send yourself a test message)
- [ ] `LOG_ALERT_TO` to hear about errors by email ([Logging](../features/logging)), and the web
      server's access log turned off or without IP addresses ([Access logs](./servers#access-logs))
- [ ] behind a CDN: `CDN_CACHE=1` and `CDN_PURGE` with its credentials ([CDN caching](./cdn)), and the
      CDN in your privacy policy
- [ ] the [style guide](../getting-started/checklist#the-style-guide) at `/style-guide`: still wanted on
      the live site?
