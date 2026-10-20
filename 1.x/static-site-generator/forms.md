# Forms

A form from `config/forms.php` keeps working on a static site when its host can send it. On
Cloudflare, the build adds a small Worker that answers the form, checks it like the PHP site does
and emails it to you. Every page stays a plain file; the Worker only runs for the form. It sends in
one of two ways (`static.send`):

- **`smtp`: your own mail server** (your domain's mailbox, your email provider's SMTP), on
  Cloudflare's free plan. The Worker connects to it like a mail program: port 465 (TLS) or 587
  (STARTTLS); Cloudflare blocks port 25.
- **`cloudflare`** (the default): Cloudflare's [Email Service](https://developers.cloudflare.com/email-service/),
  through a binding locked to the form's recipients. It needs a paid Workers plan and the sending
  domain set up there.

## Setting up a form

1. Give the form a sender, in `config/forms.php`:

   ```php
   'contact' => [
       'fields' => [...],
       'to' => getenv('CONTACT_TO'),        // the PHP site's recipient (in development, DDEV's Mailpit)
       'static' => [
           'from' => 'contact@example.com',  // an address your mail server may send from
           'to' => 'you@example.com',        // the static site's recipient; without it, the form's `to`
           'send' => 'smtp',
       ],
   ],
   ```

   Rather keep the addresses out of the repository? Read them from `.env`, and leave the form
   without `static` when they aren't set (tests, CI): `'static' => getenv('STATIC_MAIL_FROM') ? [...] : null`.

2. Let the form's template post to the host in a static build: `form_action()` is the page's own
   URL on the PHP site and `/forms/<name>` in a static build, and Datastar's in-place submit is
   left out (the skeleton's `templates/_forms/contact.twig` does both):

   ```twig
   <form method="post" action="{{ form_action('contact', url) }}"
         {% if not site.static %}data-on:submit__prevent="{{ datastar.action('post', url, {contentType: 'form'}) }}"{% endif %}>
       …
       {{ form_spam('contact') }}
   ```

3. With `smtp`, put the mail server's settings in `.env`:

   ```ini
   SMTP_HOST=mail.example.com
   SMTP_PORT=465
   SMTP_USER=contact@example.com
   SMTP_PASSWORD='…'
   ```

   Write passwords in **single quotes**: unquoted or in double quotes, `.env` reads `$NAME` as a
   variable, and a password with a `$` reaches the server changed ("535 Authentication failed").
   `publish:static` warns about it.

   `publish:static` hands them to Cloudflare as the Worker's encrypted secrets, after each deploy
   (`wrangler secret bulk`, on its input: never in a file); they're never in the build. The
   server must accept connections from Cloudflare's addresses, as from any mail program.

   With `cloudflare`, set up the sending domain in the dashboard's **Email Service** instead; the
   build adds the binding.

4. Publish (`php bin/console publish:static`, [Publishing](./publishing)) and send yourself a
   message. If you get "Your message wasn't sent", the Worker's log says why: see
   [Troubleshooting](./troubleshooting#a-form-says-your-message-wasn-t-sent).

## What happens on the static site

- The visitor's message is checked like on the PHP site: required fields, lengths, email format,
  choices, the honeypot and the links limit, with the same messages in the page's language.
- A valid message is emailed to you, from the form's `static.from`, with the visitor in Reply-To;
  the visitor lands on the form page's **sent** state (`/contact/sent`, the page as it shows after
  sending).
- A message with mistakes gets a short page listing them, with a link back to the form (browsers
  catch most of them before sending, from the same rules).
- A bot that fills the hidden field is told it worked; nothing is sent.

## What it doesn't do

These need the PHP site: the timing check and the rate limit, your own rules
(`$app->forms->rule()`), and a custom email template (`_emails/<form>.txt.twig`). The static site's
email lists every field, like the default template.

::: tip Privacy
The message goes through Cloudflare (your host), and your mail server with `smtp`, to you, and
isn't stored. Say so on your privacy page.
:::
