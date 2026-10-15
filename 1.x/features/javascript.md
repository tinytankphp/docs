# JavaScript & Datastar

Most interactivity in a TinyTank site needs no JavaScript of your own: [Datastar](../basics/datastar)
attributes keep state in signals and talk to the server. Some features need real code, though:
audio, canvas, maps, drag and drop. For those, TinyTank uses one pattern:

- **Datastar drives the UI.** Buttons, sliders and what's visible are `data-*` attributes bound to
  signals, declared in the template.
- **A plain JavaScript module does the heavy work.** It reads signals and reacts to their changes,
  and writes its results back as signals. It never touches the buttons and sliders itself.
- **Each page gets its own bundle**, so that code only loads where it's used.

The skeleton's home page has a working example: a Web Audio tone with a play button and a volume
slider that's remembered across reloads (`templates/index.twig` and `resources/js/pages/home.js`).

## A page bundle

Create a file in `resources/js/pages/`. Every file there is an entry point; you don't need to change
any config:

```js
// resources/js/pages/mixer.js
import { effect, getPath, mergePatch } from 'datastar';
import { persist, ready } from 'tinytank';

await ready; // Datastar has applied the page's data-signals

persist(['_mixer.volume']); // remembered in localStorage

effect(() => {
    // Runs now and again whenever a signal read here changes.
    engine.setVolume(getPath('_mixer.volume'));
});

engine.onLoaded = () => mergePatch({ _mixer: { loading: false } }); // back to the UI
```

Then load it from the page's template:

```twig
{% extends '_layout.twig' %}
{% set page_scripts = ['resources/js/pages/mixer.js'] %}

{% block content %}
    <div data-signals="{_mixer: {volume: 0.5, loading: true}}">
        <input type="range" min="0" max="1" step="0.01" data-bind:_mixer.volume>
        <p data-show="$_mixer.loading">Loading…</p>
    </div>
{% endblock %}
```

The layout adds `page_scripts` after `app.js` (`{{ vite('resources/js/app.js', page_scripts ?? []) }}`).
A controller can pass `page_scripts` to `render()` instead.

`resources/js/app.js` holds what every page needs (the CSS and the Datastar client). Keep it small.

::: tip Signals that start with `_`
Datastar sends every signal with each backend request, except those starting with `_`. Use a `_`
prefix for state that only matters in the browser, such as a volume or an open panel.
:::

## Imports

The TinyTank Vite plugin sets up two aliases:

| Import | What it is |
|---|---|
| `'datastar'` | The Datastar client, shipped with the framework so it matches the PHP SDK. Every bundle shares one instance, and with it the same signals |
| `'tinytank'` | TinyTank's browser helpers, below |

The useful part of the Datastar API for modules:

| Function | |
|---|---|
| `getPath('a.b')` | a signal's current value |
| `mergePatch({a: {b: 1}})` | set signals (creates them if missing) |
| `effect(fn)` | runs `fn` now and whenever a signal it read changes; returns a function that stops it |
| `filtered({include: /regex/})` | the signals whose dotted path matches, as an object |

## `ready`

```js
import { ready } from 'tinytank';
await ready;
```

Modules run **before** Datastar has read the page's `data-signals`. Without `await ready`, a signal
the HTML declares reads as `undefined`, and a value you write is overwritten by the HTML's default a
moment later. `ready` resolves on Datastar's `datastar-ready` event.

## `persist(signals, options)`

```js
persist(['_mixer.volume', 'theme']);               // these signals and everything under them
persist(/^_mixer\./, { key: 'mixer' });            // or a pattern on the dotted path
```

Restores the signals from `localStorage` over the page's defaults, then saves every change. Only the
listed signals are read back, whatever the storage holds. Options: `key` (default `'tinytank'`; give
each module its own) and `storage` (default `localStorage`; `sessionStorage` works too). If storage is
unavailable (private mode, quota), the page simply starts from its defaults.

Datastar's own persistence is part of Datastar Pro; this helper covers the common case without it.

## `theme()`

Applies the light / dark / system choice held in the `_theme` signal and saves it. The skeleton
calls it in `app.js`; see [Dark & light theme](theme).

## `publicConfig()`

Sometimes the browser needs a value from the server, such as the CDN address for media files. List
it under `public` in `config/app.php`:

```php
'public' => [
    'media_url' => getenv('MEDIA_URL') ?: '/media',
],
```

The layout prints it with `{{ public_config() }}` as a JSON data block, and modules read it:

```js
import { publicConfig } from 'tinytank';
const { media_url } = publicConfig();
```

It's an allowlist: nothing else from the config reaches the page. Everything under `public` is
readable by anyone, so never put secrets or private URLs there. TinyTank refuses to boot if a value
contains `APP_SECRET`. The values are the same for every visitor, so pages stay cacheable, and a JSON
data block isn't executed, so it needs no Content Security Policy entry.

For values known at build time there's also `import.meta.env.VITE_PUBLIC_…` (see
[Frontend & Vite](frontend#environment-variables-in-javascript)).
