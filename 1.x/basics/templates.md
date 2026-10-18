# Templates

Templates are [Twig](https://twig.symfony.com) files in `templates/`. In production they're
compiled to PHP classes in `var/cache/twig` (by `deploy` or on first use).

## The layout

`templates/_layout.twig` is the page shell. Two parts of it matter to TinyTank:

```twig
<html lang="{{ site.language }}">
<head>
    {{ theme_script() }}            {# first: light/dark before anything is painted #}
    {% block seo %}{% endblock %}   {# pages can set metadata here… #}
    {{ seo_tags() }}                {# …printed once: title, description, Open Graph, hreflang, JSON-LD #}
    {{ public_config() }}           {# config values allowlisted for JavaScript #}
    {{ vite('resources/js/app.js', page_scripts ?? []) }}   {# plus the page's own bundles #}
</head>
```

A page sets its metadata either in its controller (`$this->app->seo->title(…)`) or in its
template, in the `seo` block that renders before the tags are printed:

```twig
{% extends '_layout.twig' %}
{% block seo %}{% do seo.title('About').description('Who we are.') %}{% endblock %}
```

## What TinyTank adds to Twig

| Name | Kind | Example |
|---|---|---|
| `path(name, params, language)` | function | `{{ path('blog_post', {slug: post.slug}) }}` |
| `t` | filter | `{{ 'Load more'\|t }}`, `{{ '{n} posts'\|t({n: 3}) }}` |
| `t(message, params)` | function | `{{ t('Blog') }}` |
| `vite(entry, …)` | function | `{{ vite('resources/js/app.js', page_scripts ?? []) }}` |
| `public_config()` | function | config values allowlisted for JavaScript |
| `vite_preload(source, …)` | function | `<link rel="preload">` for a built font or image |
| `theme_script()` | function | the light/dark script for the top of `<head>` |
| `content(item)` | function | a post, page or item's HTML with its [components](../content/components) rendered: `{{ content(post) }}` |
| `posts()`, `pages()`, `collection(name)` | functions | content queries: `posts().tag('php').limit(3).all()` ([Querying content](./querying)) |
| `seo_tags()` | function | prints the page's metadata |
| `absolute_url(path)` | function | `{{ absolute_url('/blog') }}` → `https://example.com/blog` |
| `language_switcher()` | function | the current page in every language |
| `format_date`, `format_number`… | filters | `{{ post.date\|format_date('long', locale: site.locale) }}` ([Twig Intl](https://twig.symfony.com/doc/3.x/filters/format_date.html)) |
| `site` | global | `site.name`, `site.language`, `site.locale` |
| `seo` | global | `{% do seo.title('…') %}` |
| `datastar` | global | `datastar.get('_partials/search')` ([Datastar](./datastar)) |
| `globals` | global | your own values from `config/globals.php`: `globals.socials.github` (below) |

Plus the Datastar tags `patch_elements`, `patch_signals`, `remove_elements`, `execute_script` and
`location` used in partials. The [Twig reference](../reference/twig) has every signature.

## Global values

Values every template needs, such as social links, a phone number or an address, go in
`config/globals.php` rather than being repeated in templates (like Craft's globals):

```php
<?php // config/globals.php

return [
    'socials' => [
        'github' => 'https://github.com/example',
        'x' => 'https://x.com/example',
    ],
    'phone' => '+39 06 1234 5678',
];
```

```twig
<a href="{{ globals.socials.github }}">GitHub</a>
{% for name, url in globals.socials %}<a href="{{ url }}">{{ name }}</a>{% endfor %}
```

The array can be nested as deep as you like. The file is optional, and it's plain PHP: a value can
come from the environment (`getenv('SHOP_URL') ?: 'https://shop.example.com'`). Controllers and
commands read the same values as `$app->globals`.

::: warning Public values
Whatever `globals` holds can end up in a page, so never put secrets there: they belong in `.env`.
Values that change by language are better as translations (`{{ 'Opening hours'|t }}`).
:::

## Partials

Files in `templates/_partials/` are fragments: included by pages, and rendered on their own by
Datastar requests. The leading underscore is a convention; Datastar can render any template.

## Error pages

`templates/_error.twig` renders every error (404, 405, 500) with two variables, `status` and
`message`. Error pages get `noindex` automatically.

## Escaping

Twig escapes everything by default. Use `|raw` only for HTML you trust; the blog's rendered post
HTML is safe to print raw, because Markdown is parsed with raw HTML escaped and unsafe links removed.

## Debug mode

With `APP_DEBUG=1`, templates aren't cached and `strict_variables` is on: using an undefined
variable is an error instead of an empty string. Use `??` for optional variables:
`{{ signals.q ?? '' }}`.
