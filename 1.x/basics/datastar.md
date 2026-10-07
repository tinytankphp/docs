# Datastar

[Datastar](https://data-star.dev) adds interactivity with HTML attributes: it keeps state in
**signals**, sends requests to the server, and patches the page with the HTML the server sends back
over server-sent events. Starlite renders that HTML with Twig, so interactive features are plain
templates.

The Datastar client (v1) ships with the framework, matched to its PHP SDK, and `resources/js/app.js`
loads it on every page. To combine Datastar with your own JavaScript modules, see
[JavaScript & Datastar](../features/javascript).

## Render a template on demand

The simplest pattern: a button or input asks the server to render a partial, and Datastar swaps it
into the page by element id.

```twig
{# templates/index.twig #}
<input data-bind:query placeholder="Search…"
       data-on:input__debounce.200ms="{{ datastar.get('_partials/search') }}">
<ul id="results"></ul>
```

```twig
{# templates/_partials/search.twig #}
{% set query = (signals.query ?? '')|lower %}
<ul id="results">
    {% for fruit in ['Apple', 'Banana', 'Cherry']|filter(f => query in f|lower) %}
        <li>{{ fruit }}</li>
    {% endfor %}
</ul>
```

`datastar.get('_partials/search')` prints a Datastar action (`@get("/datastar?config=…")`). On the
server, Starlite renders the partial with the browser's **signals** in the `signals` variable. If
the template queues no events, its whole output is patched into the page, matched by element id.

`post`, `put`, `patch` and `delete` work the same way. A second argument passes variables to the
template:

```twig
<button data-on:click="{{ datastar.post('_partials/like', {fruit: 'Mango'}) }}">Like</button>
```

::: info Signed, but readable
Those variables travel in the URL, signed with `APP_SECRET`, so they can't be tampered with. They
are still **readable** in the page source: never pass secrets through them.

The signature covers the **HTTP method** too: a `datastar.post()` URL only works as a POST (a GET
gets a 405), so a link or a browser prefetch can't trigger it, and POSTs from other sites are refused
(see [Security](../security)). Anyone who can see the page can still send that POST themselves, as
often as they like: a signed URL isn't a permission. Changes that need authorization, or that must
happen once, belong in a [controller](./controllers) that checks them.
:::

## Events in a partial

For more than one change, queue events explicitly. They're sent in template order:

```twig
{% apply patch_elements %}
    <p id="likes">You liked {{ fruit }}.</p>
{% endapply %}

{% apply patch_elements({selector: '#log', mode: 'append'}) %}
    <li>{{ fruit }}</li>
{% endapply %}

{% do patch_signals({liked: true}) %}
{% do remove_elements('#old-banner') %}
{% do execute_script("console.log('updated')") %}
{% do location('/thanks') %}
```

`execute_script()` is blocked by the [Content Security Policy](../security#inline-scripts-from-datastar)
unless you allow that exact script; patching elements and signals is usually the better choice.

## Calling your own routes

For logic that belongs in PHP, point Datastar at a route and return `stream()` from the controller:

```twig
<button data-on:click="{{ datastar.action('post', path('clock')) }}">What time is it?</button>
<p id="clock"></p>
```

```php
// config/routes.php
$app->post('/clock', ClockController::class, 'clock');

// src/Controller/ClockController.php
final class ClockController extends Controller
{
    public function __invoke(): StreamedResponse
    {
        return $this->stream('_partials/clock.twig', ['now' => date('H:i:s')]);
    }
}
```

`stream()` renders the template with the request's signals, exactly like the template actions.

## CSRF

POST, PUT, PATCH and DELETE requests must come from your own site. Starlite checks the browser's
`Sec-Fetch-Site` / `Origin` headers, which every browser sends with Datastar's `fetch()` requests,
so there's no token to add. See [Security](../security#csrf-protection).

## Languages

Datastar URLs carry the current language (`/it/datastar?…`), so partials render in the page's
language: `|t`, `path()` and dates all follow it.

## From the Craft Datastar plugin

| Craft Datastar plugin | Starlite |
|---|---|
| `{{ datastar.get('_partials/x', {id: 1}) }}` | same (also `post`, `put`, `patch`, `delete`) |
| `{% patchelements %}…{% endpatchelements %}` | `{% apply patch_elements %}…{% endapply %}` |
| `{% patchelements with {mode: 'append'} %}` | `{% apply patch_elements({mode: 'append'}) %}` |
| `{% patchsignals {a: 1} %}` | `{% do patch_signals({a: 1}) %}` |
| `{% removeelements '#x' %}` | `{% do remove_elements('#x') %}` |
| `{% executescript %}…{% endexecutescript %}` | `{% do execute_script('…') %}` |
| `{% location '/x' %}` | `{% do location('/x') %}` |
| `signals` variable | same |
| custom controller + `Sse` trait | controller returning `$this->stream(…)` |
