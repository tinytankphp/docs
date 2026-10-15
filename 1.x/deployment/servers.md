# Servers & Opcache

## Why Opcache needs refreshing

For speed, production PHP should not check every file for changes on every request
(`opcache.validate_timestamps=0`). The flip side: PHP keeps running the old code until its Opcache
is refreshed. The deploy command can't do that by itself, because the command line has its own
Opcache. So its last step reaches the **web server's** PHP, in one of three ways.

## Choose a mode per server

| Server | `.env` on that server | What deploy does |
|---|---|---|
| nginx + PHP-FPM | `APP_OPCACHE=cachetool`<br>`APP_FPM_SOCKET=/run/php/php8.4-fpm.sock` | invalidates and precompiles every file inside FPM: no slow first requests |
| Apache + PHP-FPM (`mod_proxy_fcgi`) | same as nginx | same as nginx |
| PHP-FPM without cachetool | `APP_OPCACHE=reload`<br>`APP_OPCACHE_RELOAD_CMD="sudo systemctl reload php8.4-fpm"` | a graceful FPM reload empties Opcache; files recompile on first use |
| Apache + mod_php | `APP_OPCACHE=reload`<br>`APP_OPCACHE_RELOAD_CMD="sudo apachectl graceful"` | a graceful Apache restart empties Opcache |
| Shared hosting | `APP_OPCACHE=none` | nothing; hosts normally keep `validate_timestamps=1`, so changes are picked up anyway |

Socket names differ per distribution: check `listen =` in the FPM pool config, e.g.
`/etc/php/8.4/fpm/pool.d/www.conf`.

### cachetool mode

[cachetool](https://github.com/gordalina/cachetool) talks to PHP-FPM directly over its FastCGI
socket. Install the pinned, checksum-verified phar (DDEV installs the same one through
`.ddev/web-build/Dockerfile.cachetool`):

```sh
curl -fsSL -o /usr/local/bin/cachetool https://github.com/gordalina/cachetool/releases/download/10.0.0/cachetool.phar
echo "cbe90e7acdde7beafe26b592a753c2b923a99d2033e073dc55e42fba2883bd1d  /usr/local/bin/cachetool" | sha256sum -c -
chmod 755 /usr/local/bin/cachetool
```

The deploy user needs access to the FPM socket, usually owned by `www-data` with mode `0660`: add
the deploy user to that group (`sudo usermod -aG www-data deploy`) or deploy as `www-data`.

Deploy checks the connection first (`opcache:status`), because cachetool's other commands report
success even when they can't reach PHP-FPM.

### reload mode

Give the deploy user passwordless sudo for that one command only, in `/etc/sudoers.d/tinytank`:

```
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl reload php8.4-fpm
```

A graceful reload lets running requests finish: there's no downtime.

## PHP settings

```ini
; files only change on deploy, so skip the per-request stat calls
opcache.enable=1
opcache.validate_timestamps=0
opcache.memory_consumption=128
opcache.max_accelerated_files=20000
opcache.interned_strings_buffer=16
display_errors=Off
log_errors=On
```

## nginx

```nginx
root /var/www/my-site/public;

location /build/ { expires 1y; add_header Cache-Control "public, immutable"; }
location /media/ { expires 7d; add_header Cache-Control "public"; try_files $uri /index.php?$query_string; }
location / { try_files $uri /index.php?$query_string; }

location ~ \.php$ {
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_buffering off;           # let Datastar's server-sent events stream immediately
    fastcgi_pass unix:/run/php/php8.4-fpm.sock;
}
```

## Apache

With PHP-FPM (`a2enmod proxy_fcgi rewrite headers expires`):

```apache
DocumentRoot /var/www/my-site/public
<Directory /var/www/my-site/public>
    AllowOverride None
    Require all granted
    FallbackResource /index.php
</Directory>
<FilesMatch "\.php$">
    SetHandler "proxy:unix:/run/php/php8.4-fpm.sock|fcgi://localhost"
</FilesMatch>
# Let Datastar's server-sent events stream immediately
<Proxy "fcgi://localhost">
    ProxySet flushpackets=on
</Proxy>
<Location /build/>
    Header set Cache-Control "public, max-age=31536000, immutable"
</Location>
<Location /media/>
    Header set Cache-Control "public, max-age=604800"
</Location>
```

With mod_php, drop the `FilesMatch` and `Proxy` blocks.

`/build/` files have a content hash in their name, so they're cached for a year. `/media/` files
(post and page images, video posters) keep their name when replaced, so they get a week: a changed
image shows up within days without anyone clearing a cache. Rename a file to publish a change at
once.

## A CDN for media files

Images and videos are usually the heaviest part of a page. To serve them from a CDN, create a "pull"
CDN zone whose origin is your site, and set:

```sh
MEDIA_URL=https://cdn.example.com
```

Post and page files and video posters then link to `https://cdn.example.com/media/…`, which the CDN
fetches from your site's `/media/` the first time and caches. `deploy` still publishes the files to
`public/media/`, and the CDN's host is added to the Content Security Policy's `img-src` and
`media-src` automatically. Run `deploy` after changing `MEDIA_URL`: post HTML is compiled with it.

To cache the pages themselves at a CDN, see [CDN caching](./cdn).

::: tip
Apache doesn't allow comments after a directive on the same line, which is why the comment above
sits on its own line.
:::

## Permissions

`var/cache` must be writable by the deploy user and readable by PHP. If PHP ever finds a cache file
missing (say, after `cache:clear` without a deploy), it rebuilds it on the fly, so it then needs write
access too.

`var/log` must be writable by PHP (see [Logging](../features/logging)).

## Access logs

TinyTank's own [log](../features/logging) records nothing about visitors, but web servers keep an
**access log** of every request by default, with the visitor's IP address, the full URL with its
query string, the referrer and the browser. That's personal data, kept for as long as the server's
log rotation says (often weeks or months).

If you don't need it, turn it off, or keep it without the IP address. nginx:

```nginx
access_log off;

# or: keep the request lines, without who made them
log_format private '$time_local "$request_method $uri" $status $body_bytes_sent';
access_log /var/log/nginx/my-site.log private;
```

Apache:

```apache
LogFormat "%t \"%m %U\" %>s %b" private
CustomLog ${APACHE_LOG_DIR}/my-site.log private
```

`$uri` and `%U` are the path without the query string. Whatever you keep, set how long it's kept
(`logrotate`'s `rotate` and `daily`/`weekly`) and mention it in your privacy policy. On shared
hosting, the host's control panel usually has these settings.

## Behind a proxy or load balancer

Set `APP_TRUSTED_PROXIES` (comma-separated IPs or CIDR ranges, or `REMOTE_ADDR` for the direct
peer), so the CSRF origin check sees the public scheme and host from the `X-Forwarded-*` headers.
