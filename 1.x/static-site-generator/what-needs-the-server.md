# What needs the server

A static site has no PHP behind it, so some features can't work there:

- Datastar actions that call the server: a template action (`datastar.get('_partials/search')`),
  a POST to a route (the skeleton's clock). A plain GET of a page of the site
  (`datastar.action('get', path('blog_search'))`) is fine: the build writes that page too, and the
  file answers it ([Search](./search) works this way).
- Forms that post to the site, unless the host answers them ([Forms](./forms)).
- Anything a controller computes on each request: it runs once, at build time, and the result is
  the file.

The build finds them on every page and stops with a list:

```
/blog: a Datastar GET action to the server (template _partials/blog-results)
/contact: a form posting to the site (/contact)
```

Browser-only Datastar keeps working (toggles, tabs, the theme, anything with `data-signals` and no
`@get`/`@post`), and so do JavaScript modules.

## `site.static`

Templates can tell they're being rendered for a static build:

```twig
{% if not site.static %}
    {# the live search: only on the PHP site #}
{% endif %}
```

`--allow-dynamic` builds anyway, with the list as a warning.
