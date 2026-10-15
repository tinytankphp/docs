# TinyTank documentation

Source of the TinyTank docs, built with [VitePress](https://vitepress.dev) and published to GitHub
Pages by `.github/workflows/deploy.yml` on every push to `main`.

```sh
npm install
npm run dev       # http://localhost:5174 (in DDEV: https://<project>.ddev.site:5174)
npm run build     # static site in .vitepress/dist
```

Pages live in a folder per TinyTank version (`1.x/`), so links keep working when 2.x arrives:
copy the folder, add it to the sidebar and the version menu in `.vitepress/config.mts`.

TinyTank maintainers clone this repository into the skeleton's gitignored `docs/` folder, next to
the framework in `packages/tinytank`, so code and docs change together. See the skeleton's
[CONTRIBUTING.md](https://github.com/tinytankphp/tinytank/blob/main/CONTRIBUTING.md).

## License

The documentation is released under the [MIT License](https://github.com/tinytankphp/docs/blob/main/LICENSE), Copyright (c) 2026 lab909, like
TinyTank itself.

