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

Pages need the dev server running (or a `npm run build`); without one they're an error saying
"Vite manifest not found". Open `https://my-site.ddev.site`, and keep the [style guide](#the-style-guide) at `/style-guide` open
in another tab while you work on the design.

## 2. Your site's identity

- [ ] **Name, description, author and share image**: `site` in `config/app.php`. Each can be one
      value or one per language ([Languages](../features/languages#the-site-s-name-description-and-share-image)).
- [ ] **Languages**: `language` and `languages` in `config/app.php`, and a `translations/<code>.php`
      for each ([below](#languages)).
- [ ] **Logo and favicon**: the skeleton's placeholders are `resources/icons/tinytank.svg` (shown in
      the header as `icon-[app--tinytank]`) and `public/favicon.svg`. Replace them with your own;
      renaming the icon file changes its class name, so update `templates/_layout.twig` too.
- [ ] **Colours and fonts**: the `@theme` block in `resources/css/app.css`, where each colour is a
      light and dark pair, and the font import above it ([Fonts & icons](../features/fonts-icons),
      [Dark & light theme](../features/theme)).
- [ ] **Check the colours** in both themes once they're yours: `npm run build && npm run test:a11y`
      ([Checking](../accessibility/checking)). A new palette often fails contrast in one theme; see
      [Colour and contrast](../accessibility/contrast). Optionally, check before every push:
      `git config core.hooksPath .githooks`.

## 3. The starter content

The skeleton comes with **examples**, so you can see how things fit together: Datastar demos on the
home page (a live search, a like button, a sound you can play, a server clock), an FAQ as a data
collection, two blog posts and a draft, and an Italian translation of everything. `create-project`
asks whether to keep them; when you're done learning from them, one command removes them all,
with their tests:

```sh
php bin/console site:clean            # lists what goes, then asks
php bin/console site:clean --dry-run  # only lists
```

It deletes the files listed in `.examples` and the blocks marked `example:start` … `example:end` in
the site's config, templates and tests, then `.examples` itself. What's left is a working site whose
tests pass: an English home page with your site's name and latest posts, the blog, About, Contact,
Privacy and the style guide. Until you run it, the home page says how, and `deploy` reminds you.

- [ ] **Remove the examples** (`site:clean`), or keep the ones you want: delete the marked block
      around something to keep it, then clean.

The pages that stay are starting points to adapt:

| What | Where | Tests that check it |
|---|---|---|
| The home page | `templates/index.twig`, `src/Controller/HomeController.php` | `tests/PagesTest.php` |
| Pages: About (with a child page), Contact (with its form) and Privacy | `content/pages/`; Contact and Privacy are worth adapting rather than deleting | `tests/PagesTest.php`, `tests/ContactTest.php`, `tests/CdnTest.php`, `tests/e2e/contact.spec.js` |
| The style guide (below) | `content/pages/style-guide/` | `tests/PagesTest.php`, `tests/e2e/style-guide.spec.js`, and the browser tests that use its image and video (`accessibility`, `images`, `no-javascript`, `video`) |

When you change or delete one, update the tests listed next to it, then run `ddev composer test`
and the [browser tests](../testing#browser-tests).

### Languages

`site:clean` leaves an English-only site; the language switcher disappears by itself with one
language. For another language, or several: list them in `languages` in `config/app.php` (and set
`language` to the main one), add `translations/<code>.php`, and give pages and posts their
`index.<code>.md` versions ([Languages](../features/languages)). An Italian-only site: change
`language` and `languages` to `it`, and copy `translations/it.php` from the skeleton.

### The style guide

`/style-guide` shows every element a post or page can contain (text, headings, lists, quotes, code
in several languages, tables, images, video) in your site's design, in light and dark mode. It's an
[unlisted](../content/pages#unlisted-pages) page: reachable by its address, but not in search
engines, the sitemap or the menus.

- [ ] While designing: keep it, and give the address to your designer.
- [ ] Before going live: keep it (it's harmless) or delete `content/pages/style-guide/` and the test
      that checks it (`testTheStyleGuideShowsEveryElementButStaysUnlisted` in `tests/PagesTest.php`,
      `tests/e2e/style-guide.spec.js`); the image and video browser tests open it too, point them at
      a page of yours.

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
