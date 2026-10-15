# Querying content

Templates and controllers don't receive content automatically: they ask for what they need, the way
Craft CMS's element queries work. Only context is always there (`site`, `seo`, `datastar`).

```twig
{% set latest = posts().tag('php').limit(3).all() %}
{% set result = posts().search(q).paginate(page) %}
{% set faq = collection('faq').all() %}
{% set ada = collection('team').slug('ada').one() %}
```

```php
$latest = $this->app->posts()->tag('php')->limit(3)->all();
$faq = $this->app->collection('faq')->all();
```

| Function | Queries |
|---|---|
| `posts()` | [blog posts](../content/blog), newest first |
| `pages()` | [content pages](../content/pages), by path (each page before its children) |
| `collection(name)` | a [data collection](../content/collections), in its `sort` order |

## How a query works

1. **Start** with `posts()` or `collection('faq')`.
2. **Narrow** it with parameters: `.tag('php')`, `.where('featured', true)`, `.limit(5)`…
3. **Run** it: `.all()`, `.one()`, `.count()`, `.paginate(page)`, or a `for` loop.

Nothing is read until the last step. A production request then reads a cached PHP array that
Opcache keeps in memory, so queries are cheap.

Queries are **immutable**: every parameter returns a new query and leaves the original alone. So a
base query can be reused and branched safely:

```twig
{% set query = posts() %}
{% if tag %}
    {% set query = query.tag(tag) %}
{% endif %}
{% set result = query.paginate(page) %}

{% set php = posts().tag('php') %}
{{ php.count }} posts, latest: {{ php.one().title }}
```

Unlike Craft's mutable queries, there's no `clone()` to remember: `{% set query = query.tag(tag) %}`
is the whole pattern.

## Parameters

| Parameter | |
|---|---|
| `where(field, value)` | items whose field equals the value (strictly: `'1'` isn't `1`). A list of values matches any of them; on a list field (`tags`), items that contain the value |
| `slug(slug)` | `where('slug', …)`; one slug or a list |
| `tag(tag)` | `where('tags', …)`. An empty value or `null` doesn't filter, so a request value can go straight in |
| `search(text)` | items containing the text, case-insensitive. Posts: title, summary and tags; collections: their `string` and `list` fields. Empty: no filter |
| `language(code)` | items in that language instead of the current one |
| `orderBy('field [asc\|desc], …')` | replaces the default order: `'title'`, `'date desc'`, `'order, name'`. Items without a value come last; text is compared naturally ("Item 9" before "Item 10") and case-insensitively |
| `limit(n)`, `offset(n)` | a slice of the results |

A field that doesn't exist is an error, not an empty result:

```
posts: no field "categry". Fields: slug, language, title, date, updated, image, summary, tags, draft, reading_minutes.
```

## Running a query

| Method | Returns |
|---|---|
| `all()` | the matching items, as a list |
| `one()` | the first match, or `null` |
| `count()` (or `\|length`) | how many items `all()` would return |
| `exists()` | whether there's at least one |
| `paginate(page, perPage = null)` | one page: `{items, page, pages, per_page, total, has_more}`. Ignores `limit` and `offset`; `perPage` defaults to `blog.per_page` for posts and 20 otherwise. A page past the end has no items |
| `countBy(field)` | how many matches have each value, most frequent first: `posts().countBy('tags')` → `{php: 3, guide: 1}` |
| `for item in query` | loops over `all()` |

Items are arrays: see the fields of [posts](../reference/php#blog) and of
[collection items](../content/collections#add-items).

## Examples

A "latest posts" box on the home page:

```twig
{% for post in posts().limit(3) %}
    <a href="{{ path('blog_post', {slug: post.slug}) }}">{{ post.title }}</a>
{% endfor %}
```

Tag buttons with counts:

```twig
{% for tag, count in posts().countBy('tags') %}
    <button>{{ tag }} ({{ count }})</button>
{% endfor %}
```

A blog page in a controller, with a 404 past the last page:

```php
$result = $this->app->posts()->paginate($page);
if ($page > $result['pages']) {
    return $this->notFound();
}

return $this->render('blog/index.twig', ['result' => $result]);
```

Featured team members, alphabetically:

```twig
{% for member in collection('team').where('featured', true).orderBy('name') %}…{% endfor %}
```

## In PHP

`$this->app->posts()`, `$this->app->pages()` and `$this->app->collection('faq')` return the same
`TinyTank\Query`, with the same methods. With PHPStan, `posts()` and `pages()` are typed as queries
of posts and pages, so `->one()` is known to return such an array or `null`.
