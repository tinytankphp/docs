# How it works

`build:static` renders every page through your site, in production mode, exactly as the PHP site
would answer it, and writes it as a file.

```sh
npm run build
php bin/console build:static --base-url=https://example.com
```

The whole site is then in `deploy/`, ready for [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/)
(free for most sites); [Publishing](./publishing) puts it online.

## Where pages go

Each page is written where the host serves it at the same URL as the PHP site: for Cloudflare,
`/blog/my-post` becomes `deploy/blog/my-post.html`, which Cloudflare serves as `/blog/my-post` (and
redirects `/blog/my-post/` and `/blog/my-post.html` there). `/sitemap.xml` stays
`deploy/sitemap.xml`. Other hosts are described in [Hosts](./hosts).

## How pages are found

The build follows links, starting from the home page, the sitemap, the feed and `robots.txt`: every
post, page, collection item, page of a list and translation that something links to. Pages nothing
links to (like an unlisted page) go in `static.paths` ([Configuration](./configuration)).

## Files and media

It also copies `public/` (your asset build, the favicon, other files; not PHP) and publishes the
images and files of posts, pages and collections, with their responsive versions, then writes
`404.html` for unknown addresses.

The build has its own cache (`var/static-cache/`), so your development cache isn't touched. It only
ever empties a folder it wrote itself (marked by a `.tinytank-static` file).

## Broken links

A link to a file that doesn't exist (`/media/…`, `/build/…`) or a page that doesn't answer 200 fails
the build, with the page it was linked from:

```
/media/nowhere/gone.pdf is missing (linked from /legal)
```

The build also stops when a page uses something that needs the server: see
[What needs the server](./what-needs-the-server).
