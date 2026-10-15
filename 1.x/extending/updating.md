# Updating TinyTank

The framework is the `tinytank/framework` Composer package, so updating it never touches your
site's files:

```sh
ddev composer update tinytank/framework
```

Then run your checks and look at the result before deploying:

```sh
ddev composer test
ddev composer analyse
```

## Versions

TinyTank is in **beta (0.x)**. Releases are tagged (`v0.1.0`…) and listed, with what to change in
your site, in the [CHANGELOG](https://github.com/tinytankphp/framework/blob/main/CHANGELOG.md).
The skeleton requires:

```json
"require": { "tinytank/framework": "^0.1@dev" },
"prefer-stable": true
```

`^0.1` means any 0.1.x release: fixes only. With `prefer-stable`, `composer update` installs the
latest **tagged** one; `@dev` only lets maintainers work against the `main` branch (see Contributing).
While TinyTank is 0.x, a new minor version (0.2.0) may change behaviour: move to it deliberately, by
changing the constraint to `^0.2@dev` after reading its changelog entry. From 1.0, `^1.0` will
follow every compatible release, and a future 2.x will get its own [documentation version](/).

These docs (`/1.x/`) describe the 0.x betas leading to 1.0.

Your `composer.lock` records the exact framework commit, so every server installs the version you
tested. Commit it after each update.

## Where the package comes from

The framework is on [Packagist](https://packagist.org/packages/tinytank/framework), Composer's
default source. The skeleton's `composer.json` also lists a local folder:

```json
"repositories": [
    { "type": "path", "url": "packages/*", "options": { "symlink": true } }
]
```

It's for TinyTank maintainers, who work on the framework in a local clone in `packages/` (see
[Contributing](../contributing)). In your site, `packages/` stays empty and Composer uses Packagist.
You can delete the entry and the `packages/` folder if you never work on the framework itself.

## Skeleton changes

Improvements to the skeleton (new example templates, config defaults) don't reach existing sites
automatically, because your site's files are yours. When a framework release needs a change in
your files, its notes and these docs say so.
