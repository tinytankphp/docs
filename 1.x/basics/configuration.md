# Configuration

TinyTank has two places for settings:

- **`config/app.php`**: the site's settings, committed to the repository.
- **Environment variables**: per-server values and secrets, never committed. In development they
  come from `.env`.

## Environment variables and `.env`

`config/app.php` reads secrets and per-server values with `getenv()`. Locally, they come from a
`.env` file in the project root (loaded by `symfony/dotenv`). On a server, set them as real
environment variables, or in that server's own `.env`.

**Real environment variables always win** over `.env`: anything the server already sets (DDEV's
`web_environment`, PHP-FPM's `env[...]`, nginx's `fastcgi_param`, Apache's `SetEnv`) is never
overridden by the file.

`.env.example` lists every variable and is the only env file that's committed. Copy it to `.env` to
start. The full list is in the [environment reference](../reference/environment).

::: warning Secrets stay on the server
`APP_SECRET` and anything else sensitive belong in the environment, never in `config/`, templates
or JavaScript. Vite only inlines variables prefixed `VITE_PUBLIC_` into the frontend bundle, so server
variables can't leak there by accident.
:::

## `config/app.php`

```php
return [
    'secret' => getenv('APP_SECRET') ?: throw new RuntimeException('APP_SECRET is not set.'),
    'debug' => getenv('APP_DEBUG') === '1',
    'url' => $url, // from APP_URL, validated
    'trusted_proxies' => [...], // from APP_TRUSTED_PROXIES

    'language' => 'en',
    'languages' => [
        'en' => ['name' => 'English', 'locale' => 'en_US'],
        'it' => ['name' => 'Italiano', 'locale' => 'it_IT'],
    ],

    'blog' => ['per_page' => 20],

    'site' => [
        'name' => 'TinyTank',
        'description' => 'A database-free PHP micro framework…',
        'image' => null,   // default share image, e.g. '/images/og-default.png'
        'author' => null,  // for blog posts and the feed; defaults to the site name
    ],
];
```

Every key is described in the [configuration reference](../reference/config).

## Debug mode

`APP_DEBUG=1` is development mode:

- nothing is cached: routes, templates, posts and translations are rebuilt on every request
- blog drafts are visible
- errors show Symfony's exception page, and PHP warnings throw
- pages load assets from the Vite dev server while `npm run dev` runs
- Twig's `strict_variables` is on, so a typo in a variable name is an error

Leave it unset (or `0`) in production: errors are logged and visitors get a generic error page.

## Overriding settings in code

`Kernel::boot()` accepts overrides that are merged over `config/app.php`. The test suites use
this to point the app at fixture content:

```php
$app = Kernel::boot($root, debug: false, overrides: [
    'content_dir' => __DIR__ . '/data/content',
    'cache_dir' => sys_get_temp_dir() . '/my-cache',
    'blog' => ['per_page' => 1],
]);
```
