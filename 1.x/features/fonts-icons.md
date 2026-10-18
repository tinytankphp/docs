# Fonts & icons

Fonts and icons are part of your build, served from your own site like the CSS. No requests go to
Google Fonts or icon CDNs, so:

- **Privacy:** visitors' IP addresses aren't sent to a third party (an issue under GDPR).
- **Speed and reliability:** no extra connections, and pages work offline or behind strict networks.
- **Security:** a strict Content Security Policy doesn't need to allow outside hosts.

## Fonts

The skeleton uses [Inter](https://rsms.me/inter/), installed from [Fontsource](https://fontsource.org)
and imported in `resources/css/app.css`:

```css
@import "@fontsource-variable/inter/wght.css";

@theme {
    --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
}
```

Vite copies the font files into `public/build/assets/` with hashed names, so they can be cached
forever. A variable font holds every weight in one file per script (Latin, Cyrillic, Greek…), and
browsers download only the scripts a page actually uses.

### Preloading

The browser only discovers a font once the CSS has been parsed. The layout tells it earlier, so text
appears in the right font sooner:

```twig
{{ vite_preload('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2') }}
```

Preload only what nearly every page uses (usually one file: the main script, regular style). The path
is the file's source path, as Vite's manifest lists it. Nothing is printed while the dev server runs.

Font files always stay files: Vite inlines small assets as `data:` URLs, but never fonts, since the
Content Security Policy only allows fonts from the site itself (some subsets weigh under 4 KB).

### Using another font

```sh
npm i -D @fontsource-variable/<font>       # or @fontsource/<font> for fonts without a variable version
```

Change the `@import`, the font name in `--font-sans` (or add a token like `--font-display` for
headings, used as `font-display`), and the `vite_preload()` path. Search fonts at
[fontsource.org](https://fontsource.org).

For a font that isn't on Fontsource, put the `.woff2` files in `resources/fonts/` and declare it:

```css
@font-face {
    font-family: "Brand";
    src: url("../fonts/brand.woff2") format("woff2");
    font-weight: 100 900;
    font-display: swap;
}
```

Vite bundles it the same way: `{{ vite_preload('resources/fonts/brand.woff2') }}`.

To use no web font at all, remove the `@import` and the preload: `--font-sans` falls back to the
system font.

## Icons

Icons come from [Iconify](https://iconify.design) through its Tailwind plugin. An icon is a class:

```html
<span class="icon-[lucide--sun] size-5" aria-hidden="true"></span>
```

- **Only the icons you use are built.** Tailwind finds the class names in your templates and adds
  just those icons to the CSS, as small SVGs. An icon font, by comparison, ships every icon:
  Material Symbols is about 3 MB.
- **They take the text colour** (`currentColor`): `text-muted`, `hover:text-strong`, `dark:` all work.
- **Size them** with `size-*` (or `w-*`/`h-*`); the default is 1em.

### Icon sets

[Lucide](https://lucide.dev) is installed. Browse 200+ sets at
[icon-sets.iconify.design](https://icon-sets.iconify.design) and install the ones you need:

```sh
npm i -D @iconify-json/material-symbols
```

```html
<span class="icon-[material-symbols--play-arrow-rounded]"></span>
```

The class name is `icon-[<set>--<icon>]`.

::: warning Write the full class name
Tailwind only sees class names that appear complete in your files. `icon-[lucide--{{ name }}]` isn't
found; keep the whole name in the template (for example in a map, as
`templates/_partials/theme-switcher.twig` does).
:::

### Your own icons

Put SVG files in `resources/icons/` and use them as `icon-[app--<file name>]`; the skeleton's logo is
`resources/icons/tinytank.svg`, used as `icon-[app--tinytank]`. Draw them on a square canvas, with
`currentColor` (or a single colour) for strokes and fills. While the dev server runs, Vite restarts
by itself when you add or change one.

### Licenses

Fonts and icons are other people's work, distributed with your site under their licenses. The
skeleton credits them in two places, as their licenses ask: a short `/*! … */` notice in
`resources/css/app.css` (kept in the built CSS), and the full texts in
`public/third-party-licenses.txt`, served at `/third-party-licenses.txt`. When you switch font or
add an icon set, add its notice and license there; `tests/LicensesTest.php` checks the ones the
skeleton ships. Fontsource packages include their font's license in `node_modules/@fontsource…/LICENSE`,
and Iconify's `info.json` names each icon set's license.

### Accessibility

An icon next to text is decoration: add `aria-hidden="true"`. An icon-only button needs a text
label, for example a visually hidden one:

```html
<button>
    <span class="icon-[lucide--x] size-4" aria-hidden="true"></span>
    <span class="sr-only">Close</span>
</button>
```
