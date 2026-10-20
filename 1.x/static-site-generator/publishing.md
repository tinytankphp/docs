# Publishing

On Cloudflare Workers, with Cloudflare's command line tool, `wrangler` (it needs Node.js; `npx`
fetches it, or install it in the site with `npm i -D wrangler`):

1. Set the site's public address and domain in `config/app.php`. The domain must be managed by
   Cloudflare (its DNS on Cloudflare); Cloudflare points it at the site and makes its certificate:

   ```php
   'static' => [
       'base_url' => 'https://example.com',
       'domains' => ['example.com'],
   ],
   ```

2. Create an API token (once), so wrangler can publish without a browser login (which a container
   can't receive). In the Cloudflare dashboard, **Manage Account** → **Account API Tokens** →
   **Create Token** (or **My Profile** → **API Tokens** for one tied to you), and give it **two
   policies**. Workers permissions belong to the account, so a policy limited to a domain doesn't
   grant them, even with the right boxes ticked:

   | Policy | Resource | Permissions |
   |---|---|---|
   | 1 | your account | **Workers Scripts: Edit**, **Account Settings: Read**, **Workers Tail: Read** (for `wrangler tail`, the forms' logs) |
   | 2 | **Specified Domains** → the site's domain | **Workers Routes: Edit** (connects `domains` to the Worker) |

   The **Edit Cloudflare Workers** template ticks these and more (KV, R2, Pages…, not needed);
   check the template didn't put them all under the domain's policy. Copy the token (shown once)
   into `.env`, with your account ID (on the dashboard's home page, or any domain's overview):

   ```ini
   CLOUDFLARE_API_TOKEN=…
   CLOUDFLARE_ACCOUNT_ID=…
   ```

   `.env` is never committed, and nothing from it is written in the build. Editing a token's
   policies later keeps its value. If wrangler answers "No access to the specified resource", see
   [Troubleshooting](./troubleshooting#no-access-to-the-specified-resource).

3. Build and publish:

   ```sh
   php bin/console publish:static          # with DDEV: ddev exec php bin/console publish:static
   ```

   It runs `build:static`, then `wrangler deploy` in the output folder (`--no-build` publishes the
   existing build; `--dry-run` only shows the command). The first deploy creates the Worker (named
   after `static.name`, or the site) and connects the domains; later ones replace the files. Without
   `domains`, the site is at `https://<name>.<your-account>.workers.dev`.

   Rather log in through a browser? From a terminal on your computer: `npx wrangler login` once,
   then `npx wrangler deploy` in `deploy/` after each `build:static` (forms sent over SMTP need
   their secrets once: `npx wrangler secret put SMTP_PASSWORD`, and the same for the other keys).

4. Check the live site: its pages, and a message through each form.

Each deploy publishes everything again, so it's always the build's exact copy; Cloudflare keeps
earlier versions, to roll back in its dashboard.

## What `publish:static` does

1. Checks `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set (in `.env` or the environment).
2. Runs `build:static` (unless `--no-build`), and checks the build is for Cloudflare.
3. Runs `wrangler deploy` in the output folder, with the site's own `wrangler`
   (`npm i -D wrangler`) or `npx wrangler@4`.
4. For [forms sent over SMTP](./forms): sets `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and
   `SMTP_PASSWORD` from `.env` as the Worker's encrypted secrets (`wrangler secret bulk`, on its
   input: never written to a file). It warns about a `$` outside single quotes in those values,
   and stops if a form needs `SMTP_HOST` and it's missing.

| Option | |
|---|---|
| `--no-build` | publish the existing build (after `build:static` and `preview:static`, say) |
| `--dry-run` | only show the commands; nothing is built, uploaded or written |

## Running wrangler yourself

Other wrangler commands (the forms' logs, versions, rollbacks) read the same token with
`--env-file`, from the output folder:

```sh
cd deploy
npx wrangler tail --env-file ../.env          # the Worker's live logs
npx wrangler deployments list --env-file ../.env
```
