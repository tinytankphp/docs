# Logging

When something goes wrong in production, the visitor sees a polite error page and the details go to
the **log**: a file on your server, and optionally an email to you. TinyTank logs with
[Monolog](https://github.com/Seldaek/monolog), PHP's standard logging library, set up so the log helps
you fix problems **without becoming a record of your visitors**.

## Where the log is

```
var/log/app-2026-10-06.log
var/log/app-2026-10-05.log
…
```

One file per day, in `var/log/` (outside `public/`, so it's never served). Files older than 14 days
are deleted automatically. A log line looks like this:

```
[2026-10-06 16:04:16] app.INFO: Form "contact" sent. {"method":"POST","path":"/contact","route":"page"}
[2026-10-06 16:04:16] app.ERROR: Price list unreadable {"exception":"[object] (RuntimeException(code: 0): Price list unreadable at src/Prices.php:42)
[stacktrace]
#0 src/Controller/PriceController.php(18): App\Prices->load()
…"} {"method":"GET","path":"/prices","route":"prices"}
```

To follow it live: `tail -f var/log/app-$(date +%F).log`.

## What's logged

| What | Level |
|---|---|
| An uncaught exception (the visitor got the 500 page) | `error` |
| A PHP warning in production (`Undefined array key`…): the page still renders, but there's a bug | `error` |
| A PHP notice | `warning` |
| A fatal PHP error, or the error page itself failing | `critical` |
| A form was sent | `info` |
| A form was rejected as spam, and which check rejected it | `notice` |

**Not logged:** pages that don't exist (404s), and PHP deprecations in production: they're notes for
developers about future PHP versions, left to PHP's own settings (production `php.ini` ignores them).

The **level** says how serious a message is, from `debug` to `emergency`. Messages below the
configured level aren't written: by default `debug` in development (everything) and `info` in
production. Set `LOG_LEVEL` to change it, for example `LOG_LEVEL=warning` for a quieter log.

## Privacy: what the log leaves out

A log is personal data as soon as it can tell who visited, and under the GDPR personal data needs a
reason to be collected, has to be protected, and can't be kept forever. Most logging setups record
far more than they need. TinyTank's log is built to answer "what broke, and where?" and nothing else:

- **No IP addresses.** An IP address can identify a person (the EU Court of Justice has ruled so). Web
  servers and many frameworks log it with every line; TinyTank doesn't. A broken page is broken for
  everyone, so who saw it adds nothing.
- **No browser, no referrer.** The user agent and the page someone came from build a profile of a
  visitor; they don't help fix a bug.
- **No query string.** `/search?q=…` or a link with `?email=…&token=…` can contain anything a
  visitor typed or was sent. Entries carry the **method, path and route name** only: enough to
  reproduce the problem.
- **No 404s.** Bots try `/wp-login.php` all day, and people mistype addresses. A list of everything
  visitors typed in the address bar is noise for you and data about them.
- **No form content.** The log says a form was sent, or which spam check stopped it, never what was
  written in it (see [Forms](./forms#privacy)).
- **No function arguments in traces.** An exception's stack trace lists the functions that were
  running, and PHP can include the values passed to them: a password being checked, an email
  address being sent to. In production, TinyTank turns that off (`zend.exception_ignore_args`), so
  traces show where, not what.
- **Deleted after 14 days.** The GDPR's *storage limitation* principle: keep data only as long as
  needed. Two weeks is enough to notice and fix a problem; `days` changes it.
- **No third party.** Error-tracking services (Sentry, Bugsnag, Better Stack…) receive your errors,
  and with them whatever the errors contain, on someone else's servers, often outside the EU. TinyTank's
  log stays on your server, and alerts go through your own mailer.

What can still end up in it: **error messages**, which are written by whoever threw the error. A
library's message may quote the value it refused (an address, a file name), and so may your own
code's. They're logged as they are, because the message is what tells you what broke.

So TinyTank's log describes your site, not your visitors. Your **web server's** access log is another
matter: nginx and Apache record every request with its IP address unless you configure them not to
(see [Servers](../deployment/servers#access-logs)).

::: tip Your own messages
The same applies to what your code logs, and to the messages of the exceptions it throws. Log what
happened, not who did it: `$app->logger->info('Newsletter sent to {count} subscribers', ['count' => 120])`,
not the addresses; `throw new RuntimeException('The subscriber list is empty')`, not its contents.
:::

## Email alerts

Knowing about a problem before your visitors write to you:

```sh
# .env
LOG_ALERT_TO=you@example.com     # comma-separated for several
```

From then on, an `error` (or worse) is emailed to you, through the mailer forms use (`MAILER_DSN`,
`MAILER_FROM`):

- **With what led to it:** the email contains the error and every line logged before it in the same
  request, so you see the context, not just the last line.
- **Once per hour per error:** if the same error happens on every request during a traffic spike,
  you get one email, not five hundred. A different error gets its own email.
- **After the visitor has the page:** the email is sent once the response is out (PHP-FPM), so an
  error doesn't make the error page slower.
- If the email can't be sent (wrong SMTP password, server down), the log file says so; the error
  itself is in the file either way.

The subject reads `[Your site] ERROR: Price list unreadable`.

## Configuration

```php
// config/app.php
'log' => [
    'level' => getenv('LOG_LEVEL') ?: null,      // null: debug in development, info in production
    'days' => 14,                                // daily files to keep
    'alert_to' => getenv('LOG_ALERT_TO') ?: null,
    // 'path' => 'php://stderr',                 // another file, or a stream
],
```

`path` is `var/log/app.log` by default (the date is added to the name). A stream such as
`php://stderr` is for platforms that collect a process's output themselves (Docker, some PaaS);
there, the platform decides how long logs are kept.

On the server, `var/log/` must be **writable by PHP**. If the log can't be written (permissions, a
full disk), pages keep working and PHP's own error log gets a short note instead.

## Logging from your code

The logger is `$app->logger`, also in the container as `Psr\Log\LoggerInterface` (the PSR-3
standard, so any library that accepts a logger takes it):

```php
$this->app->logger->warning('Price list is {days} days old', ['days' => $age]);
```

```php
use Psr\Log\LoggerInterface;

$client = new SomeApiClient(logger: $app->container->get(LoggerInterface::class));
```

`{name}` placeholders are filled from the context. Use the levels for what they mean: `info` for
things worth knowing, `warning` for something odd, `error` for something broken (it sends an alert).

### Sending logs elsewhere

The logger is a Monolog `Logger`, so a [package](../extending/packages) or `config/bootstrap.php` can
add any Monolog handler:

```php
use Monolog\Handler\SyslogHandler;

$app->logger->pushHandler(new SyslogHandler('my-site'));
```

If you add an error-tracking service this way, check what it sends and where, and mention it in your
privacy policy.

## Testing

`KernelTestCase` gives every test its own log directory, and `$this->logged()` returns what was
logged:

```php
$this->request($app, '/contact', 'POST', …);
self::assertStringContainsString('Form "contact" sent.', $this->logged());
self::assertStringNotContainsString('ada@example.test', $this->logged());
```
