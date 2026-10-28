# Philosophy

A few principles explain most of TinyTank's design decisions. Knowing them makes the rest of the
documentation predictable.

## Compile ahead of time

Most of a website changes only when you deploy. TinyTank moves the work there:
`bin/console deploy` compiles routes, templates, blog posts, translations and the asset manifest
into PHP files, and the web server's Opcache keeps them in memory. At request time, PHP mostly
looks things up.

In development (`APP_DEBUG=1`) nothing is cached, so every change shows up immediately.

## No database

Content is Markdown in `content/`, configuration is PHP in `config/` plus environment variables,
and anything per-visitor lives in the browser. No database means nothing to migrate, back up or
secure, and a deploy is a file copy.

## Proven libraries, little glue

TinyTank doesn't reinvent infrastructure. Requests and responses come from
`symfony/http-foundation`, routing from `symfony/routing`, CSRF protection from
`symfony/security-csrf`, Markdown from `league/commonmark`, structured data from
`spatie/schema-org`, translations from `symfony/translation`, and assets from Vite. TinyTank's own
code is the layer that ties them together: the kernel, the Datastar Twig extension, the blog
compiler, the Vite helper.

## Every page is the same for everyone

There are no sessions. CSRF protection checks the browser's origin headers instead of a token, so
pages carry no per-visitor data and can be cached publicly (every page gets an ETag, and a browser
that already has the page gets a `304` instead of it again). Absolute URLs come from configuration, never from the request's `Host` header,
so a forged header can't poison a cached page.

## Fail loudly

A misplaced post, a broken image link, a date that doesn't match its folder, a translation for a
language that isn't configured: TinyTank stops with a message naming the file, in the browser
during development and in `deploy`. Silent failures are the ones that reach production.

## The framework is a dependency

A site starts from the skeleton and installs the framework (`tinytank/framework`) with Composer.
It extends TinyTank from the outside, through `config/bootstrap.php`, `src/`, `templates/` and
`content/`, and never edits `vendor/`. Framework improvements reach every site with
`composer update tinytank/framework`.
See [Building a site on TinyTank](./extending/).

## Content is asked for, not handed out

Templates get context automatically (`site`, `seo`, `datastar`), but never content: they query
what they need, like Craft CMS's element queries (`posts().tag('php').limit(3).all()`). A template
then shows at a glance which content it depends on. See [Querying content](./basics/querying).

## Where TinyTank stops

TinyTank is for sites whose content is files, edited by people comfortable with Markdown and git.
Its content types stay few and concrete: the **blog** for dated articles, **data collections** for
repeating structured data (like Craft's channels), and **content pages** for one-offs (like
Craft's singles, nested like a structure). There are no configurable "section types".

If a site needs an admin UI for editors, a database, user accounts or permissions, relations between
entries, revisions, or field layouts per entry type, use a CMS such as Craft instead. Rebuilding
those here would only produce a worse CMS.
