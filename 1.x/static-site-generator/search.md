# Search

The skeleton's blog search works on a static site too. On the PHP site the server filters the posts
(`_partials/blog-results.twig`); in a static build the browser does:

- `/blog/search` (route `blog_search`, `templates/blog/search.twig`) lists every post, each with its
  words and tags in `data-words` and `data-tags`, and shows while it matches:
  `data-show="($tag === '' || el.dataset.tags.split(' ').includes($tag)) && el.dataset.words.includes($q.trim().toLowerCase())"`.
  It's marked `noindex`, and its route stays out of the sitemap (`sitemap: false`); the build finds it
  through the search box.
- In a static build, the search box and tag buttons load it on first use with a plain Datastar GET,
  in place of an empty `#blog-search`, and hide the page's own list while a search or tag is active:

  ```twig
  {% set filter = site.static
      ? '$_all || ($_all = true, ' ~ datastar.action('get', path('blog_search')) ~ ')'
      : '$page = 1; ' ~ datastar.get('_partials/blog-results') %}
  ```

## Searching anything else

The same pattern searches anything else (a collection, a catalogue): a page listing every item with
its words, loaded on first use, filtered by Datastar in the browser. It suits a few hundred items;
the whole list is one request.
