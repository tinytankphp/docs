# Your first page

Let's add an **About** page in both languages, with its own controller, template and SEO.

## 1. The route

Routes live in `config/routes.php`. Add one, pointing to a controller:

```php
use App\Controller\AboutController;

return static function (Kernel $app): void {
    // …existing routes
    $app->get('/about', AboutController::class, 'about');
};
```

The third argument is the route's **name**: templates link to it with `path('about')`, and
TinyTank takes care of the language prefix (`/it/about` on Italian pages).

## 2. The controller

Create `src/Controller/AboutController.php`:

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use TinyTank\Controller;

final class AboutController extends Controller
{
    public function __invoke(): string
    {
        $this->app->seo
            ->title($this->t('About'))
            ->description($this->t('Who we are and what we do.'));

        return $this->render('about.twig');
    }
}
```

An invokable controller (`__invoke`) needs just its class name in the route. For several actions
in one class, use `[AboutController::class, 'method']` instead.

## 3. The template

Create `templates/about.twig`:

```twig
{% extends '_layout.twig' %}

{% block content %}
    <h1 class="text-3xl font-bold">{{ 'About'|t }}</h1>
    <p class="mt-4">{{ 'We build calm, fast websites.'|t }}</p>
{% endblock %}
```

The layout already prints the `<title>`, meta description, canonical URL, Open Graph tags and the
language switcher, from what the controller set on `seo`.

## 4. The translations

Add the Italian texts to `translations/it.php`:

```php
'About' => 'Chi siamo',
'Who we are and what we do.' => 'Chi siamo e cosa facciamo.',
'We build calm, fast websites.' => 'Costruiamo siti web calmi e veloci.',
```

The keys are the English texts used in the templates, so `en.php` needs no entries for them.

## 5. Link to it

In `templates/_layout.twig`, add a link to the navigation:

```twig
<a href="{{ path('about') }}">{{ 'About'|t }}</a>
```

Open `/about` and `/it/about`. The page appears in the sitemap automatically, and its hreflang
links tie the two languages together.

## Next

- [Routing](../basics/routing): parameters, requirements, methods
- [Templates](../basics/templates): every Twig function TinyTank adds
- [Datastar](../basics/datastar): make the page interactive
