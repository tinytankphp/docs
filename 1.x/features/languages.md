# Languages

## Configuring languages

```php
// config/app.php
'language' => 'en',                                        // default: no URL prefix
'languages' => [
    'en' => ['name' => 'English', 'locale' => 'en_US'],
    'it' => ['name' => 'Italiano', 'locale' => 'it_IT'],   // served under /it/
],
```

- `language` is the default language. It has **no URL prefix**: `/blog`.
- Every other language in `languages` is prefixed with its code: `/it/blog`.
- `name` is shown in the language switcher; `locale` is used for `og:locale`, dates and plurals.

An Italian-only site sets `'language' => 'it'` and lists only `it`. Adding English later puts it
under `/en/…` without changing any existing URL.

## URLs

| Request | Result |
|---|---|
| `/blog` | the default language |
| `/it/blog` | Italian (routed as `/blog`) |
| `/en/blog` (English is the default) | `301` redirect to `/blog` |
| `/italy` | not a language prefix: routed as `/italy` |

Routes are declared once, without a prefix. `path()` returns paths in the current language, and
Datastar requests carry it too, so links never fall out of the visitor's language.

## The `site` object

`$app->site` in PHP and `site` in Twig hold the languages and the current one:

```twig
<html lang="{{ site.language }}">           {# "it" #}
{{ post.date|format_date('long', locale: site.locale) }}   {# "20 settembre 2026" #}
```

| | |
|---|---|
| `site.language` | current language code |
| `site.locale` | current locale, e.g. `it_IT` |
| `site.defaultLanguage` | the default language |
| `site.languages` | every configured language |

## Translating texts

UI texts live in `translations/<code>.php`, which returns `[text => translation]`. Write the texts
in your templates' language and wrap them:

```twig
{{ 'Load more'|t }}
{{ '{shown} of {total} posts'|t({shown: 20, total: 45}) }}
{{ t('Blog') }}
```

```php
// translations/it.php
return [
    'Load more' => 'Carica altri',
    '{shown} of {total} posts' => '{shown} di {total, plural, one {# articolo} other {# articoli}}',
];
```

In PHP: `$this->t('Post not found.')` in controllers, `$app->t(…)` elsewhere.

Messages use [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
through `symfony/translation`, so placeholders (`{name}`) and plurals work in every language.

**A missing translation shows the text itself, never another language.** On an Italian-default
site with English templates, a text missing from `en.php` stays English. So the templates' own
language file only needs entries whose wording differs, or plural forms.

In production, translations are compiled into `var/cache/translations` by `deploy`.

## The language switcher

```twig
{% for language in language_switcher() %}
    <a href="{{ language.url }}"{% if language.active %} aria-current="true"{% endif %}>{{ language.name }}</a>
{% endfor %}
```

Each entry has `code`, `name`, `url`, `active` and `available`. The site's version is in
`templates/_partials/language-switcher.twig` and shows only when there's more than one language.

On pages that exist in only some languages (a post with one translation, page 3 of a blog that's
shorter in Italian), controllers declare the existing versions:

```php
$this->app->site->setAlternates(
    ['en' => '/blog/beta'],     // where this page exists
    ['it' => '/it/blog'],       // where to send the other languages instead
);
```

The switcher then marks the other languages as unavailable and links them to the fallback, and
`hreflang` lists only the existing versions.

## The site's name, description and share image

In `config/app.php`, each `site` value is either the same for every language or a map per language:

```php
'site' => [
    'name' => 'TinyTank',
    'description' => [
        'en' => 'A database-free PHP micro framework for static-like dynamic sites.',
        'it' => 'Un micro framework PHP senza database per siti dinamici veloci come quelli statici.',
    ],
    'image' => ['en' => '/images/share.en.png', 'it' => '/images/share.it.png'],
    'author' => null,
],
```

They follow the page's language everywhere: titles (`About · TinyTank`), the meta description, Open
Graph, JSON-LD, the feed's title and subtitle, and `site.name` / `site.description` in templates
(`$this->app->site->name()` in PHP).

A language missing from a map uses the default language's value; `null` in a map means "none in this
language" (for example, no share image). A map must include the default language, and only list
configured languages: anything else stops the site at boot.

## What's translated

UI texts, dates, error pages, blog posts, pages, collections and their URLs, the site's name and
description, feeds, `<html lang>`, `og:locale` and hreflang.
