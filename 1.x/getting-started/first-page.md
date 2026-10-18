# Your first page

TinyTank has two kinds of pages, and most sites need far more of the first:

- **A content page**: a Markdown file in `content/pages/`. Its folder is its URL. No route, no
  controller. Use it for anything that is text and images: About, Team, Services, Privacy.
- **A page with a controller**: a route, a PHP class and a Twig template, for pages that compute
  something on each request.

This guide makes one of each, then adds a little interactivity.

## 1. A content page

Create `content/pages/team/index.md`:

```md
---
title: Our team
summary: The people behind the studio.
---
We are three designers and a developer, working from a small studio by the sea.

## What we do

Brand identities, websites and the occasional illustration.
```

Open `/team`. That's all: the page has its title, meta description and canonical URL, it's in the
sitemap, and the skeleton's menu lists it (menus are [queries](../basics/querying) over pages). An
Italian version is `index.it.md` in the same folder. Images go in the folder next to `index.md`.

The skeleton already has About, Contact and Privacy built this way. See
[Content pages](../content/pages) for templates per page, child pages, translated URLs and
[unlisted pages](../content/pages#unlisted-pages); repeating items with the same fields (services,
team members, products) are a [data collection](../content/collections).

::: warning One URL, one owner
A route and a content page can't share a URL: `deploy` stops when a route hides a page. Don't
create an `/about` route while `content/pages/about/` exists.
:::

## 2. A page with a controller

A page that changes on every request, say a studio's opening hours with "open now" or "closed
now", needs a controller. Add a route to `config/routes.php`:

```php
use App\Controller\HoursController;

return static function (Kernel $app): void {
    // …existing routes
    $app->get('/hours', HoursController::class, 'hours');
};
```

The third argument is the route's **name**: templates link to it with `path('hours')`, and
TinyTank adds the language prefix (`/it/hours`) on Italian pages.

Create `src/Controller/HoursController.php`:

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use TinyTank\Controller;

final class HoursController extends Controller
{
    public function __invoke(): string
    {
        $hour = (int) (new \DateTimeImmutable('now', new \DateTimeZone('Europe/Rome')))->format('G');

        $this->app->seo
            ->title($this->t('Opening hours'))
            ->description($this->t('When you can visit the studio.'));

        return $this->render('hours.twig', ['open' => $hour >= 9 && $hour < 18]);
    }
}
```

And `templates/hours.twig`:

```twig
{% extends '_layout.twig' %}

{% block content %}
    <h1 class="text-3xl font-bold">{{ 'Opening hours'|t }}</h1>
    <p class="mt-4">{{ 'Monday to Friday, 9:00 to 18:00.'|t }}</p>
    <p class="mt-2 font-semibold">{{ open ? 'Open now'|t : 'Closed now'|t }}</p>
{% endblock %}
```

The layout prints the `<title>`, meta description, canonical URL, Open Graph tags and the language
switcher from what the controller set on `seo`. Italian texts go in `translations/it.php`, keyed
by the English text:

```php
'Opening hours' => 'Orari di apertura',
'Open now' => 'Aperto ora',
```

::: tip Pages are cached by browsers and CDNs
TinyTank pages are public and revalidated with an ETag: a page whose content depends on the time
is fine (the ETag changes with it), but anything personal to a visitor isn't, see
[CDN caching](../deployment/cdn).
:::

## 3. A little interactivity

Interactivity uses [Datastar](../basics/datastar): HTML attributes, no JavaScript to write, and no
inline `<script>` (the Content Security Policy blocks it). There are two kinds of state.

**State that stays in the browser**, for things the server doesn't need to know: a counter, an open
menu, a selected tab. A **signal** and an expression:

```twig
<div data-signals="{count: 0}">
    <button data-on:click="$count++">{{ 'Add one'|t }}</button>
    <span data-text="$count"></span>
</div>
```

**The server's answer**, when the server must check, compute or look something up: search, a
form, "is this slot free?". A **template action** renders a Twig partial on the server with the
browser's signals as `signals`, and patches the result into the page:

```twig
{# in the page #}
<div data-signals="{count: 0}">
    <button data-on:click="{{ datastar.post('_partials/count') }}">{{ 'Add one on the server'|t }}</button>
    <p id="count">0</p>
</div>

{# templates/_partials/count.twig #}
{% set count = (signals.count ?? 0) + 1 %}
{% apply patch_elements %}<p id="count">{{ count }}</p>{% endapply %}
{% do patch_signals({count: count}) %}
```

`patch_elements` replaces the element with the same `id`, and `patch_signals` updates the signal
for the next click. A partial that queues nothing has its whole output patched as elements; as
soon as it queues an event (here `patch_signals`), only the queued events are sent, so its HTML
needs `{% apply patch_elements %}` too. Prefer browser state when it's enough; reach for the server when it has to
decide. More in [Datastar](../basics/datastar) and [JavaScript & Datastar](../features/javascript).

## Next

- [Content pages](../content/pages) and [Data collections](../content/collections)
- [Routing](../basics/routing): parameters, requirements, methods
- [Templates](../basics/templates): every Twig function TinyTank adds
- [Testing](../testing): checking pages and actions with PHPUnit
