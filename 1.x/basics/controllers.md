# Controllers

Controllers live in `src/Controller/` and extend `TinyTank\Controller`:

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use TinyTank\Controller;
use Symfony\Component\HttpFoundation\Response;

final class BlogController extends Controller
{
    public function show(string $slug): string|Response
    {
        $post = $this->app->posts()->slug($slug)->one();
        if ($post === null) {
            return $this->notFound($this->t('Post not found.'));
        }

        return $this->render('blog/post.twig', ['post' => $post]);
    }
}
```

Each request creates a new controller, with the kernel as its only constructor argument
(`$this->app`). Extending `TinyTank\Controller` is optional, but it gives you the helpers below.

## What an action returns

- **A string**: sent as an HTML page (`200`, `text/html`).
- **Any Symfony `Response`**: JSON, redirects, files, streamed responses, custom status codes.

```php
use Symfony\Component\HttpFoundation\RedirectResponse;

return new RedirectResponse($this->path('blog'), 301);
```

Successful GET pages automatically get an ETag and `Cache-Control: public, no-cache`, so repeat
visits are answered with a `304`.

## Helpers

| Method | What it does |
|---|---|
| `render($template, $vars)` | Renders a Twig template to a string |
| `stream($template, $vars)` | Renders a template as a [Datastar](./datastar) response |
| `json($data, $status = 200)` | A `JsonResponse` |
| `notFound($message)` | The 404 error page |
| `path($name, $params, $language)` | URL path of a named route, in the current language |
| `t($message, $params)` | Translates a UI text ([Languages](../features/languages)) |
| `get($id)` | A service from the [container](../extending/bootstrap) |
| `request()` | The current Symfony `Request` |

## The kernel

`$this->app` is the `TinyTank\Kernel`. Its most useful parts:

| Property / method | |
|---|---|
| `$app->seo` | Page metadata: title, description, Open Graph, JSON-LD ([SEO](../features/seo)) |
| `$app->site` | Site name, URL, languages and the current language |
| `$app->blog` | Blog posts: `find()`, `all()`, `page()`, `search()`, `tags()` |
| `$app->container` | Services registered in `config/bootstrap.php` |
| `$app->twig` | The Twig environment |
| `$app->debug` | Whether debug mode is on |
| `$app->error($status, $message)` | An error page with any status |

The full list is in the [PHP API reference](../reference/php).

## Closures

For tiny pages, a closure in `config/routes.php` is enough:

```php
$app->get('/healthz', static fn () => new Response('ok', 200, ['Content-Type' => 'text/plain']), 'health');
```

Closures receive route parameters as named arguments like controller methods do; use
`$app` from the surrounding function to render templates.
