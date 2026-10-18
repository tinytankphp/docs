# Starting a site

`composer create-project` (or `php bin/create-site.php` after GitHub's template button) has
already named the site, created `.env` and prepared git and CI: see
[Installation](./installation#create-a-site). This checklist is what's left: the decisions only you
can make. Tick them off in your first hours with a new site.

## 1. Run it

```sh
ddev start
ddev npm install && ddev npm run dev
```

Open `https://my-site.ddev.site`, and keep the [style guide](#the-style-guide) at `/style-guide` open
in another tab while you work on the design.

## 2. Your site's identity

- [ ] **Name, description, author and share image**: `site` in `config/app.php`. Each can be one
      value or one per language ([Languages](../features/languages#the-site-s-name-description-and-share-image)).
- [ ] **Languages**: `language` and `languages` in `config/app.php`, and a `translations/<code>.php`
      for each. A single-language site lists one; remove `translations/it.php` if you don't need
      Italian.
- [ ] **Logo and favicon**: the skeleton's placeholders are `resources/icons/tinytank.svg` (shown in
      the header as `icon-[app--tinytank]`) and `public/favicon.svg`. Replace them with your own;
      renaming the icon file changes its class name, so update `templates/_layout.twig` too.
- [ ] **Colours and fonts**: the design tokens at the top of `resources/css/app.css`
      ([Fonts & icons](../features/fonts-icons), [Dark & light theme](../features/theme)).

## 3. The starter content

The skeleton comes with examples, so you can see how things fit together. Keep, adapt or delete
each of them:

| What | Where |
|---|---|
| The home page, with Datastar demos (live search, a server clock, a like button) | `templates/index.twig`, `src/Controller/HomeController.php` and `ClockController.php`, `templates/_partials/clock.twig` and `like.twig`, the `/clock` route in `config/routes.php` |
| Two blog posts and a draft | `content/blog/2026/09/`, `content/blog/drafts/` |
| An FAQ, as a data collection | `content/faq/`, `config/collections.php` |
| Pages: About (with a child page), Contact (with its form) and Privacy | `content/pages/`; Contact and Privacy are worth adapting rather than deleting |
| The style guide (below) | `content/pages/style-guide/` |

The skeleton's tests (`tests/`) check some of these examples: when you delete one, delete or adapt
its test too, and run `ddev composer test`.

### The style guide

`/style-guide` shows every element a post or page can contain (text, headings, lists, quotes, code
in several languages, tables, images, video) in your site's design, in light and dark mode. It's an
[unlisted](../content/pages#unlisted-pages) page: reachable by its address, but not in search
engines, the sitemap or the menus.

- [ ] While designing: keep it, and give the address to your designer.
- [ ] Before going live: keep it (it's harmless) or delete `content/pages/style-guide/` and the test
      that checks it (`testTheStyleGuideShowsEveryElementButStaysUnlisted` in `tests/PagesTest.php`,
      `tests/e2e/style-guide.spec.js`).

## 4. Contact and privacy

- [ ] **Where the contact form goes**: `CONTACT_TO` and the mailer (`MAILER_DSN`, `MAILER_FROM`) in
      `.env` ([Forms](../features/forms)). In DDEV, Mailpit catches every message.
- [ ] **The privacy page** (`content/pages/privacy/`) describes the skeleton's defaults. Make it
      describe your site: what the contact form does with messages, the log
      ([Logging](../features/logging)), and anything you add, such as videos, a CDN or analytics.

## 5. Licenses

- [ ] **Changed a font, the icons or added a script?** Update `public/third-party-licenses.txt` and
      the `/*! … */` notices ([Fonts & icons](../features/fonts-icons#licenses));
      `tests/LicensesTest.php` checks them.
- [ ] **Your site's own license**: `composer.json` says `proprietary`. Change it if your site's code
      is open source, and add a `LICENSE` file.

## 6. Commit

- [ ] The first commit, with `composer.lock`, then push to your site's repository.

## Before going live

The [production checklist](../deployment/#production-checklist): `.env` on the server, `APP_DEBUG`
off, the web server, Opcache, HTTPS, email, logs and, if you use one, the CDN.
