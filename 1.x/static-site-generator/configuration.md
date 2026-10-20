# Configuration

Everything is optional, in `config/app.php`:

```php
'static' => [
    'out' => 'deploy',                    // the output folder (or --out)
    'base_url' => 'https://example.com',  // the site's address once published (or --base-url;
                                          // default APP_URL): used in the sitemap, the feed and share tags
    'paths' => ['/style-guide'],          // pages nothing links to
    'host' => 'cloudflare',               // or 'none', or your own class (Hosts); or --host
    'name' => 'my-site',                  // the Worker's name on Cloudflare (default: the site's name)
    'domains' => ['example.com'],         // your domains on Cloudflare (default: the workers.dev address)
],
```

| Option | |
|---|---|
| `out` | the folder the site is written to, relative to the site (default `deploy`) |
| `base_url` | the published address; links in the sitemap, the feed and share tags use it |
| `paths` | pages the build can't find by following links ([How it works](./how-it-works#how-pages-are-found)) |
| `host` | where the site is published ([Hosts](./hosts)) |
| `name` | the Worker's name on Cloudflare (written in lowercase with dashes: `Lab 909` becomes `lab-909`) |
| `domains` | domains managed by Cloudflare that point at the site ([Publishing](./publishing)) |

Forms have their own static settings, in `config/forms.php`: see [Forms](./forms).

Secrets never go here: the Cloudflare API token and the mail server's password are in `.env`
([Publishing](./publishing)).
