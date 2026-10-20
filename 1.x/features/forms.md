# Forms

TinyTank handles forms without a database: a visitor fills one in, it's checked, and it's **emailed**.
Nothing is stored. The skeleton's Contact page (`/contact`, `/it/contatti`) is a working example.

## Defining a form

Forms are defined in `config/forms.php`:

```php
return [
    'contact' => [
        'fields' => [
            'name' => ['type' => 'text', 'required' => true, 'max' => 100],
            'email' => ['type' => 'email', 'required' => true],
            'topic' => ['type' => 'choice', 'choices' => ['question', 'feedback']],
            'message' => ['type' => 'textarea', 'required' => true, 'min' => 10, 'max' => 5000],
        ],
        'to' => getenv('CONTACT_TO') ?: null,     // recipients, comma-separated
        'subject' => 'Message from {name}',        // translated; field values as placeholders
        'spam' => ['honeypot', 'timing' => 3, 'max_links' => 2, 'rate_limit' => '5/hour'],
    ],
];
```

| Field type | Value |
|---|---|
| `text` | one line (line breaks are removed) |
| `email` | a valid email address |
| `textarea` | several lines |
| `choice` | one of `choices` |
| `checkbox` | ticked or not; `required` means it must be ticked |

Options per field: `required`, `min` and `max` (characters). Control characters are stripped, and
every type has a maximum length even without `max`, so nobody can send a novel.

The visitor's address (the first `email` field, or `reply_to`) goes in the email's **Reply-To**: you
reply directly. The message comes **from** `MAILER_FROM`, an address of your own domain, so it passes
SPF, DKIM and DMARC checks.

## Validation in the page's language

The messages (`This field is required.`, `Use at most {max} characters.`…) are UI texts, translated in
`translations/<code>.php` like any other, so an Italian page shows Italian errors.

More rules go in `config/bootstrap.php`. A rule gets the field's value and all the values, and
returns an error message or `null`:

```php
$app->forms->rule('contact', 'message', fn (mixed $value) =>
    str_contains(strtolower((string) $value), 'casino') ? $app->t('No, thanks.') : null);
```

## Sending email

Email goes out with [Symfony Mailer](https://symfony.com/doc/current/mailer.html). Set in `.env`:

```sh
MAILER_DSN=smtp://user:pass@smtp.example.com:587
MAILER_FROM=hello@example.com
CONTACT_TO=you@example.com
```

`MAILER_DSN` takes any Symfony Mailer transport: plain SMTP, or providers such as Mailgun, Postmark or
Amazon SES with their bridge package (`composer require symfony/mailgun-mailer`).

**In DDEV**, `.ddev/config.yaml` points these at **Mailpit**, which catches every message: nothing is
really sent, and `ddev mailpit` opens the inbox. (Run `ddev restart` after changing them.)

The email lists every field. To write your own, create `templates/_emails/<form>.txt.twig` (plain
text: `.txt.twig` templates aren't HTML-escaped), with `values`, `form` and `site_name`.

## The page and the template

A content page shows a form with `form:` in its front matter:

```md
---
title: Contact
template: pages/contact.twig
form: contact
---
Questions or ideas? Write to us.
```

`PageController` then gives its template a `form` with the state:

| | |
|---|---|
| `form.values.email` | what was typed (kept after an error) |
| `form.errors.email` | the field's error, if any |
| `form.errors._form` | a message about the whole form (too many links, too many messages) |
| `form.sent` | whether it went out |

The skeleton's `templates/_forms/contact.twig` is the form itself. Inside the `<form>`,
`{{ form_spam('contact') }}` prints the spam checks' hidden fields. It submits with Datastar, so errors
and the thank-you appear in place without a reload:

```twig
<form id="contact-form" method="post" action="{{ url }}"
      data-on:submit__prevent="{{ datastar.action('post', url, {contentType: 'form'}) }}">
```

**Without JavaScript** it's a normal form post: errors show the page again, and a successful send
redirects to `?sent=1`, so refreshing the page can't send the message twice. The kernel's
[same-origin check](../security#csrf-protection) protects it like every POST.

## Spam protection

Every built-in check runs **on this server**: no captcha service, no third-party script, nothing
about visitors leaves the site.

| Check | How it works | What it keeps |
|---|---|---|
| `honeypot` | a field hidden from people (off-screen, out of the tab order, hidden from screen readers) that bots fill in | nothing |
| `timing` | the form carries a token with the time it was shown, signed with `APP_SECRET`; sent within N seconds (default 3), it's a bot. After a day it has expired | nothing |
| `max_links` | more than N links (default 2) is refused, with a message | nothing |
| `rate_limit` | at most N messages per visitor (`'5/hour'`, `'20/day'`) | a keyed hash of the IP (HMAC with `APP_SECRET`, which can't be turned back into the address), in `var/state/forms/` (kept across deploys), only for the length of the window |

A bot caught by the honeypot or the timing sees "sent" like everyone else, so it learns nothing. Too
many links or messages get a message, since a person can act on it. The log records that a form was
sent or rejected and why (`Form "contact" rejected as spam (honeypot).`), never what was in it.

**Pages with a form are never cached**: the timing token makes every view different, so they're
sent with `Cache-Control: no-store`. Every other page keeps its ETag and public caching.

### Adding a spam check

A check implements `TinyTank\Forms\Spam\SpamCheck`: `markup()` prints what it needs inside the form,
`check()` returns `null` or a `SpamResult`. Register it in `config/bootstrap.php` (or a package's
`register()`) and list it in a form's `spam`:

```php
$app->forms->addSpamCheck('altcha', fn (mixed $option, Form $form) => new AltchaCheck(…));
```

Forms are checked once bootstrap has run, so a misspelled check name still stops the site at boot
rather than letting spam through.

A self-hosted proof-of-work challenge such as [ALTCHA](https://altcha.org) fits this privacy-first
approach. Third-party captchas (Cloudflare Turnstile, hCaptcha) send visitors' IP addresses to another
company: load them only when the visitor starts filling in the form, allow their hosts on that page
only with `csp_allow()`, and mention them on your privacy page.

## Privacy

- Submissions are **emailed, not stored**. There's no database of messages, and the
  [log](./logging) only says a form was sent or rejected as spam, never what was in it.
- Tell visitors what happens to their details. The skeleton's form says "We use your details only to
  reply to you" with a link to the Privacy page, which has a paragraph about the form.

## On a static site

A static build has no PHP to receive the form, but its host can: with `'static' => ['from' => …]`
in the form's definition, Cloudflare checks and emails it, with the same rules and messages. See
[Static Site Generator → Forms](../static-site-generator/forms).

## Testing forms

`KernelTestCase::request()` takes form fields:

```php
$response = $this->request($app, '/contact', 'POST', ['Sec-Fetch-Site' => 'same-origin'], parameters: [
    'email' => 'not-an-email',
]);
self::assertStringContainsString('Enter a valid email address.', self::body($response));
```

In the browser tests, wait a few seconds before submitting (`tests/e2e/contact.spec.js`): the timing
check refuses forms filled in faster than a person could.
