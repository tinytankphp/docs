# Writing posts

## Create a post

A post is a folder in `content/blog/YYYY/MM/` named after its slug, with an `index.md` inside:

```
content/blog/2026/10/calm-websites/index.md   → /blog/calm-websites
```

```markdown
---
title: Building calm websites
date: 2026-10-04
summary: Why fewer moving parts make faster, friendlier sites.
tags: [design, performance]
image: cover.jpg
---

Calm websites load fast and stay out of the way.

## Fewer moving parts

![Diagram](diagram.webp)

…
```

The slug (the folder name) must be lowercase letters, digits and dashes, and unique across the
whole blog. The month folder must match the post's `date`.

## Front matter

| Field | Required | Description |
|---|---|---|
| `title` | yes | The post title |
| `date` | yes | Publication date, `YYYY-MM-DD` and a real day (`2026-02-30` is an error, not March 2); must match the `YYYY/MM` folder |
| `updated` | no | Last significant change; used by the feed, the sitemap and `dateModified` |
| `summary` | no | Teaser and meta description; defaults to the first paragraph that contains text |
| `tags` | no | A list of tags (lowercased) |
| `image` | no | Share image: a file in the post folder, a `/path` in `public/`, or an `https://` URL |

## Markdown

Posts use [GitHub-flavoured Markdown](https://github.github.com/gfm/): tables, task lists,
strikethrough and autolinks. Headings get anchor links. External links open in a new tab with
`rel="noopener noreferrer"`.

For safety, **raw HTML is escaped** and `javascript:` links are removed, so a content file can
never inject scripts into the page.

### Code blocks

Name the language after the opening fence, and the code is **highlighted when content compiles**:
no JavaScript, nothing loaded from another site.

````md
```php
echo 'Hello';
```
````

```html
<pre data-lang="php"><code class="language-php"><span class="hl-keyword">echo</span> <span class="hl-value">'Hello'</span>;</code></pre>
```

Languages ([tempest/highlight](https://github.com/tempestphp/highlight)): `php`, `twig`, `html`,
`css`, `scss`, `js`, `ts`, `json`, `yaml`, `bash` (or `sh`), `terminal`, `sql`, `nginx`, `apache`,
`dotenv`, `dockerfile`, `diff`, `markdown`, `xml`, `ini`, `http`, `graphql`, `python`, `vue`,
`svelte`, `blade`, `terraform`. A block without a language, or in another one, is shown as plain
text in the same markup.

The colours are the site's: the skeleton styles the `hl-*` classes at the end of
`resources/css/app.css` (`hl-keyword`, `hl-property`, `hl-value`, `hl-type`, `hl-number`,
`hl-variable`, `hl-attribute`, `hl-comment`, `hl-addition`, `hl-deletion`…), and shows the language
from `data-lang` in the corner. The theme files in `vendor/tempest/highlight/src/Themes/Css/` (GitHub,
Dracula, Monokai…) use the same classes, for ideas. Inline `` `code` `` isn't highlighted.

## Images and files

Put images and files next to `index.md` (subfolders are fine) and link them relatively:

```markdown
![A diagram](diagram.webp)
[Download the slides](files/talk.pdf)
```

A line like `::related-posts{limit=2}` places a [content component](./components).

Images get responsive AVIF/WebP versions and lose their metadata (such as a photo's GPS position)
when published: see [Images](../features/images).

Relative links are rewritten to `/media/blog/<slug>/…`. Allowed types: `jpg`, `jpeg`, `png`,
`gif`, `webp`, `avif`, `svg`, `pdf`, `mp4`, `webm`. Other files in the folder (notes, source files)
are never published.

In development, files are served from the post folder. `bin/console deploy` copies the published
posts' files to `public/media/blog/`, so in production the web server serves them directly, without
PHP. `bin/console cache:clear` removes those copies, so development always sees the originals.

::: warning SVG files
In development, SVGs are served with a policy that blocks scripts; in production the web server
serves them as plain files. That's fine for your own content, but treat SVGs from others as code.
:::

## Drafts

Drafts live in `content/blog/drafts/<slug>/index.md`. They need no `date`, appear (marked "draft")
only with `APP_DEBUG=1`, get `noindex`, and are never deployed: not listed, not in feeds or the
sitemap, their files never copied.

To publish a draft, set its `date` and move the folder into its month:

```sh
git mv content/blog/drafts/calm-websites content/blog/2026/10/
```

## Mistakes fail loudly

Every mistake below stops with a message naming the file, on the page in debug mode and in
`bin/console deploy`:

- a Markdown file outside `YYYY/MM/<slug>/` or `drafts/<slug>/`
- a slug that isn't lowercase letters, digits and dashes, or a duplicate slug
- a missing `title`, or a missing or malformed `date`
- a `date` that doesn't match the month folder
- a linked file or `image` that doesn't exist, isn't an allowed type, or points outside the
  post folder with `..`
- an asset file name with characters other than letters, digits, dots, dashes and underscores
- `slug:` in the default language (rename the folder instead; translations may have their own), or
  the old `draft:` field (move the folder instead)

Drafts are never parsed in production builds, so a half-written draft can't break a deploy.
