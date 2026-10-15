# Dark & light theme

The skeleton ships with a light, dark and system theme:

- **System by default.** The site follows the visitor's device setting, and switches when the device
  does (many phones change at sunset).
- **A choice that sticks.** The sun / moon / screen toggle in the header overrides it, and the choice
  is remembered in the browser.
- **No flash.** The right colours are there from the first frame, also when the choice differs from
  the system.
- **Works without JavaScript.** The site still follows the system setting; only the toggle is hidden.

Everything happens in the browser, so every visitor gets the same HTML and pages stay cacheable.

## How it works

| Part | Where | What it does |
|---|---|---|
| `{{ theme_script() }}` | first in `<head>` (`templates/_layout.twig`) | a tiny inline script: reads the saved choice (or the system setting) and sets `<html data-theme="light">` or `"dark"` before anything is painted |
| `_theme` signal | `templates/_partials/theme-switcher.twig` | `'light'`, `'dark'` or `'system'`, bound to three radio buttons |
| `theme()` | `resources/js/app.js` | applies the signal to `data-theme`, saves it, and follows the system in `'system'` mode |
| colour tokens | `resources/css/app.css` | every colour with its light and dark value |

The script and `theme()` live in the framework; the tokens and the toggle are yours to restyle.

## Colour tokens

Templates use named colours instead of fixed ones, so the whole site switches together:

```html
<body class="bg-page text-ink">
<p class="text-muted">…</p>
<button class="bg-primary text-on-primary hover:bg-primary-hover">…</button>
```

Each token is defined once in `resources/css/app.css` with both values, using CSS `light-dark()`:

```css
@theme {
    --color-page: light-dark(var(--color-stone-50), var(--color-stone-950));
    --color-ink: light-dark(var(--color-stone-800), var(--color-stone-200));
    /* … */
}
```

| Token | Used for |
|---|---|
| `page`, `surface` | page background; header, inputs |
| `ink`, `strong`, `muted`, `subtle` | body text; emphasis and hovers; secondary text; meta text |
| `line`, `line-strong` | dividers; control borders |
| `chip` | tags, hover backgrounds |
| `primary`, `primary-hover`, `on-primary` | buttons and the text on them |
| `success`, `warning`, `warning-soft` | status text and badges |

To restyle the site, change the values; to add a colour, add a token. Form controls and scrollbars
follow the theme too (`color-scheme`).

## The `dark:` variant

For the few places a token doesn't fit, Tailwind's `dark:` variant follows the chosen theme (and the
system setting when there's no JavaScript):

```html
<div class="prose prose-stone dark:prose-invert">…</div>
```

## Your own controls

Any control bound to `_theme` works, for example a select:

```html
<select data-bind:_theme>
    <option value="system">System</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
</select>
```

In JavaScript, set it like any signal: `mergePatch({ _theme: 'dark' })`.

## Content Security Policy

The script in `<head>` is the same on every page, so a policy can allow it by its hash instead of
allowing all inline scripts. `TinyTank\Theme::hash()` returns it, ready for `script-src`.
