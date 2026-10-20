# Project structure

```
my-site/
├── bin/console              Console entry point: deploy, cache:clear, your commands
├── config/
│   ├── app.php              Settings: secret, URL, languages, blog, site defaults
│   ├── bootstrap.php        The app's extension point: services, Twig additions, deploy steps
│   ├── collections.php      Data collections and their fields
│   ├── forms.php            Forms: fields, recipients, spam checks
│   └── routes.php           Routes → controllers
├── content/blog/            Blog posts, one folder each (see "The blog")
├── content/pages/           Content pages: About, Privacy… one folder each (see "Content pages")
├── content/<collection>/    Data collection items, e.g. content/faq/ (see "Data collections")
├── packages/                Empty (.gitkeep); used by TinyTank maintainers, see Contributing
├── public/                  Web root: index.php, build/ (Vite), media/ (published post files)
├── resources/               Frontend sources: js/app.js, js/pages/*.js, css/app.css, icons/*.svg
├── src/                     Your PHP code (namespace App\): Controller/, Command/, …
├── templates/               Twig templates; _partials/ are rendered by Datastar requests
├── tests/                   Your app's tests
├── translations/            UI texts per language: en.php, it.php, …
├── var/cache/               Compiled caches (safe to delete)
├── var/deploy/              deploy's next build, and the previous one (for deploy --rollback)
├── var/log/                 The log, one file per day (see Logging)
├── var/state/               Kept across deploys: the forms' rate limits
├── vendor/tinytank/framework/  ★ The framework, installed by Composer: never edit it
├── .env                     Local environment (never committed)
├── AGENTS.md                Instructions for AI coding agents (CLAUDE.md points to it)
├── composer.json            Your app's dependencies; requires tinytank/framework
└── vite.config.js           Your entry points and Vite plugins
```

## The framework is a package

The framework is the `tinytank/framework` package from
[tinytankphp/framework](https://github.com/tinytankphp/framework). Composer installs it
into `vendor/tinytank/framework`, together with its own dependencies (Symfony components, Twig,
CommonMark…); your `composer.json` only requires `tinytank/framework`. Framework code never
depends on `App\` classes.

::: warning Never edit vendor/
Everything a site needs to change has an extension point in your own files. Framework updates
arrive with `composer update tinytank/framework` (see [Updating TinyTank](../extending/updating)),
which would overwrite any edit in `vendor/`.
:::

## What's yours, what's TinyTank's

| Yours (edit freely) | TinyTank's (don't edit in a site) |
|---|---|
| `config/`, `src/`, `templates/`, `content/`, `translations/`, `resources/`, `tests/` | `vendor/tinytank/framework/` |
| `public/index.php`, `bin/console` (three-line entry points) | its Vite plugin, `resources/vite/tinytank.js` |
| `vite.config.js` (entry points, extra plugins) | its test base class, `TinyTank\Testing\KernelTestCase` |

## Namespaces

| Namespace | Directory |
|---|---|
| `TinyTank\` | `vendor/tinytank/framework/src/` |
| `App\` | `src/` |
| `App\Tests\` | `tests/` |
