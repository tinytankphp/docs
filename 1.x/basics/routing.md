# Routing

Routes are declared in `config/routes.php`, which returns a function receiving the kernel:

```php
use App\Controller\BlogController;
use App\Controller\HomeController;
use TinyTank\Kernel;

return static function (Kernel $app): void {
    $app->get('/', HomeController::class, 'home');
    $app->get('/blog', [BlogController::class, 'index'], 'blog');
    $app->get('/blog/{slug}', [BlogController::class, 'show'], 'blog_post', ['slug' => '[a-z0-9-]+']);
    $app->post('/contact', [ContactController::class, 'send'], 'contact');
};
```

Under the hood this is the [Symfony Routing](https://symfony.com/doc/current/routing.html)
component, so placeholders, requirements and named routes behave as they do in Symfony.

## Defining routes

```php
$app->get(string $path, $handler, ?string $name = null, array $requirements = [], int $priority = 0);
$app->post(string $path, $handler, ?string $name = null, array $requirements = []);
$app->route(string|array $methods, string $path, $handler, ?string $name = null, array $requirements = [], bool $csrf = true, int $priority = 0);
```

`route()` takes one or several HTTP methods (`['PUT', 'PATCH']`) and can switch off the
[CSRF check](../security#csrf-protection) for a route that must accept requests from other sites,
such as a webhook (`csrf: false`).

Routes are tried in the order they're defined, higher `priority` first. A catch-all such as the
[content pages](../content/pages) route (`/{path}`) uses `priority: -1`, so every other route wins,
even one added later.

## Handlers

A handler is one of:

| Handler | Example |
|---|---|
| A controller method | `[BlogController::class, 'show']` |
| An invokable controller | `HomeController::class` (calls `__invoke`) |
| A closure | `fn () => $app->render('about.twig')` |

Controllers are only created when their route matches. See [Controllers](./controllers).

## Parameters

Placeholders in the path arrive as **named arguments**:

```php
$app->get('/blog/{slug}', [BlogController::class, 'show'], 'blog_post', ['slug' => '[a-z0-9-]+']);

public function show(string $slug): string|Response { … }
```

The fourth argument holds a regular expression per placeholder. Without one, a placeholder matches
anything except `/`. To allow slashes (e.g. a file path), use `['file' => '.+']`.

## Names and links

Give every route you link to a name. In Twig:

```twig
<a href="{{ path('blog_post', {slug: post.slug}) }}">{{ post.title }}</a>
```

In PHP: `$this->path('blog_post', ['slug' => $slug])` in a controller, or `$app->path(...)`. Paths
come back **in the current language** (`/it/blog/…` on Italian pages); pass a third argument to
target a specific one: `path('blog', {}, 'en')`.

Routes without a name get one generated from the method and path, but you can't rely on it for links.

## Languages

Route paths are language-neutral: you declare `/about` once, and TinyTank also serves `/it/about`
for every other configured language. See [Languages](../features/languages).

## Responses to unknown routes

- An unknown path gets a **404**, a wrong method a **405** with an `Allow` header. Both render
  `templates/_error.twig`, or plain text for Datastar requests.
- In production, an exception becomes a **500** (logged, never shown); in debug mode you get
  Symfony's exception page.

## Compiled in production

Without `APP_DEBUG`, the router is compiled into `var/cache/routes.*.php` on first use or by
`bin/console deploy`. Run `deploy` (or `cache:clear`) after changing routes in production.

## The built-in route

TinyTank registers one route itself: `/datastar`, the endpoint behind `datastar.get(…)` and friends
(see [Datastar](./datastar)). Don't reuse that path.
