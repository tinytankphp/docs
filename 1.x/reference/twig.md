# Twig reference

## Globals

| Global | Type | |
|---|---|---|
| `site` | `TinyTank\Site` | `site.name`, `site.description` (in the current language), `site.baseUrl`, `site.language`, `site.locale`, `site.defaultLanguage`, `site.languages`, `site.path` (the current page's path without the language prefix, for menus: `site.path starts with '/projects'`) |
| `seo` | `TinyTank\Seo\Seo` | page metadata setters: `{% do seo.title('…') %}` (see [SEO](../features/seo)) |
| `datastar` | `TinyTank\Datastar` | Datastar actions, below |
| `globals` | `array` | your own values from `config/globals.php` (empty without it): `globals.socials.github` (see [Global values](../basics/templates#global-values)) |

Plus anything your `config/bootstrap.php` adds.

## Functions

| Function | Returns |
|---|---|
| `video(provider, id, start = 0)` | for video components: `{provider, name, id, title, poster, player, src, url}`; allows the player in this page's `frame-src` |
| `csp_allow(directive, source, …)` | adds Content Security Policy sources to the current response only (use with `do`) |
| `image(url, alt = '', options = {})` | a `<picture>` with responsive AVIF/WebP versions for a post's or page's image, a plain `<img>` otherwise; options: `preset`, `loading`, `sizes`, any `<img>` attribute |
| `form_spam(form)` | the spam checks' hidden fields for a form, inside its `<form>`; makes the page uncacheable when it prints a timing token |
| `content(item)` | the item's HTML with its content components rendered (`entry` = the item) |
| `posts()` | a `TinyTank\Query` over the blog posts ([Querying content](../basics/querying)) |
| `pages()` | a `TinyTank\Query` over the content pages |
| `collection(name)` | a `TinyTank\Query` over a data collection |
| `path(name, params = {}, language = null)` | URL path of a named route, in the current (or given) language |
| `absolute_url(pathOrUrl)` | absolute URL from `APP_URL`; absolute `http(s)` URLs are returned unchanged |
| `t(message, params = {}, language = null)` | translated text |
| `vite(entry, …)` | `<link>`/`<script>` tags for Vite entry points (dev server or build); entries or lists of entries |
| `vite_preload(source, …)` | `<link rel="preload">` for built fonts and images, by source path (e.g. a Fontsource `.woff2`); nothing with the dev server |
| `theme_script()` | inline `<script>` setting `<html data-theme>` from the saved choice or the system setting; first in `<head>` |
| `public_config()` | `<script type="application/json" id="tinytank-config">` with config `public`, or nothing when empty |
| `seo_tags()` | the page's `<title>`, meta, canonical, Open Graph, Twitter, hreflang and JSON-LD |
| `language_switcher()` | list of `{code, name, url, active, available}` for the current page |
| `patch_signals(signals, options = {})` | Datastar: queue a signals patch (use with `do`) |
| `remove_elements(selector, options = {})` | Datastar: queue an element removal |
| `execute_script(script, options = {})` | Datastar: queue a script |
| `location(uri, options = {})` | Datastar: queue a redirect |

## Filters

| Filter | |
|---|---|
| `t(params = {}, language = null)` | `{{ 'Hello {name}'\|t({name: user}) }}` |
| `patch_elements(options = {})` | Datastar: queue the content as an elements patch (`{% apply patch_elements %}…{% endapply %}`) |
| `format_date`, `format_datetime`, `format_time`, `format_number`, `format_currency`, … | from [Twig Intl Extra](https://twig.symfony.com/doc/3.x/filters/format_date.html); pass `locale: site.locale` |

## `datastar`

| Method | Prints |
|---|---|
| `datastar.get(template, vars = {}, options = {})` | `@get(…)` rendering `template` with `vars` (also `post`, `put`, `patch`, `delete`) |
| `datastar.action(method, url, options = {})` | `@method(url, options)` for any URL |

`options` are Datastar's own action options, e.g. `{openWhenHidden: true}`.

Templates rendered by Datastar requests receive the browser's signals as `signals`.
