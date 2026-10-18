# SEO

Every page gets a `<title>`, meta description, canonical link, Open Graph and Twitter card tags,
`hreflang` links and optional JSON-LD, printed once by `{{ seo_tags() }}` in the layout.

## Setting page metadata

From a controller:

```php
use Spatie\SchemaOrg\Schema;

$seo = $this->app->seo
    ->title('About')
    ->description('Who we are.')
    ->image('/images/about.jpg');
$seo->schema(Schema::organization()->name('Acme')->url($seo->url('/')));
```

Or from a template, in the `seo` block (it renders before the tags are printed):

```twig
{% block seo %}{% do seo.title('About').description('Who we are.') %}{% endblock %}
```

| Setter | Effect |
|---|---|
| `title(?string)` | `<title>` becomes "Title · Site name"; `null` means just the site name |
| `description(?string)` | meta description, `og:description`, `twitter:description` |
| `canonical(string)` | canonical URL (defaults to the current path, without the query string) |
| `image(?string)` | share image: a `/path` or an `https://` URL; switches to the large Twitter card |
| `type(string)` | `og:type`: `website` (default) or `article` |
| `article(published, modified, tags)` | `og:type=article` plus `article:*` tags |
| `noindex(bool)` | keeps the page out of search engines |
| `schema(Type)` | adds a JSON-LD block built with [spatie/schema-org](https://github.com/spatie/schema-org) |

Site-wide defaults (name, description, default image, author) come from `site` in
`config/app.php`.

## Automatic metadata

- **Blog posts** are mapped from front matter by `TinyTank\Blog\PostSeo`: title, summary, image,
  `og:type=article` with dates and tags, and a `BlogPosting` JSON-LD block. Drafts get `noindex`.
- **Content pages** with `unlisted: true` get `noindex` and stay out of the sitemap
  ([Unlisted pages](../content/pages#unlisted-pages)).
- **Error pages** get `noindex`.
- **hreflang** links list the page in every language (or only where it exists, see
  [Languages](./languages#the-language-switcher)), plus `x-default` for the default language.

## Sitemap, feeds and robots.txt

Three framework controllers, wired in `config/routes.php`:

| URL | Controller | Content |
|---|---|---|
| `/sitemap.xml` | `TinyTank\Seo\SitemapController` | every static GET page in every language, plus every published post version |
| `/blog/feed.xml` | `TinyTank\Blog\FeedController` | Atom feed of the 20 latest posts in the current language (`/it/blog/feed.xml`…) |
| `/robots.txt` | `TinyTank\Seo\RobotsController` | allows everything and points to the sitemap |

"Static" pages are routes without placeholders or a file extension. Drafts and untranslated posts
never appear.

## Absolute URLs come from `APP_URL`

Canonical URLs, `og:url`, `og:image`, the sitemap and the feeds use `APP_URL`, **never the
request's `Host` header**. Pages are publicly cacheable, so a forged `Host` must not end up in a
cached page. Set `APP_URL` correctly on every server.

JSON-LD is encoded so that a `</script>` in any value can't break out of the tag.
