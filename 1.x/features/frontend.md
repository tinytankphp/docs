# Frontend & Vite

Assets are built by [Vite](https://vite.dev) with [Tailwind CSS](https://tailwindcss.com).
Sources live in `resources/`:

```
resources/
  css/app.css              Tailwind, plus the typography plugin for blog posts
  js/app.js                loaded on every page: the CSS and the Datastar client
  js/pages/*.js            one bundle per page or feature (see JavaScript & Datastar)
  icons/*.svg              your own icons, used as icon-[app--<name>] (see Fonts & icons)
```

The Datastar client itself ships with the framework, matched to its PHP SDK, and is imported as
`'datastar'`. It's MIT-licensed: its license notice is kept in your built JavaScript, and the full
text is in the skeleton's `public/third-party-licenses.txt`.

## Development

```sh
ddev npm run dev
```

The dev server runs on port 5173 (exposed by DDEV at `https://<project>.ddev.site:5173`). While it
runs, pages load assets from it, and:

| You change | What happens |
|---|---|
| CSS | styles update in place, no reload |
| JavaScript | the page reloads (unless the module handles hot updates itself) |
| a Twig template, a Markdown post, a translation file | the page reloads |

This only happens with `APP_DEBUG=1`. Vite writes its URL to `var/vite.hot` while it runs, and PHP
reads it in debug mode only. If Vite was killed and pages still point at port 5173, delete
`var/vite.hot`.

## Production build

```sh
npm run build
```

This writes hashed files and source maps to `public/build/`, plus a manifest that
`{{ vite('resources/js/app.js') }}` reads to print the right `<link>` and `<script>` tags. URLs inside
the bundles (fonts and images referenced from CSS) start with `/build/`, as they're served from
there.
`bin/console deploy --assets` runs the build for you.

## `vite.config.js`

Your config only lists plugins. TinyTank's part (entry points, the `datastar` and `tinytank` import
aliases, build output, manifest, the DDEV dev server, page reloads, the `VITE_PUBLIC_` env prefix) is
a framework plugin:

```js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import tinytank from './vendor/tinytank/framework/resources/vite/tinytank.js';

export default defineConfig({
    plugins: [
        tailwindcss(),
        tinytank(),
    ],
});
```

Options: `input` (entry points; default `resources/js/app.js` plus every `resources/js/pages/*.js`)
and `reload` (extra file patterns that reload the page). Anything you set in `vite.config.js`
overrides the plugin's defaults.

## Several entry points

To keep heavy JavaScript off pages that don't need it, give a page its own bundle: create
`resources/js/pages/mixer.js` (picked up automatically) and list it in the page's template:

```twig
{% set page_scripts = ['resources/js/pages/mixer.js'] %}
```

The layout prints it after `app.js` with `{{ vite('resources/js/app.js', page_scripts ?? []) }}`;
`vite()` accepts entries and lists of entries, and prints shared chunks once. See
[JavaScript & Datastar](javascript) for how such a module works with Datastar.

## Accessibility basics

The skeleton's layout and CSS come with three things every site keeps, whatever its design:

- **A skip link**, the first thing keyboard users reach: "Skip to content" slides in on focus and
  moves the focus past the navigation to `<main id="main">`.
- **Visible keyboard focus**: `:focus-visible` gets an outline in the theme's `primary` colour, on
  every element. Mouse clicks don't trigger it on links and buttons, so they stay clean.
- **Reduced motion**: visitors whose system asks for less motion get no transitions, animations or
  smooth scrolling (`@media (prefers-reduced-motion: reduce)` in `resources/css/app.css`).

They're plain CSS and markup in your site, so adapt them freely; `tests/e2e/accessibility.spec.js`
checks they keep working. Interactive components such as dialogs or toasts aren't part of TinyTank:
native HTML (`<dialog>`, `<input type="range">`) with Datastar covers them, styled your way.

## Environment variables in JavaScript

Only variables prefixed `VITE_PUBLIC_` are ever inlined into the bundle
(`import.meta.env.VITE_PUBLIC_…`). Everything else, including `APP_SECRET`, stays on the server.
For values from `config/app.php`, use the `public` allowlist and `publicConfig()` (see
[JavaScript & Datastar](javascript#publicconfig)).
