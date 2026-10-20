# PHP API

The public API of the classes a site uses, from the `tinytank/framework` package
(`vendor/tinytank/framework/src/`, namespace `TinyTank\`).

## Kernel

`TinyTank\Kernel`, available as `$this->app` in controllers, `$this->app()` in commands, and as the
argument of `config/routes.php` and `config/bootstrap.php`.

| Member | |
|---|---|
| `Kernel::boot(string $root, ?bool $debug = null, array $overrides = [])` | builds the app from `config/` |
| `Kernel::serve(string $root)` | `public/index.php`: boots the app and answers the request; if it can't start, a plain 500 page and the reason in PHP's log (rethrown with `APP_DEBUG=1`) |
| `run()` | handles the current HTTP request (`public/index.php`) |
| `handle(Request $request): Response` | handles any request; used by tests |
| `get(path, handler, name, requirements, priority = 0)`, `post(…)` | add a route |
| `route(methods, path, handler, name, requirements, csrf = true, priority = 0)` | add a route; higher priority is tried first |
| `path(name, params = [], language = null): string` | URL path in the current language; for the `page` and `blog_post` routes, pass the folder path / slug and it writes the language's translated URL |
| `t(message, params = [], language = null): string` | translate a UI text |
| `posts(): Query`, `pages(): Query`, `collection(name): Query` | content queries ([Querying content](../basics/querying)) |
| `shadowedPages(): array` | content pages another route hides: `path => route name` (`deploy` refuses to run with any) |
| `render(template, vars = []): string` | render a Twig template |
| `content(item, ?link): string` | an item's HTML with its components rendered; with `$link`, components become links (the feed) |
| `cspAllow(directive, ...sources)` | CSP sources for the current response only |
| `video(provider, id, start = 0): array` | a video's poster, title and player URL; allows the player for this response |
| `$embeds` | `TinyTank\Content\Embeds`: `check()`, `video()`, `fetch()`, `missing()` |
| `addTemplates(dir, ?namespace)` | add a package's templates after the site's, before the framework's |
| `Kernel::TEMPLATES` | the framework's default templates folder (`@tinytank/…`) |
| `stream(template, vars = []): StreamedResponse` | render a template as a Datastar response |
| `error(status, message, headers = []): Response` | an error page |
| `request(): Request` | the current request |
| `addDeployStep(name, step, description, before, after)` | add a step to `deploy` |
| `$root`, `$debug`, `$cacheDir` | project root, debug mode, cache directory |
| `$twig`, `$router`, `$blog`, `$seo`, `$site`, `$container`, `$translations`, `$datastar`, `$vite`, `$publicConfig`, `$csp`, `$collections`, `$pages` | TinyTank's services |
| `$cdn` | CDN caching and purging: `skip()` keeps the current response out of the CDN, `usePurger()`, `purger()`, `url()` ([CDN caching](../deployment/cdn)) |
| `$logger` | the log, a Monolog `Logger` (PSR-3); also `Psr\Log\LoggerInterface` in the container ([Logging](../features/logging)) |

## Controller

`TinyTank\Controller`, base class for app controllers. See [Controllers](../basics/controllers).

`render()`, `stream()`, `json()`, `notFound()`, `path()`, `t()`, `get()`, `request()`, and `$this->app`.

## Site

`TinyTank\Site` (`$app->site`, `site` in Twig).

| Member | |
|---|---|
| `name(?language)`, `description(?language)`, `image(?language)`, `author(?language)` | from `config/app.php`, in the current (or given) language |
| `$baseUrl` | `APP_URL` |
| `$defaultLanguage`, `$languages` | language configuration |
| `language(): string`, `locale(): string` | the current language and locale |
| `prefix(?language): string` | `''` for the default language, `'/it'` otherwise |
| `localize(path, ?language): string` | `'/blog'` → `'/it/blog'` |
| `url(pathOrUrl): string` | absolute URL from `APP_URL` |
| `switcher(): array` | the current page in every language |
| `setAlternates(array $alternates, array $fallbacks = [])` | declare where the current page exists |
| `alternates(): array` | `language => path` of the current page |

## Seo

`TinyTank\Seo\Seo` (`$app->seo`, `seo` in Twig). Fluent setters `title()`, `description()`,
`canonical()`, `image()`, `type()`, `noindex()`, `article()`, `schema()`; plus `url()`,
`canonicalUrl()`, `imageUrl()`, `pageTitle()`, `documentTitle()`, `render()`. See [SEO](../features/seo).

## Blog

Query posts with `$app->posts()` ([Querying content](../basics/querying)). `TinyTank\Blog\Blog`
(`$app->blog`) is the source behind it: compiling, caching and files.

| Method | |
|---|---|
| `query(): Query` | what `$app->posts()` returns |
| `items(?language): array` | every post in a language, `slug => post`, newest first |
| `translations(slug): list` | the languages a post exists in |
| `uri(slug, language): ?string` | a post's URL segment in a language (a translated slug or the folder name) |
| `asset(slug, file): ?string` | the path of a post's published file |
| `warmup()`, `publishAssets(publicDir)` | used by `deploy` |
| `$perPage` | posts per page (`blog.per_page`) |

A post is an array:

| Field | |
|---|---|
| `slug` | the folder name: the post's identity in every language |
| `uri` | the URL segment in this language (`slug:` in a translation, or the folder name) |
| `language`, `title`, `summary` | strings |
| `date`, `updated` | `YYYY-MM-DD` (`updated` may be `null`) |
| `image` | public URL or `null` |
| `tags` | list of strings |
| `draft` | bool |
| `reading_minutes` | int |
| `html` | the rendered post (safe to print raw) |
| `source` | e.g. `2026/09/hello-tinytank/index.md` |
| `assets` | publishable files in the post folder |

`TinyTank\Blog\PostSeo::apply($seo, $post)` maps a post onto the page metadata.

## Pages

Query pages with `$app->pages()` ([Content pages](../content/pages)). `TinyTank\Pages\Pages`
(`$app->pages`) is the source behind it.

| Member | |
|---|---|
| `query(): Query` | what `$app->pages()` returns |
| `items(?language): array` | every page in a language, `path => page` |
| `translations(path): list` | the languages a page exists in |
| `uri(path, language): ?string` | a page's URL path in a language, translated slugs included |
| `asset(file): ?string` | the path of a page's published file (`about/team.jpg`) |
| `warmup()`, `publishAssets(publicDir)` | used by `deploy` |
| `Pages::PATH`, `Pages::ASSET_URL` | the page route's requirement, `/media/pages` |

`TinyTank\Pages\PageSeo::apply($seo, $page)` maps a page onto the page metadata.

## Collections

`TinyTank\Collections\Collections` (`$app->collections`), see [Data collections](../content/collections).

| Member | |
|---|---|
| `query(name): Query` | what `$app->collection(name)` returns (unknown names throw) |
| `json(name, ?language): list` | the allowlisted fields served at `/data/<name>.json` |
| `schema(name): Schema` | a collection's definition |
| `warmup(): array` | compile into `var/cache/collections.php`; returns items per collection |
| `exported(): list<string>` | collections with a JSON export |
| `asset(file): ?string` | the file behind `projects/pulse-os/cover.jpg` (an item folder's), or null |
| `publishAssets(publicDir): int` | copy the item folders' files to `public/media/collections/` (deploy does) |
| `Collections::ASSET_URL` | `/media/collections` |

## Images

`TinyTank\Images\Images` (`$app->images`), see [Images](../features/images): `picture()`,
`variant()`, `original()`, `publish()`, `size()`, `widthsFor()`; `$widths`, `$formats`, `$sizes`.
`$app->image($url, $alt, $options)` is what `image()` prints.

## Forms

`TinyTank\Forms\Forms` (`$app->forms`), see [Forms](../features/forms).

| Member | |
|---|---|
| `submit(name, Request): Submission` | validates, runs the spam checks, sends the email |
| `get(name): Form`, `blank(name): Submission` | a form's definition; its empty state |
| `rule(form, field, Closure)` | a custom validation rule |
| `addSpamCheck(name, Closure $factory)` | a spam check forms can list in `spam` |
| `spamMarkup(name): string` | what `form_spam()` prints |
| `useTransport(TransportInterface)` | deliver through another transport (tests) |

`Submission`: `$values`, `$errors` (field or `_form` => message), `$sent`, `$spam` (the reason, for logs), `valid()`.

## Csp

`TinyTank\Csp` (`$app->csp`), the Content Security Policy sent on pages (see [Security](../security#content-security-policy)).

| Member | |
|---|---|
| `allow(directive, ...sources): self` | add sources, e.g. `allow('frame-src', 'https://player.vimeo.com')` |
| `allowScript(code): self` | allow one inline script by its hash (for `execute_script()`) |
| `Csp::hash(code): string` | `'sha256-…'` source for inline code |
| `directives(): array` | the policy, `directive => sources` |
| `header(?devServer): string` | the header value |
| `$enabled`, `$reportOnly` | from `config/app.php` `csp` |

## Container

`TinyTank\Container` (`$app->container`), PSR-11: `set(id, factoryOrValue)`, `get(id)`, `has(id)`.

## Console

- `TinyTank\Console\AppCommand`: base class for commands; `app()`, `root()`
- `TinyTank\Console\Console::run($root)`: what `bin/console` calls

## Testing

`TinyTank\Testing\KernelTestCase`, the base class for app tests (needs `phpunit/phpunit`):
`bootKernel()`, `request()`, `body()`, `tempDir()`, `copyToTemp()`, `write()`, and
`requireViteBuild($app)` for tests that check built assets. `request()` takes form fields as
`parameters:`. See [Testing](../testing).
