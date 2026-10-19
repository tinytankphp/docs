# Data collections

Collections hold structured content beyond blog posts: an FAQ, a team, products, a catalogue of
sounds. Like posts, they're plain files in `content/`, checked when they're compiled, translatable,
and compiled into a cache on deploy, so no database is involved.

The skeleton's home page shows one: the FAQ in `content/faq/`.

## Define a collection

Collections are defined in `config/collections.php`, with the fields each item has:

```php
return [
    'faq' => [
        'fields' => [
            'question' => 'string',
            'order' => 'int',
        ],
        'sort' => 'order',
    ],
    'team' => [
        'fields' => [
            'name' => 'string',
            'role' => 'string',
            'photo' => '?url',
            'joined' => 'date',
        ],
        'sort' => '-joined',
        'fallback' => true,
    ],
];
```

Names use lowercase letters, digits and underscores (`collection('team_members')`). `blog` and
`pages` are reserved.

### Field types

| Type | Value | Example |
|---|---|---|
| `string` | non-empty text, trimmed | `name: Ada` |
| `int`, `float` | a number | `order: 2`, `price: 9.5` |
| `bool` | `true` or `false` | `featured: true` |
| `date` | `YYYY-MM-DD` | `joined: 2024-03-01` |
| `url` | a `/path` (a file in `public/`), an `https://` URL, or in an [item folder](#items-with-their-own-files) a file next to it | `photo: /images/ada.webp`, `photo: ada.jpg` |
| `markdown` | Markdown text, rendered to HTML | `bio: Writes *tests*.` |
| `list` | a list of plain values | `tags: [setup, php]` |
| `array` | any YAML structure, unchecked | `links: {site: https://ada.dev}` |

A leading `?` makes a field optional: `'?url'`. A missing optional field is `null`.

### Options

| Option | Default | |
|---|---|---|
| `sort` | by slug | a field to sort by; `'-field'` for descending. Items without a value come last |
| `fallback` | `false` | `true`: an item without a translation appears in the default language instead of being hidden |
| `json` | none | `true` or a list of fields: serves them at `/data/<name>.json` for JavaScript (below) |

## Add items

Each item is a file in `content/<collection>/`, named after its slug:

```
content/faq/
  what-is-tinytank.md       front matter = the fields, then an optional Markdown body
  what-is-tinytank.it.md    Italian version
content/team/
  ada.yaml                  fields only
```

A Markdown item:

```md
---
question: What is TinyTank?
order: 1
---
A small PHP framework for sites that are mostly content…
```

The body becomes the item's `html`. Links and images in it use `/paths` or full URLs, unless the
item is a folder (below).

Every item also has `slug` (from the file name), `language` and `source` (its file, for error
messages). These names can't be used as fields.

### Items with their own files

An item that has images or files of its own is a folder, named after its slug, with `index.md` (or
`index.yaml`) and the files next to it, like a post:

```
content/projects/
    pulse-os/
        index.md          the item: fields in the front matter, the body below
        index.it.md       its Italian version
        cover.jpg         /media/collections/projects/pulse-os/cover.jpg
        diagram.png
    nightshift.md         an item without files stays a single file
```

In a folder, a `url` field can name one of its files (`image: cover.jpg`), and relative links and
images in the body point at them (`![The patch graph](diagram.png)`). Images get responsive AVIF/WebP
versions, in the body and through `image()`:

```twig
{{ image(project.image, '', {sizes: '(min-width: 1280px) 380px, 100vw'}) }}
```

Each item lists its files in `assets`. `deploy` publishes them to `public/media/collections/`; in
development this route in `config/routes.php` serves them (the skeleton has it):

```php
use TinyTank\Collections\AssetController as CollectionAssetController;
use TinyTank\Collections\Collections;

$app->get(Collections::ASSET_URL . '/{file}', CollectionAssetController::class, 'collection_asset', ['file' => '.+']);
```

A folder holds its index files and its files, no subfolders; an item is all in its folder or all
single files, not both.

## Translations

`<slug>.<language>.md` (or `.yaml`) is the item in another language. Like post translations, it
only needs what changes: any field it omits, and the body if it has none, keep the default-language
value. So a product's Italian file can hold just `name` and the description, while its price comes
from the default file.

An item without a translation is hidden in that language, unless the collection has
`'fallback' => true`. Then it appears in the default language, with `language` set accordingly, so
templates can mark it: `<li lang="{{ item.language }}">`.

## In templates and PHP

Query a collection with `collection('name')`, in the current language and the configured order
(see [Querying content](../basics/querying) for every parameter):

```twig
{% for item in collection('faq') %}
    <details>
        <summary>{{ item.question }}</summary>
        {{ content(item) }}
    </details>
{% endfor %}

{% set ada = collection('team').slug('ada').one() %}
{{ collection('team')|length }} people
{% for member in collection('team').where('role', 'Designer').orderBy('name') %}…{% endfor %}
```

`content(item)` prints the body with its [components](./components) rendered. `markdown` fields are
HTML from Markdown with raw HTML escaped, so `{{ item.bio|raw }}` is safe.

In PHP it's the same query:

```php
$ada = $this->app->collection('team')->slug('ada')->one();
```

A page per item is a route of your own:

```php
$app->get('/team/{slug}', [TeamController::class, 'show'], 'team_member', ['slug' => '[a-z0-9-]+']);
```

```php
public function show(string $slug): Response|string
{
    $member = $this->app->collection('team')->slug($slug)->one();
    if ($member === null) {
        return $this->notFound();
    }
    $this->app->seo->title($member['name']);

    return $this->render('team/member.twig', ['member' => $member]);
}
```

## JSON for JavaScript

A page module that needs the data (a catalogue to filter, a mixer's sounds) can fetch it. List the
fields to publish:

```php
'sounds' => [
    'fields' => ['name' => 'string', 'file' => 'url', 'notes' => '?string'],
    'json' => ['name', 'file'],
],
```

They're served at `/data/sounds.json` (`/it/data/sounds.json` in Italian), with `slug` and
`language`:

```js
const sounds = await (await fetch(document.body.dataset.soundsUrl)).json();
```

```twig
<body data-sounds-url="{{ path('collection_json', {collection: 'sounds'}) }}">
```

It's an allowlist: fields not listed under `json` are never served, and collections without `json`
have no URL. Responses carry an ETag like pages, so browsers revalidate cheaply.

## Errors

Collections are checked when they're compiled (on every request in development, on deploy in
production), and anything unexpected stops with the file name:

- a field not in the definition, a missing required field, or a value of the wrong type
- a file that isn't `<slug>.md` or `<slug>.yaml`, a folder without `index.md`, or a folder inside an
  item folder
- a translation without its default-language file, or for a language that isn't configured
- a folder in `content/` that isn't the blog or a defined collection (usually a typo)
- a relative link in a single-file item's Markdown, or one to a file its folder doesn't have

Run `ddev composer test`: the skeleton's tests compile the site's real content, so CI catches a
broken file before it's deployed.
