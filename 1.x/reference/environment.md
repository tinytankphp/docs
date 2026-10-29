# Environment variables

Set them as real environment variables on servers, or in `.env` (real variables win). `.env.example`
lists them all.

| Variable | Required | Default | Description |
|---|---|---|---|
| `APP_SECRET` | yes | | Signs Datastar template URLs. Generate with `openssl rand -hex 32` |
| `APP_URL` | yes | | Public base URL, no trailing slash, e.g. `https://example.com` |
| `APP_DEBUG` | no | off | `1` = development mode |
| `MAILER_DSN` | for forms | | How email is sent (Symfony Mailer), e.g. `smtp://user:pass@smtp.example.com:587` |
| `MAILER_FROM` | for forms | | The address emails come from, of your own domain |
| `CONTACT_TO` | for the contact form | | Where the skeleton's contact form goes (comma-separated) |
| `CDN_CACHE` | no | off | `1` = cache pages at the CDN ([CDN caching](../deployment/cdn)) |
| `CDN_PURGE` | no | | How to purge the CDN: `cloudflare`, `bunny` or `command` |
| `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` | for Cloudflare purging | | The zone, and a token with only the Cache Purge permission |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | for `publish:static` | | A token with the Workers permissions, and its account ([Publishing](../static-site-generator/publishing)). A static site has no CDN purging, so the name is free |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | for static forms sent over SMTP | `SMTP_PORT` 465 | Your mail server, set as the Worker's secrets by `publish:static` ([Forms](../static-site-generator/forms)). Passwords in single quotes |
| `BUNNY_PULL_ZONE_ID`, `BUNNY_API_KEY` | for Bunny purging | | The pull zone's number and the account's API key |
| `CDN_PURGE_CMD` | for `command` purging | | A command run with the URLs as arguments, none for everything |
| `LOG_ALERT_TO` | no | | Email errors to this address (comma-separated for several), see [Logging](../features/logging) |
| `PUSHOVER_TOKEN`, `PUSHOVER_USER` | no | | Push alerts through [Pushover](https://pushover.net): errors on the PHP site, a form that couldn't be sent on a static one. The application's token and your user key, both or neither ([Push alerts](../features/logging#push-alerts)) |
| `LOG_LEVEL` | no | `debug` / `info` | The least important messages logged: `debug`, `info`, `notice`, `warning`, `error`… |
| `MEDIA_URL` | no | | Serve post and page files and video posters from a CDN: an `https://` base URL, no trailing slash |
| `BLOG_PER_PAGE` | no | `20` | Posts per page on `/blog` |
| `APP_TRUSTED_PROXIES` | no | | Comma-separated IPs/CIDRs of trusted proxies, or `REMOTE_ADDR` |
| `APP_OPCACHE` | no | `cachetool` | How `deploy` refreshes Opcache: `cachetool`, `reload` or `none` |
| `APP_FPM_SOCKET` | no | `/run/php-fpm.sock` | PHP-FPM socket or `host:port`, for cachetool |
| `APP_CACHETOOL` | no | `cachetool` | The cachetool binary |
| `APP_OPCACHE_RELOAD_CMD` | no | | The command for `reload` mode, e.g. `sudo systemctl reload php8.4-fpm` |

Frontend code only ever sees variables prefixed `VITE_PUBLIC_` (none by default).
