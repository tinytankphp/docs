# Content components

Components are small reusable pieces placed inside Markdown: an audio player, related posts, a
newsletter box, a video. They're like Hugo's shortcodes. One line of its own in a post, a page or a
collection item's body:

```md
Here's the soundscape I recorded:

::audio-player{playlist="rain-at-night" autoplay=false}

More text…
```

renders `templates/_components/audio-player.twig`. The skeleton has one, `related-posts`, used at the
end of its first post: `::related-posts{limit=2}`.

## Syntax

```md
::name
::name{key="text" count=3 ratio=1.5 enabled=true}
```

- The line holds only the component (up to three spaces of indentation, like any block).
- The name is lowercase letters, digits and dashes: the template's file name.
- Arguments are `key=value` pairs separated by spaces. A value is a `"double-quoted string"` (use
  `\"` inside it), a number, `true` or `false`.

Arguments are plain values on purpose: no Twig expressions, no variables. Content stays content,
and can't run code or reach templates that weren't made to be components.

Inside code (a fenced block, an indented block or `inline code`), a component line is just text,
so posts can show the syntax.

## The template

A component is an ordinary Twig template in `templates/_components/`. It gets its arguments as
variables, plus **`entry`**, the post, page or collection item it appears in:

```twig
{# templates/_components/related-posts.twig #}
{% set related = posts().tag(tag ?? null).all()|filter(post => post.slug != entry.slug)|slice(0, limit ?? 3) %}
{% if related %}
    <aside class="not-prose">
        <h2>{{ 'Related posts'|t }}</h2>
        {% for post in related %}
            <a href="{{ path('blog_post', {slug: post.slug}) }}">{{ post.title }}</a>
        {% endfor %}
    </aside>
{% endif %}
```

Optional arguments read with a default (`limit ?? 3`): in debug mode an undefined variable is an
error. `not-prose` keeps the typography plugin's styles out of the component.

Components render on every request, in the page's language, so they can use everything a template
can: `path()`, queries, `|t`, Datastar. A component that needs JavaScript can load its own bundle:
`{{ vite('resources/js/components/audio-player.js') }}` in its template (the browser loads it once,
even if the component appears twice on a page).

## Printing content

Templates print a post, page or collection item with `content()`, which renders its components:

```twig
{{ content(post) }}
{{ content(page) }}
{{ content(item) }}
```

`post.html` is the compiled HTML with placeholders where components go: `{{ post.html|raw }}` would
leave them out. In PHP, `$this->app->content($post)`.

## Errors

When content is compiled, every component is checked. These stop with the file name, in the browser
during development, in the tests and in `deploy`:

- a component without a template (`unknown component "audio-player" … there is no templates/_components/audio-player.twig`), for example one deleted while posts still use it
- an argument that isn't a string, number or boolean, an argument given twice, or `entry` as an argument
- a line that starts like a component (`::` and a letter) but doesn't parse
- a component in a collection's `markdown` field (they only work in the body)

## Videos: YouTube and Vimeo

Two components come with the framework:

```md
::youtube{id="aqz-KE-bpKQ"}
::youtube{id="aqz-KE-bpKQ" title="Big Buck Bunny" start=90}
::vimeo{id="1084537"}
```

`id` is the 11 characters after `watch?v=` in a YouTube URL, or the number in a Vimeo URL. `title` and
`start` (seconds) are optional. A wrong `id` fails the build like any component error.

**Nothing is loaded from YouTube or Vimeo until the visitor presses play.** A normal embedded player
contacts the video host as soon as the page opens, which sends every visitor's IP address there,
even on `youtube-nocookie.com`. These components instead show:

- **A poster this site serves itself.** `deploy` (the `embeds` step) downloads each video's thumbnail
  and title into `public/media/embeds/`, from the server, never from visitors' browsers. In
  development a missing poster is downloaded once, on first view. If it can't be downloaded
  (offline, a private video), a neutral poster is shown and the deploy carries on with a warning.
- **A play button.** Datastar then gives the player its address, and only then does the video load:
  YouTube from `youtube-nocookie.com`, Vimeo with its do-not-track option.
- **Without JavaScript,** the poster is a link to the video on youtube.com or vimeo.com.

The player's host is allowed in the [Content Security Policy](../security#content-security-policy)
(`frame-src`) **only on pages that show a video**. Other pages keep the strict policy.

Both use `_embeds/video.twig` for their look: copy it to `templates/_embeds/video.twig` to restyle
them together.

## Overriding and default components

Templates are looked up in order:

1. the site's `templates/`
2. templates added by packages, with `$app->addTemplates()` (see [Writing a TinyTank package](../extending/packages))
3. the framework's defaults, also reachable as `@tinytank/…`

So a site overrides any component, from a package or the framework, by creating a file with the same
name in `templates/_components/`. An override can extend the original:

```twig
{# templates/_components/youtube.twig #}
{% extends '@tinytank/_components/youtube.twig' %}
```

## Allowing sources for a component

A component that needs something from another host (audio from a CDN, a map's tiles) can allow it
in the Content Security Policy for the page it's on, and only that page:

```twig
{% do csp_allow('media-src', 'https://cdn.example.com') %}
<audio src="https://cdn.example.com/rain.opus" controls></audio>
```

`csp_allow()` refuses unknown directives and malformed sources, like the site's `csp.sources`.

## In the feed

Feed readers can't run components. In `/blog/feed.xml` each component becomes a link to the post
("Open the page to see this part.", translated like any UI text).
