# Static builds

The same site can also be published as **plain files**, for a static host such as Cloudflare: no
PHP on the server. You keep developing as usual (`npm run dev`, the PHP site at
your local address); only the last step changes.

```sh
npm run build
php bin/console build:static --base-url=https://example.com
```

The whole site is now in `deploy/`, ready for [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/)
(free for most sites). Publish it with Cloudflare's command line tool:

```sh
cd deploy && npx wrangler deploy
```

::: warning Work in progress
Static builds are new. A static version of the blog search, and a preview command, come next.
:::

## How it works

`build:static` renders every page through your site, in production mode, exactly as the PHP site
would answer it, and writes it as a file.

`build:static` writes each page where the host serves it at the same URL as the PHP site: for
Cloudflare, `/blog/my-post` becomes `deploy/blog/my-post.html`, which Cloudflare serves as
`/blog/my-post` (and redirects `/blog/my-post/` and `/blog/my-post.html` there). `/sitemap.xml` stays
`deploy/sitemap.xml`.

It finds the pages by following links, starting from the home page, the sitemap, the feed and
`robots.txt`: every post, page, collection item, page of a list and translation that something
links to. Pages nothing links to (like an unlisted page) go in `static.paths`.

It also copies `public/` (your asset build, the favicon, other files; not PHP) and publishes the
images and files of posts, pages and collections, with their responsive versions, then writes
`404.html` for unknown addresses.

The build has its own cache (`var/static-cache/`), so your development cache isn't touched. It only
ever empties a folder it wrote itself (marked by a `.tinytank-static` file).

## Configuration

Optional, in `config/app.php`:

```php
'static' => [
    'out' => 'deploy',                    // the output folder (or --out)
    'base_url' => 'https://example.com',  // the site's address once published (or --base-url;
                                          // default APP_URL): used in the sitemap, the feed and share tags
    'paths' => ['/style-guide'],          // pages nothing links to
    'host' => 'cloudflare',               // or 'none', or your own class (below); or --host
    'name' => 'my-site',                  // the Worker's name on Cloudflare (default: the site's name)
],
```

## Hosts

The PHP site sends more than pages: with each one, headers (the Content Security Policy, which
tells browsers what may run on the page, and other protections), and redirects (`/blog/page/1` to
`/blog`). A static host has no PHP to send them, so the build writes them in the host's own files.

| `host` | Files | |
|---|---|---|
| `cloudflare` (default) | `<path>.html`, `_headers`, `_redirects`, `wrangler.jsonc`, and for [forms](#forms) `worker.js` | [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) with static assets |
| `none` | `<path>.html`, redirects as small HTML pages | any other host (GitHub Pages, a plain web server); the headers are lost |

For Cloudflare, `_headers` holds one rule for the whole site. Its Content Security Policy is
the strictest one that still lets every page work: what pages add to `img-src`, `media-src`,
`frame-src`, `font-src` or `style-src` (a video player's frame) is allowed site-wide, which is safe,
since those can't run code in the page; `script-src` and `connect-src` stay as the PHP site has
them. A page that adds a script source (`csp_allow()` in its template) gets a rule of its own. The
build stops if the site needs more rules than Cloudflare allows (100), or more redirects (2,000).
Vite's hashed files (`/build/…`) are cached for a year. `wrangler.jsonc` tells `npx wrangler deploy`
what to publish; it, `worker.js` and `.assetsignore` (the list of files never served) stay private.

### Your own host

A class implementing `TinyTank\Static\HostAdapter`, named in `config/app.php`
(`'host' => App\Static\MyHost::class`), with a constructor without arguments:

```php
use TinyTank\Static\Build;
use TinyTank\Static\HostAdapter;

final class MyHost implements HostAdapter
{
    /** Where a page goes, so the host serves it at the same URL: '/blog' → 'blog.html'. */
    public function file(string $path): string { … }

    /**
     * The host's own files, path => contents, from the build: $build->pages (each with the
     * `headers` the PHP site sends it) and $build->redirects (`to`, `status`).
     */
    public function files(Build $build): array { … }
}
```

## What needs the server

A static site has no PHP behind it, so some features can't work there:

- Datastar actions that call the server: a template action (`datastar.get('_partials/search')`),
  a custom route (the skeleton's clock)
- forms that post to the site, unless the host answers them ([Forms](#forms), below)

The build finds them on every page and stops with a list:

```
/blog: a Datastar GET action to the server (template _partials/blog-results)
/contact: a form posting to the site (/contact)
```

Browser-only Datastar keeps working (toggles, tabs, the theme, anything with `data-signals` and no
`@get`/`@post`), and so do JavaScript modules.

For the rest, templates can tell they're being rendered for a static build:

```twig
{% if not site.static %}
    {# the live search: only on the PHP site #}
{% endif %}
```

A static version of search (an index searched in the browser) is planned. Until then,
`--allow-dynamic` builds anyway, with the list as a warning.

## Forms

A form from `config/forms.php` keeps working on a static site when its host can send it. On
Cloudflare, the build adds a small Worker that answers the form, checks it like the PHP site does
and emails it to you, for free, through [Email Routing](https://developers.cloudflare.com/email-routing/).
Every page stays a plain file; the Worker only runs for the form.

1. Give the form a sender, in `config/forms.php`:

   ```php
   'contact' => [
       'fields' => [...],
       'to' => getenv('CONTACT_TO'),        // your inbox, verified at Cloudflare (step 3)
       'static' => ['from' => 'contact@forms.example.com'],
   ],
   ```

2. Let the form's template post to the host in a static build: `form_action()` is the page's own
   URL on the PHP site and `/forms/<name>` in a static build, and Datastar's in-place submit is
   left out (the skeleton's `templates/_forms/contact.twig` does both):

   ```twig
   <form method="post" action="{{ form_action('contact', url) }}"
         {% if not site.static %}data-on:submit__prevent="{{ datastar.action('post', url, {contentType: 'form'}) }}"{% endif %}>
       …
       {{ form_spam('contact') }}
   ```

3. Set up sending at Cloudflare, once:
   - In the Cloudflare dashboard, **Email** → **Email Routing** for your domain: add a
     **subdomain** for the sender, like `forms.example.com`, so your domain's own mail isn't
     touched (Cloudflare adds the records to the subdomain only). If it offers to set up the main
     domain, decline when another mail server receives it.
   - Under **Destination addresses**, add your inbox (the form's `to`) and confirm it from the
     email Cloudflare sends.
   - Sending only to your own verified addresses is free; the Worker's email binding is locked to
     the form's `to`, so it can't be used to write to anyone else.

4. Build and publish (`build:static`, then `npx wrangler deploy` in `deploy/`), and send yourself a
   message.

What happens on the static site:

- The visitor's message is checked like on the PHP site: required fields, lengths, email format,
  choices, the honeypot and the links limit, with the same messages in the page's language.
- A valid message is emailed to you, from the form's `static.from`, with the visitor in Reply-To;
  the visitor lands on the form page's **sent** state (`/contact/sent`, the page as it shows after
  sending).
- A message with mistakes gets a short page listing them, with a link back to the form (browsers
  catch most of them before sending, from the same rules).
- A bot that fills the hidden field is told it worked; nothing is sent.

What the static site doesn't do (it needs the PHP site): the timing check and the rate limit, your
own rules (`$app->forms->rule()`), and a custom email template (`_emails/<form>.txt.twig`); the
email lists every field, like the default template.

::: tip Privacy
The message goes through Cloudflare (your host) to you, and isn't stored. Say so on your privacy
page.
:::

## Broken links

A link to a file that doesn't exist (`/media/…`, `/build/…`) or a page that doesn't answer 200 fails
the build, with the page it was linked from.

## Preview

Cloudflare's own local server runs the build like the real host: the URLs, `_headers`,
`_redirects`, the Content Security Policy and the forms' Worker, whose emails it writes to files in
`deploy/.wrangler/tmp/email/` instead of sending them:

```sh
cd deploy && npx wrangler dev
```

A preview command is planned.
