# Preview

See the build exactly as it'll be published, before uploading it:

```sh
php bin/console build:static
php bin/console preview:static        # http://localhost:4173
```

For the `cloudflare` host it runs Cloudflare's own local server on `deploy/` (`wrangler dev`): the
same URLs, redirects, headers and Content Security Policy as on Cloudflare, and the forms' Worker,
which writes its emails to files in `deploy/.wrangler/tmp/email/` instead of sending them. It uses
the site's `wrangler` if it's installed (`npm i -D wrangler`), otherwise `npx` downloads it once.

`--php` uses PHP's built-in server instead, without Node: pages, files and redirects, but not the
host's headers or the forms. Options: `--port` (4173), `--ip` (`0.0.0.0`, so DDEV can reach it),
`--out`, `--dry-run` (only print the command).

With DDEV, the skeleton exposes the port: open `https://<project>.ddev.site:4173` (after a
`ddev restart` if you added the port to an existing site's `.ddev/config.yaml`).
