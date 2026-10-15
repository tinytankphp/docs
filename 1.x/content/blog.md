# The blog

TinyTank includes a Markdown blog, meant for articles around your site's subject (the "content"
part of an SEO strategy). Posts are files in `content/blog/`; there's no database and no admin.

## What you get

- **`/blog`**: the newest posts, with live search and tag filters (Datastar)
- **`/blog/page/2`, `/blog/page/3`…**: older posts, with numbered page links and a **Load more** button
- **`/blog/<slug>`**: a post, with its own title, description, Open Graph tags and JSON-LD
- **`/blog/feed.xml`**: an Atom feed of the latest posts
- every published post in **`/sitemap.xml`**
- all of the above **per language** when posts are [translated](./translations)

The pages are built by `App\Controller\BlogController` and the templates in `templates/blog/` and
`templates/_partials/blog-*.twig`. They're part of your site, so restyle or restructure them freely;
the framework provides the data (`TinyTank\Blog\Blog`) and the feed/sitemap controllers.

## Where posts live

Each post is a folder named after its slug, filed by publication month, with its images next to it:

```
content/blog/
  2026/
    09/
      hello-tinytank/           → /blog/hello-tinytank
        index.md                  the post (default language)
        index.it.md               its Italian translation → /it/blog/hello-tinytank
        cover.png                 → /media/blog/hello-tinytank/cover.png
  drafts/
    next-post/                  only visible with APP_DEBUG=1, never deployed
      index.md
```

[Writing posts](./posts) explains the front matter, images and drafts.

## Pagination

`/blog` shows the newest posts; older ones are at `/blog/page/2`, `/blog/page/3`…
`/blog/page/1` redirects to `/blog`, and pages past the end are a 404. Each page has its own title
("Blog · Page 2") and canonical URL.

The pager in `templates/_partials/blog-pager.twig` is two pagers in one:

- **without JavaScript** (search engines, no-JS visitors): numbered page links with Newer / Older
- **with JavaScript**: Datastar hides those links and shows **Load more**, which appends the next
  page in place. It also works inside search and tag results.

The number of posts per page is `blog.per_page` in `config/app.php`, which reads `BLOG_PER_PAGE`
(default 20). Set `BLOG_PER_PAGE=1` in `.env` to try pagination with only a few posts.

## Search and tags

The search box and tag buttons on `/blog` re-render `_partials/blog-results.twig` through Datastar
as you type. Search matches titles, summaries and tags; it covers the posts of the current language.

## Caching

In production, posts are parsed once into `var/cache/blog.php` and their files are copied to
`public/media/blog/`, both by `bin/console deploy`. **Run `deploy` after publishing.** In debug mode,
posts are parsed on every request, so edits show up immediately.

## Using posts elsewhere

Query posts anywhere with `posts()` in Twig or `$this->app->posts()` in PHP, for example the
three latest on the home page:

```twig
{% for post in posts().limit(3) %}
    <a href="{{ path('blog_post', {slug: post.slug}) }}">{{ post.title }}</a>
{% endfor %}
```

See [Querying content](../basics/querying) for every parameter, and the
[PHP reference](../reference/php#blog) for the fields of a post.
