# Images

Images in posts and pages are prepared for the web automatically: smaller modern versions for every
screen, and **no hidden metadata**. You add a photo to a post's folder, and TinyTank does the rest.

## What a visitor gets

```md
![Our team](team.jpg)
```

becomes:

```html
<picture>
  <source type="image/avif" srcset="/media/blog/x/team.jpg.480w.avif 480w, …960w.avif 960w, …1440w.avif 1440w" sizes="…">
  <source type="image/webp" srcset="/media/blog/x/team.jpg.480w.webp 480w, …">
  <img src="/media/blog/x/team.jpg" alt="Our team" width="1600" height="1067" loading="lazy" decoding="async">
</picture>
```

- **The right size for the screen:** each image comes in widths of 480, 960 and 1440 pixels (only
  those smaller than the original, plus the original's own width). The browser picks what fits.
- **Modern formats:** AVIF where the server can write it, then WebP, with the original for very old
  browsers. A photo is typically 50 to 80% lighter.
- **No jumping layout:** `width` and `height` are always set, so the page keeps its shape while
  images load.
- **Lazy loading:** images further down load as you scroll.

It works for JPEG, PNG, WebP and AVIF. SVG (scalable already) and GIF (often animated) are served as
they are.

## Privacy: no metadata

Photos from phones and cameras carry **metadata** (EXIF): very often the **GPS position** where they
were taken, plus the device and the time. Published as they are, anyone could download the image and
read where you were.

TinyTank re-saves every published image without metadata, the original included (JPEGs at quality
90, visually identical), and turns photos the right way up while doing so. The versions it makes have
no metadata either. This happens in development too, so what you see is what's published.

## In templates

Template images, such as a post's cover, use `image()`:

```twig
{{ image(post.image, '', {loading: 'eager', fetchpriority: 'high', class: 'mb-8 w-full rounded-lg'}) }}
```

| Option | |
|---|---|
| `preset` | a preset from `config/app.php` (see [Presets](#presets)): its widths, sizes and shape |
| `loading` | `'lazy'` (default) or `'eager'`, for an image visible as soon as the page opens |
| `sizes` | how wide the image is shown, if not the configured default |
| anything else | an attribute of the `<img>`: `class`, `fetchpriority`, `title`… |

An image that isn't a post's or page's file (an `https://` URL, a file in `public/`) gets a plain
`<img>` with the same attributes.

## Presets

Different places need different images: a full-width hero wants large versions, a thumbnail small
ones, a card grid the same shape for every card. Presets, like Craft's image transforms, name those
settings in `config/app.php`:

```php
'images' => [
    'widths' => [480, 960, 1440],
    'sizes' => '(min-width: 48rem) 48rem, 100vw',
    'presets' => [
        'hero' => ['widths' => [1280, 1920, 2560], 'sizes' => '100vw'],
        'card' => ['widths' => [400, 800], 'ratio' => '16:9'],
        'avatar' => ['widths' => [96, 192], 'ratio' => '1:1', 'position' => 'top', 'sizes' => '6rem'],
        'logo' => ['widths' => [200, 400], 'ratio' => '2:1', 'mode' => 'letterbox', 'background' => '#ffffff'],
    ],
],
```

```twig
{{ image(page.image, '', {preset: 'hero', loading: 'eager', fetchpriority: 'high'}) }}
{{ image(member.photo, member.name, {preset: 'avatar'}) }}
```

| Option | Default | |
|---|---|---|
| `widths` | `images.widths` | the versions to make |
| `sizes` | `images.sizes` | how wide the image is shown; `image()`'s `sizes` overrides it |
| `ratio` | none: the image keeps its shape | width:height, e.g. `'16:9'` or `'1:1'` |
| `mode` | `crop` | how to reach the ratio (below) |
| `position` | `center` | for `crop`: what stays: `top`, `bottom-right`, `left`… |
| `background` | `transparent` | for `letterbox`: the padding colour, e.g. `'#ffffff'` |

Every option is optional, so a preset only says what differs from the defaults:
`'square' => ['ratio' => '1:1']` crops every image to a square from the centre, at the default widths.
`mode`, `position` and `background` need a `ratio`.

| `mode` | What it does |
|---|---|
| `crop` | fills the ratio exactly, cutting what's outside; `position` picks what stays |
| `fit` | the whole image within the ratio's box, keeping its own shape |
| `letterbox` | the whole image within the box, padded to the exact ratio with `background` |
| `stretch` | distorted to the box |

**Ratio instead of height:** a Craft transform makes one image (`width: 1200, height: 630`); a preset
makes several widths, so the shape is a ratio (`'1200:630'`), and each width gets the matching height.

Images are never enlarged: widths larger than the image allows are left out, and the largest
possible version is always made. A preset with a shape uses its largest WebP version as the `<img>`
fallback, since the original isn't that shape.

Only the widths and shapes of the configured presets exist. A URL asking for any other version is a
404, so nobody can make the server encode endless versions. `deploy` makes every preset's versions of
every image (templates choose presets as pages render), and an unknown preset name in a template is an
error.

## Configuration

```php
// config/app.php
'images' => [
    'widths' => [480, 960, 1440],
    'sizes' => '(min-width: 48rem) 48rem, 100vw',   // the content column's width
    // 'formats' => ['avif', 'webp'],              // default: both, where the server supports them
    // 'quality' => ['avif' => 50, 'webp' => 75, 'jpeg' => 90],
],
```

`sizes` tells the browser how wide images are shown, so it can choose a version before the CSS is
loaded. The skeleton's content column is at most `48rem` wide; change it if your layout differs.

## When images are made

- **On deploy**, when publishing post and page files: every image's versions and its original
  without metadata. Encoding is kept in `var/images/`, named after the image's content, so a later
  deploy only encodes new or changed images. **Keep `var/images/` between deploys** on the server.
- **In development**, each version is made the first time it's requested.

## Server requirements

PHP's **GD** or **Imagick** extension with WebP support, which nearly every host has. AVIF is used
when the extension supports it too (GD with libavif, or Imagick); otherwise images get WebP only.
[Intervention Image](https://image.intervention.io) does the work, with Imagick when it's installed.

Without either, the site still runs and shows images as they are, in a plain `<img>`; but `deploy`
can't publish the content's images, since it can't remove their metadata. `bin/console check` says
so before you deploy.
