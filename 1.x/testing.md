# Testing

```sh
npm run build          # optional: without it, the tests that check assets are skipped
composer test          # PHPUnit; in DDEV: ddev composer test
composer analyse       # PHPStan, level 8
```

## Two suites

| Suite | Where | What it tests |
|---|---|---|
| **app** | your site's `tests/` | your site's controllers, routes and templates, with fixture content |
| **framework** | the framework repository's `tests/` | TinyTank itself, against a fixture project and fixture content (see [Contributing](./contributing)) |

Your site runs its own suite; the framework's suite runs in the framework repository's CI.

## No web server needed

Tests drive the app through `Kernel::handle()`, which takes a Symfony `Request` and returns a
`Response`:

```php
<?php

declare(strict_types=1);

namespace App\Tests;

final class AboutPageTest extends AppTestCase
{
    public function testAboutPageInItalian(): void
    {
        $response = $this->request($this->app(), '/it/about');

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('<h1 class="text-3xl font-bold">Chi siamo</h1>', self::body($response));
    }
}
```

`AppTestCase` (in your `tests/`) extends the framework's `TinyTank\Testing\KernelTestCase` and
boots your site with the fixture content in `tests/data/content`, one post per page and a
temporary cache directory. The helpers:

| Helper | |
|---|---|
| `$this->app($debug = false, $overrides = [])` | boots the site with the fixture content; overrides merge over `config/app.php` (`AppTestCase`) |
| `$this->site($debug = false, $overrides = [])` | the same with the site's real `content/`, for tests of the pages visitors see (`AppTestCase`) |
| `$this->bootKernel($root, $debug, $overrides)` | boots any TinyTank app with a temporary cache directory (`KernelTestCase`) |
| `$this->request($app, $uri, $method, $headers, $body)` | handles a request |
| `self::body($response)` | the body of any response, including Datastar streams and files |
| `$this->datastarUrl($html, $template, $method)` | the URL of a page's Datastar action rendering `$template` (`@get`, `@post`…; `$method` to pick one) |
| `$this->logged()` | what the apps booted in this test have logged (each test gets its own log directory) |
| `$this->tempDir()`, `$this->copyToTemp()`, `self::write()` | temporary files, deleted after the test |

## Tests and the Vite build

The templates print Vite's asset tags, which come from `public/build/` after `npm run build`. Before
the first build, `KernelTestCase` makes pages render without those tags instead of failing, so every
test runs on a fresh clone. A test that checks assets declares it, and is skipped until there's a
build:

```php
public function testThePageScriptLoads(): void
{
    $app = $this->app();
    $this->requireViteBuild($app); // skipped, with "run npm run build", when there's no build

    self::assertStringContainsString('/build/assets/home-', self::body($this->request($app, '/')));
}
```

CI runs `npm run build` before the tests, so these run there.

::: tip A test gets a 500?
`$this->app()` boots in production mode, like the live site: an exception becomes the generic error
page. Boot with `$this->app(debug: true)` to get the exception itself in the test output, or read
what was logged with `$this->logged()`.
:::

## Requests with headers

```php
// a Datastar POST from the same site
$this->request($app, '/clock', 'POST', ['Sec-Fetch-Site' => 'same-origin'], '{}');

// revalidation
$this->request($app, '/about', 'GET', ['If-None-Match' => $etag]);
```

A template action (`datastar.post('_partials/like')` in a page) has a signed URL: take it from the
page, then send it with its method and the signals as JSON. Another method gets a 405.

```php
$url = $this->datastarUrl(self::body($this->request($app, '/')), '_partials/like', 'post');
$events = self::body($this->request($app, $url, 'POST', ['Sec-Fetch-Site' => 'same-origin'], '{"count":1}'));
self::assertStringContainsString('You liked', $events);
```

## Environment

`phpunit.xml.dist` sets `APP_SECRET`, `APP_URL=https://example.test`, `APP_DEBUG=0` and
`BLOG_PER_PAGE`, as real environment variables, so your `.env` never leaks into the tests.

## Browser tests

PHPUnit checks what the server sends. [Playwright](https://playwright.dev) tests in `tests/e2e/`
check what visitors get: the real site in Chromium, served by PHP's built-in server in production
mode (`playwright.config.js`).

```sh
npm run build
npm run test:e2e                       # in DDEV: ddev exec CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

The skeleton's tests cover:

| Spec | Checks |
|---|---|
| `pages.spec.js` | every URL in the sitemap loads, in both languages; unknown URLs are a 404 |
| `datastar.spec.js` | the Datastar demos: search, signed actions, server-sent events, blog filters |
| `theme.spec.js` | the system theme, a remembered choice from the first paint (no flash), following the system |
| `persist.spec.js` | a persisted signal survives a reload |
| `video.spec.js` | nothing reaches YouTube before pressing play (requests to other hosts are recorded, never sent) |
| `languages.spec.js` | the switcher and redirects with translated slugs |
| `accessibility.spec.js` | the skip link moves the focus to the content, keyboard focus is visible, reduced motion stops movement but keeps colour fades, `motion-allowed` keeps moving |
| `no-javascript.spec.js` | colours, the hidden theme switcher and video links without JavaScript |

Every test also fails on a **Content Security Policy violation, a JavaScript error or a console
error** on any page it visits (`tests/e2e/fixtures.js`), so a new inline script or a blocked
resource is caught wherever it appears. Write your own specs with the same fixtures:

```js
import { expect, test } from './fixtures.js';

test('the mixer plays', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByText('Sound on')).toBeVisible();
});
```

Playwright needs a Chromium: CI installs its own (`npx playwright install --with-deps chromium`);
elsewhere, `CHROMIUM_PATH` points it at an installed one.

The framework's own browser helpers (`persist()`, `theme()`, `publicConfig()`) have unit tests with
Vitest in the framework repository (`tests/js/`).

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request: install, `npm run build`, PHPUnit,
PHPStan, then the Playwright browser tests. When a browser test fails, the HTML report with a trace
of the failure is attached to the run.
