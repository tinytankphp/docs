# Static builds

The same site can also be published as **plain files**, for a static host such as Cloudflare: no
PHP on the server. You keep developing as usual (`npm run dev`, the PHP site at
your local address); only the last step changes.

```sh
npm run build
php bin/console build:static --base-url=https://example.com
```

The whole site is now in `deploy/`, ready for [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/)
(free for most sites); [Publishing](#publishing) puts it online.


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
    'domains' => ['example.com'],         // your domains on Cloudflare (default: the workers.dev address)
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

## Publishing

On Cloudflare Workers, with Cloudflare's command line tool, `wrangler` (it needs Node.js; `npx`
fetches it, or install it in the site with `npm i -D wrangler`):

1. Set the site's public address and domain in `config/app.php`. The domain must be managed by
   Cloudflare (its DNS on Cloudflare); Cloudflare points it at the site and makes its certificate:

   ```php
   'static' => [
       'base_url' => 'https://example.com',
       'domains' => ['example.com'],
   ],
   ```

2. Create an API token, so wrangler can publish without a browser login (which a container can't
   receive). In the Cloudflare dashboard, **Manage Account** → **Account API Tokens** →
   **Create Token** (or **My Profile** → **API Tokens** for one tied to you), and give it **two
   policies**. Workers permissions belong to the account, so a policy limited to a domain doesn't
   grant them, even with the right boxes ticked:

   | Policy | Resource | Permissions |
   |---|---|---|
   | 1 | your account | **Workers Scripts: Edit**, **Account Settings: Read**, **Workers Tail: Read** (for `wrangler tail`, the forms' logs) |
   | 2 | **Specified Domains** → the site's domain | **Workers Routes: Edit** (connects `domains` to the Worker) |

   The **Edit Cloudflare Workers** template ticks these and more (KV, R2, Pages…, not needed);
   check the template didn't put them all under the domain's policy. Copy the token (shown once)
   into `.env`, with your account ID (on the dashboard's home page, or any domain's overview):

   ```ini
   CLOUDFLARE_API_TOKEN=…
   CLOUDFLARE_ACCOUNT_ID=…
   ```

   `.env` is never committed, and nothing from it is written in the build. If wrangler answers "No
   access to the specified resource" or "Authentication error", the token lacks one of these, or
   has it under the domain's policy only. Editing a token's policies keeps its value.

3. Build and publish:

   ```sh
   php bin/console publish:static          # with DDEV: ddev exec php bin/console publish:static
   ```

   It runs `build:static`, then `wrangler deploy` in the output folder (`--no-build` publishes the
   existing build; `--dry-run` only shows the command). The first deploy creates the Worker (named
   after `static.name`, or the site) and connects the domains; later ones replace the files. Without
   `domains`, the site is at `https://<name>.<your-account>.workers.dev`.

   Rather log in through a browser? From a terminal on your computer: `npx wrangler login` once,
   then `npx wrangler deploy` in `deploy/` after each `build:static` (forms sent over SMTP need
   their secrets once: `npx wrangler secret put SMTP_PASSWORD`, and the same for the other keys).

4. Check the live site: its pages, and a message through each form.

Each deploy publishes everything again, so it's always the build's exact copy; Cloudflare keeps
earlier versions, to roll back in its dashboard.

## What needs the server

A static site has no PHP behind it, so some features can't work there:

- Datastar actions that call the server: a template action (`datastar.get('_partials/search')`),
  a POST to a route (the skeleton's clock). A plain GET of a page of the site
  (`datastar.action('get', path('blog_search'))`) is fine: the build writes that page too, and the
  file answers it
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

`--allow-dynamic` builds anyway, with the list as a warning.

## Search

The skeleton's blog search works on a static site too. On the PHP site the server filters the posts
(`_partials/blog-results.twig`); in a static build the browser does:

- `/blog/search` (route `blog_search`, `templates/blog/search.twig`) lists every post, each with its
  words and tags in `data-words` and `data-tags`, and shows while it matches:
  `data-show="($tag === '' || el.dataset.tags.split(' ').includes($tag)) && el.dataset.words.includes($q.trim().toLowerCase())"`.
  It's marked `noindex`, and its route stays out of the sitemap (`sitemap: false`); the build finds it
  through the search box.
- In a static build, the search box and tag buttons load it on first use with a plain Datastar GET,
  in place of an empty `#blog-search`, and hide the page's own list while a search or tag is active:

  ```twig
  {% set filter = site.static
      ? '$_all || ($_all = true, ' ~ datastar.action('get', path('blog_search')) ~ ')'
      : '$page = 1; ' ~ datastar.get('_partials/blog-results') %}
  ```

The same pattern searches anything else (a collection, a catalogue): a page listing every item with
its words, loaded on first use, filtered by Datastar in the browser. It suits a few hundred items;
the whole list is one request.

## Forms

A form from `config/forms.php` keeps working on a static site when its host can send it. On
Cloudflare, the build adds a small Worker that answers the form, checks it like the PHP site does
and emails it to you. Every page stays a plain file; the Worker only runs for the form. It sends in
one of two ways (`static.send`):

- **`smtp`: your own mail server** (your domain's mailbox, your email provider's SMTP), on
  Cloudflare's free plan. The Worker connects to it like a mail program: port 465 (TLS), 587
  (STARTTLS) or 25.
- **`cloudflare`** (the default): Cloudflare's [Email Service](https://developers.cloudflare.com/email-service/),
  through a binding locked to the form's recipients. It needs a paid Workers plan and the sending
  domain set up there.

1. Give the form a sender, in `config/forms.php`:

   ```php
   'contact' => [
       'fields' => [...],
       'to' => getenv('CONTACT_TO'),        // the PHP site's recipient (in development, DDEV's Mailpit)
       'static' => [
           'from' => 'contact@example.com',  // an address your mail server may send from
           'to' => 'you@example.com',        // the static site's recipient; without it, the form's `to`
           'send' => 'smtp',
       ],
   ],
   ```

   Rather keep the addresses out of the repository? Read them from `.env`, and leave the form
   without `static` when they aren't set (tests, CI): `'static' => getenv('STATIC_MAIL_FROM') ? [...] : null`.

2. Let the form's template post to the host in a static build: `form_action()` is the page's own
   URL on the PHP site and `/forms/<name>` in a static build, and Datastar's in-place submit is
   left out (the skeleton's `templates/_forms/contact.twig` does both):

   ```twig
   <form method="post" action="{{ form_action('contact', url) }}"
         {% if not site.static %}data-on:submit__prevent="{{ datastar.action('post', url, {contentType: 'form'}) }}"{% endif %}>
       …
       {{ form_spam('contact') }}
   ```

3. With `smtp`, put the mail server's settings in `.env`:

   ```ini
   SMTP_HOST=mail.example.com
   SMTP_PORT=465
   SMTP_USER=contact@example.com
   SMTP_PASSWORD='…'
   ```

   Write passwords in **single quotes**: unquoted or in double quotes, `.env` reads `$NAME` as a
   variable, and a password with a `$` reaches the server changed ("535 Authentication failed").
   `publish:static` warns about it.

   `publish:static` hands them to Cloudflare as the Worker's encrypted secrets, after each deploy
   (`wrangler secret bulk`, on its input: never in a file); they're never in the build. The
   server must accept connections from Cloudflare's addresses, as from any mail program.

   With `cloudflare`, set up the sending domain in the dashboard's **Email Service** instead; the
   build adds the binding.

4. Publish (`php bin/console publish:static`) and send yourself a message. If you get "Your
   message wasn't sent", the Worker's log says why: run `npx wrangler tail` in `deploy/` (with the
   token in the environment) and send again. "The mail server answered 535" is a refused login
   (the user, the password, its quoting); a timeout is a server that doesn't accept Cloudflare's
   connections.

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
The message goes through Cloudflare (your host), and your mail server with `smtp`, to you, and isn't stored. Say so on your privacy
page.
:::

## Broken links

A link to a file that doesn't exist (`/media/…`, `/build/…`) or a page that doesn't answer 200 fails
the build, with the page it was linked from.

## Preview

See the build exactly as it'll be published, before uploading it:

```sh
php bin/console build:static
php bin/console preview:static        # http://localhost:4173
```

For the `cloudflare` host it runs Cloudflare's own local server on `deploy/` (`wrangler dev`): the
same URLs, redirects, headers and Content Security Policy as on Cloudflare, and the forms' Worker,
which writes its emails to files in `deploy/.wrangler/tmp/email/` instead of sending them. It uses
the site's `wrangler` if it's installed (`npm i -D wrangler`), otherwise `npx` downloads it once.

`--php` uses PHP's built-in server instead, without Node: pages, files and redirects, but not the
host's headers or the forms. Options: `--port` (4173), `--ip` (`0.0.0.0`, so DDEV can reach it),
`--out`, `--dry-run` (only print the command).

With DDEV, the skeleton exposes the port: open `https://<project>.ddev.site:4173` (after a
`ddev restart` if you added the port to an existing site's `.ddev/config.yaml`).
