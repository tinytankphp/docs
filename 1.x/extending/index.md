# Building a site on TinyTank

A new site starts from the skeleton and installs the framework as a Composer package. The site adds
its own routes, controllers, templates, content and commands, and **never edits the framework**.

## The rule: never edit `vendor/`

Everything site-specific lives in your own files:

| What | Where |
|---|---|
| Routes | `config/routes.php` |
| Settings | `config/app.php`, `.env` |
| Services, Twig extensions, deploy steps | `config/bootstrap.php` |
| Controllers, commands, other classes | `src/` (namespace `App\`) |
| Templates | `templates/` |
| Posts | `content/` |
| UI texts | `translations/` |
| CSS, JS, Vite entry points | `resources/`, `vite.config.js` |
| Tests | `tests/` |

Framework improvements then arrive with a single command, without touching your files:

```sh
composer update tinytank/framework
```

If you find yourself needing to change the framework, that's a missing extension point: open an
issue or contribute it to TinyTank instead (see [Contributing](../contributing)).
See [Updating TinyTank](./updating) for versions and what to check after an update.

## The extension points

| Extension point | Use it for | Guide |
|---|---|---|
| `config/bootstrap.php` | services, Twig extensions and globals, deploy steps | [Services & bootstrap](./bootstrap) |
| `$app->container` | shared objects (a mailer, an API client) | [Services & bootstrap](./bootstrap#services) |
| `src/Command/` | console commands, registered automatically | [Console commands](./commands) |
| `$app->addDeployStep()` | build steps in `bin/console deploy` | [Deploy steps](./deploy-steps) |
| `TinyTank\Controller` | controllers with helpers | [Controllers](../basics/controllers) |
| `vite.config.js` | entry points, extra Vite plugins | [Frontend & Vite](../features/frontend) |

## A typical small app

TinyTank is not opinionated about your application code. A small app usually is:

- the **blog**, for articles around the app's subject
- one or more **custom routes and controllers**: the app itself, for instance an interactive home
  page driven by Datastar, plus JSON endpoints its JavaScript loads (`$this->json(…)`)
- **services** for anything shared (`config/bootstrap.php`)
- **commands** for build or maintenance tasks, hooked into `deploy` when they produce files the
  site serves

## Housekeeping when you start a site

- Commit your `composer.lock` (remove it from `.gitignore` first)
- Replace the Datastar demo page and the sample blog posts
- Set the real site name, description, default share image and author in `config/app.php`
- Choose the languages (`language`, `languages`) and fill `translations/*.php`
- Prepare each server's `.env` (`APP_URL`, `APP_SECRET`, `APP_OPCACHE`…), see
  [Servers & Opcache](../deployment/servers)
