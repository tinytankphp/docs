# Content pages

Content pages are one-off pages written in Markdown: About, Privacy, Imprint, Contact… They work like
Craft's singles, nested like a structure: each page is a folder, and the folders are the URL.

The skeleton has three: `privacy`, `about` and `about/credits`.

```
content/pages/
  privacy/
    index.md               /privacy
    index.it.md            /it/privacy
  about/
    index.md               /about (template: pages/about.twig)
    team.jpg               /media/pages/about/team.jpg
    credits/
      index.md             /about/credits, a child of about
```

Folder names use lowercase letters, digits and dashes. Every folder under `content/pages/` is a page
and needs an `index.md`. A page's images and files sit next to it, not in a subfolder, since
subfolders are child pages. The home page is a route, so there's no `content/pages/index.md`.

## Front matter

```md
---
title: About us                 (required)
summary: Who we are             (optional: meta description; defaults to the first paragraph)
image: team.jpg                 (optional share image: a file in the folder, a /path or an https URL)
template: pages/about.twig      (optional: its own template instead of page.twig)
order: 1                        (optional: for menus)
updated: 2026-10-01             (optional: last significant change, for the sitemap)
data:                           (optional: anything else the template needs)
  form_title: Write to us
slug: chi-siamo                 (translations only: this language's URL segment, see below)
form: contact                   (optional: a form from config/forms.php the page shows and receives)
cdn: false                      (optional: never cached at the CDN, see CDN caching)
unlisted: true                  (optional: reachable by its URL only, see below)
---
Page text in Markdown. ![Our team](team.jpg)
```

`cdn: false` matters only with [CDN caching](../deployment/cdn) on: for a page that changes more
often than you deploy. Your page controller applies it (the skeleton's `PageController` does).

Relative links and images point at files in the page's folder, like in posts. Any other front
matter key is an error that lists the allowed ones: put custom values under `data`.

## Translations

`index.<language>.md` is the page in another language. It keeps the `image`, `template`, `order`,
`updated` and `data` it omits, so a translation usually only needs the title and the text. A page
without a version in a language doesn't exist there: 404, and the language switcher sends visitors to
that language's home page.

### Translated slugs

A translation can have its own URL segment with `slug:`:

```md
---
title: Chi siamo
slug: chi-siamo
---
```

```
content/pages/about/index.it.md            slug: chi-siamo        /it/chi-siamo
content/pages/about/credits/index.it.md    slug: riconoscimenti   /it/chi-siamo/riconoscimenti
content/pages/about/history/index.it.md    (no slug)              /it/chi-siamo/history
```

Child pages combine their parents' translated slugs. The folder path stays the page's identity:
link with `path('page', {path: 'about/credits'})`, and TinyTank writes `/about/credits` or
`/it/chi-siamo/riconoscimenti` depending on the language. Each version's URL is its `uri` field.

The untranslated URL (`/it/about/credits`) redirects permanently to the translated one, and the
language switcher and `hreflang` link each version to its own URL. `slug:` is only for translations
(in the default language, rename the folder), and two pages with the same URL in one language are
an error.

## Templates

Pages render with `templates/page.twig`, which gets the page as `page`:

```twig
<h1>{{ page.title }}</h1>
{{ content(page) }}    {# the Markdown, with its components rendered #}
```

A page with `template:` in its front matter uses that template instead, with the same `page`
variable. This is how a page gets its own layout while its text stays in Markdown. A contact page,
for example:

```md
---
title: Contact
template: pages/contact.twig
data:
  form_title: Write to us
  sent: Thanks, we'll answer soon.
---
We read every message and usually answer within two days.
```

```twig
{# templates/pages/contact.twig #}
{% extends 'page.twig' %}
{% block content %}
    {{ parent() }}
    <form data-on:submit__prevent="{{ datastar.action('post', path('contact_send')) }}">
        <h2>{{ page.data.form_title }}</h2>
        …
    </form>
{% endblock %}
```

The form posts to a route of your own (`contact_send` in `config/routes.php`). The texts in `data`
are translated with the page: `index.it.md` gives its own `data`.

## Menus and child pages

Menus are queries ([Querying content](../basics/querying)). The skeleton's footer:

```twig
{% for item in pages().where('parent', '').where('unlisted', false).orderBy('order, title') %}
    <a href="{{ path('page', {path: item.path}) }}">{{ item.title }}</a>
{% endfor %}
```

A page's children, as `templates/pages/about.twig` lists them:

```twig
{% for child in pages().where('parent', page.path).where('unlisted', false).orderBy('order, title') %}…{% endfor %}
```

A page has these fields:

| Field | |
|---|---|
| `path` | `about/credits`: the folder path, the page's identity in every language |
| `uri` | the URL path in this language, without the language prefix: `chi-siamo/riconoscimenti` |
| `slug` | the folder name: `credits` |
| `parent` | the parent's path, or `''` for a top-level page |
| `depth` | `1` for top-level pages, `2` for their children… |
| `language`, `title`, `summary`, `image`, `template`, `order`, `updated`, `cdn`, `unlisted`, `data` | from the file and its front matter |
| `html` | the rendered Markdown |

`pages()` is sorted by path, so each page comes before its children.

### Unlisted pages

A page with `unlisted: true` works like any other, for whoever has its URL, but stays out of sight:
a style guide for your designer (the skeleton has one, `content/pages/style-guide/`), a thank-you
page, a campaign landing page, a preview for a client.

- search engines are told not to index it (`<meta name="robots" content="noindex">`);
- it isn't in `/sitemap.xml`;
- menus skip it, because they ask for `where('unlisted', false)`, as the skeleton's do. `pages()`
  itself still returns it: your templates decide what to show.

Translations inherit it, unless they set their own. Unlisted isn't private: anyone with the link can
open the page, and it's still served like any other.

## Routes

The skeleton's `config/routes.php` has the two routes pages need:

```php
$app->get(Pages::ASSET_URL . '/{file}', PageAssetController::class, 'page_asset', ['file' => '.+']);
$app->get('/{path}', [PageController::class, 'show'], 'page', ['path' => Pages::PATH], priority: -1);
```

The page route is a catch-all with a **negative priority**, so every other route wins wherever it's
defined, and an unknown URL ends up there as a 404. `src/Controller/PageController.php` is yours to
change, like the blog's controller: it finds the page by its `uri` and redirects folder paths that
a translated slug replaced.

If a page has the same URL as another route in any language, for example `content/pages/blog/` next
to the blog route, or an Italian `slug: blog`, it could never be shown. `deploy` stops with the page and the route's name, and the
skeleton's tests check it too.

## SEO and the sitemap

`TinyTank\Pages\PageSeo` (applied in `PageController`) sets the title, the summary as meta
description, the share image and a `WebPage` JSON-LD block, and `noindex` for an [unlisted](#unlisted-pages)
page. Every other page is in `/sitemap.xml` in each language it's written in, with `updated` as `lastmod`.

## In production

Pages are compiled into `var/cache/pages.php` and their files copied to `public/media/pages/` by
`deploy` (the `pages` step). Run `deploy` after changing them. In debug mode, edits show up
immediately.
