# Troubleshooting

What can go wrong when building, previewing and publishing a static site, and how to find out why.

## Building

### "Vite manifest not found"

The pages need the CSS and JavaScript build: run `npm run build` before `build:static` (the dev
server, `npm run dev`, isn't used by the static build).

### The build stops with a list of pages

```
/blog: a Datastar GET action to the server (template _partials/blog-results)
/contact: a form posting to the site (/contact)
```

These pages use something that needs PHP. Wrap it in `{% if not site.static %}`, give the form a
`static` sender, or load a page with a plain GET: see [What needs the server](./what-needs-the-server)
and [Forms](./forms). `--allow-dynamic` builds anyway, to look at the rest.

### "is missing (linked from …)"

A link points to a file or page that doesn't exist: fix the link in the page named after "linked
from" ([Broken links](./how-it-works#broken-links)).

### A page is missing from the build

The build only finds pages something links to. Link to it, or add it to `static.paths`
([Configuration](./configuration)). Unlisted pages (`unlisted: true`) are never linked from menus or
the sitemap, so they always need `static.paths`.

### The host's limits

On Cloudflare the build stops above 100 header rules or 2,000 redirects. Header rules come from
pages that add a script source (`csp_allow()`): load that script on fewer pages, or allow it
site-wide in `csp.sources`.

## Previewing

### The port is taken

`preview:static` listens on 4173; another program may already use it: `--port 4174`. With DDEV,
the port must also be in `.ddev/config.yaml` (`web_extra_exposed_ports`), then `ddev restart`.

### `wrangler dev` doesn't start

It needs Node.js (DDEV has it). `--php` serves the build with PHP's built-in server instead: pages,
files and redirects, but not the host's headers or the forms.

## Publishing

### "CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set"

`publish:static` reads them from `.env` (or the environment). Create the token as in
[Publishing](./publishing), and copy the account ID from the Cloudflare dashboard's home page.

### "No access to the specified resource"

Or "Authentication error". Cloudflare refused the token: it's valid, but lacks a permission for
what wrangler asked. Most often the Workers permissions are in a policy limited to a domain
(**Specified Domains**), where they don't count: Workers belong to the account. Edit the token
(**Manage Account** → **Account API Tokens**, or **My Profile** → **API Tokens**) so it has two
policies:

| Resource | Permissions |
|---|---|
| your account | **Workers Scripts: Edit**, **Account Settings: Read**, **Workers Tail: Read** |
| **Specified Domains** → the site's domain | **Workers Routes: Edit** |

Editing the policies keeps the token's value: run `publish:static` again. If it still fails, check
`CLOUDFLARE_ACCOUNT_ID` is the account the token belongs to.

### The token is refused for everything

If even the first request fails, the token in `.env` isn't one Cloudflare knows: copied
incompletely, rolled, deleted or expired. Create a new one and replace `CLOUDFLARE_API_TOKEN`.

### `wrangler login` doesn't work in a container

The login opens a browser that sends its answer to `localhost`, which a container (DDEV, Docker,
WSL) doesn't receive. Use an API token and `publish:static` instead.

### The domain isn't connected

The domain must be managed by Cloudflare (its DNS on Cloudflare) and listed in `static.domains`;
the token needs **Workers Routes: Edit** on it. Cloudflare won't connect a domain whose DNS already
has a record for that name pointing elsewhere (the previous host): remove that record in the
dashboard (**DNS** → **Records**), then publish again. Without `domains`, the site is at
`https://<name>.<your-account>.workers.dev`.

### A change doesn't show on the live site

Publish again: `publish:static` builds first (unless `--no-build`). Each deploy replaces every
file, so the live site is the exact copy of the last build.

## Forms

### A form says "Your message wasn't sent"

The Worker couldn't send the message, and its log says why. Follow the log while you send the form
again, from the output folder:

```sh
cd deploy
npx wrangler tail --env-file ../.env
```

The token needs **Workers Tail: Read**. Then send the form; the log shows a line like
`Form "contact" not sent: Error: The mail server answered 535: 535 Authentication Failed`:

| The log says | What to check |
|---|---|
| `answered 535` | the mail server refused the login: `SMTP_USER` (often the full address) and `SMTP_PASSWORD`. A password with a `$` must be in **single quotes** in `.env` (`SMTP_PASSWORD='…'`): unquoted or in double quotes, `$NAME` is read as a variable, and the server gets something else. `publish:static` warns about it. |
| `answered 550`, `553` or `554` | the server refused the sender or the recipient: `static.from` must be an address that login may send from, and some servers refuse other domains' recipients |
| `SMTP_HOST is not set` | the Worker has no secrets: publish with `publish:static` (it sets them), not `wrangler deploy` alone |
| a timeout, a refused connection, or `The mail server closed the connection` | the server doesn't accept connections from Cloudflare, or the port is wrong: use 465 (TLS) or 587 (STARTTLS); Cloudflare blocks port 25 |
| a TLS or certificate error | the port and its encryption don't match (465 is TLS from the start, 587 starts plain and switches) |

After changing `.env`, `php bin/console publish:static --no-build` sends the new secrets.

### "Sent", but nothing arrives

Look in the spam folder first. A message from an address of your own domain, sent through your own
mail server, is the most likely to be delivered; one whose `static.from` belongs to another domain
is often refused or filed as spam (the domain's SPF and DMARC records don't allow your server).
Check the server's own log too: the Worker only knows the server accepted the message.

A bot that fills the hidden honeypot field is also told "sent", and nothing is sent.

### Emails in development

`preview:static` doesn't send anything: the forms' Worker writes each email to a file in
`deploy/.wrangler/tmp/email/`. The PHP site in development sends to DDEV's Mailpit.
