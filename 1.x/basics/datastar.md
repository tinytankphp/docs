# Datastar

[Datastar](https://data-star.dev) adds interactivity with HTML attributes: it keeps state in
**signals**, sends requests to the server, and patches the page with the HTML the server sends back
over server-sent events. TinyTank renders that HTML with Twig, so interactive features are plain
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
{% set query = signal('query', max: 200)|lower %}
<ul id="results">
    {% for fruit in ['Apple', 'Banana', 'Cherry']|filter(f => query in f|lower) %}
        <li>{{ fruit }}</li>
    {% endfor %}
</ul>
```

`datastar.get('_partials/search')` prints a Datastar action (`@get("/datastar?config=…")`). On the
server, TinyTank renders the partial with the browser's **signals**. If the template queues no
events, its whole output is patched into the page, matched by element id.

## Reading signals

Signals come from the browser, so they can be anything: text where you expect a number, a list
where you expect text. Read them with their type, and you always get what you asked for, or the
default:

| Twig | PHP (`$this->signals()` in a controller, `$app->signals()`) | Gives |
|---|---|---|
| `signal('q')`, `signal('q', 'all', max: 200)` | `->string('q', 'all', max: 200)` | the text (a number becomes its text), cut to `max` characters (1000); else the default (`''`) |
| `signal_int('page', 1, min: 1, max: 1000)` | `->int('page', 1, min: 1, max: 1000)` | a whole number (or its text, `"2"`), kept within `min` and `max`; else the default (`0`) |
| `signal_bool('open')` | `->bool('open')` | `true`/`false` (or `"true"`, `1`…); else the default (`false`) |
| `signal_enum('sort', ['new', 'old'])` | `->enum('sort', ['new', 'old'])` | one of the choices; else the default (the first choice) |

A name can reach into an object: `signal('form.email')`. `->all()` and `->has('name')` give the rest.
The raw `signals` variable is still there, as sent, but `signals.page ?? 1` passes on whatever the
browser sent: a list, a huge number.

A request whose signals aren't valid JSON gets a **400**, and one larger than 64 KB a **413**: a
browser running your page never sends either. A form that Datastar posts as a form
(`contentType: 'form'`) has no signals; its fields are in the request, as without JavaScript.

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

::: tip ARIA states are strings
`data-attr` writes `true` as a bare attribute and removes the attribute for `false`. ARIA needs the
words: `data-attr:aria-expanded="String($open)"`.
:::

::: warning Queue the HTML too
As soon as a partial queues an event, **only the queued events are sent**: HTML outside
`patch_elements` is dropped. A partial that changes a signal *and* an element wraps the element in
`{% apply patch_elements %}`.
:::

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
In the controller, read them with their type: `$this->signals()->int('page', 1, min: 1)`.

A controller can stop with an error status for the visitor: `throw new HttpError(403, 'Not allowed.')`
(`TinyTank\HttpError`) answers with that status's error page, its message translated.

## CSRF

POST, PUT, PATCH and DELETE requests must come from your own site. TinyTank checks the browser's
`Sec-Fetch-Site` / `Origin` headers, which every browser sends with Datastar's `fetch()` requests,
so there's no token to add. See [Security](../security#csrf-protection).

## Languages

Datastar URLs carry the current language (`/it/datastar?…`), so partials render in the page's
language: `|t`, `path()` and dates all follow it.

## From the Craft Datastar plugin

| Craft Datastar plugin | TinyTank |
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
