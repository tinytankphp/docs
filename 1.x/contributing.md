# Contributing

TinyTank is three repositories:

| Repository | What it is |
|---|---|
| [tinytankphp/tinytank](https://github.com/tinytankphp/tinytank) | the site skeleton: the starting point for every site |
| [tinytankphp/framework](https://github.com/tinytankphp/framework) | the framework package, `tinytank/framework` |
| [tinytankphp/docs](https://github.com/tinytankphp/docs) | this documentation (VitePress) |

## Working on all three together

Changes often span the framework, the skeleton and the docs. Clone the other two repositories
**inside** the skeleton; both locations are gitignored, so they're never published with it:

```sh
git clone git@github.com:tinytankphp/tinytank.git && cd tinytank
git clone git@github.com:tinytankphp/framework.git packages/tinytank
git clone git@github.com:tinytankphp/docs.git docs
ddev start
ddev composer update tinytank/framework     # symlinks packages/tinytank into vendor/
```

The skeleton's `composer.json` lists a path repository (`packages/*`) before the framework's
GitHub repository. When `packages/tinytank` exists, Composer prefers it and symlinks it into
`vendor/tinytank/framework`, so framework edits take effect immediately. Because of that, the
skeleton never commits `composer.lock`.

Each clone is its own git repository: commit framework changes in `packages/tinytank`, docs
changes in `docs/`, skeleton changes at the root.

## Running the checks

```sh
ddev composer test && ddev composer analyse                                  # skeleton (app tests)
cd packages/tinytank && composer update && composer test && composer analyse # framework
cd docs && npm install && npm run build                                      # docs
```

The docs dev server (`npm run dev` in `docs/`) runs on port 5174; DDEV exposes it at
`https://<project>.ddev.site:5174`.

## Guidelines

- Keep the framework free of `App\` code: what a site might change belongs in the skeleton, or
  needs an extension point in the framework.
- Every behaviour change comes with a test (framework or app suite) and a docs update.
- Prefer proven libraries for infrastructure; TinyTank's own code is the glue between them.
- PHPStan level 8 stays clean in both PHP repositories.

## Docs fixes

Every page has an **Edit this page on GitHub** link: small fixes can go straight to the docs
repository as a pull request.
