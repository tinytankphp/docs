# Services & bootstrap

## `config/bootstrap.php`

This file is your site's extension point. It receives the kernel once per request and once per
console run, **before** `config/routes.php`, so route handlers can rely on everything registered
here:

```php
<?php

declare(strict_types=1);

use TinyTank\Kernel;

return static function (Kernel $app): void {
    // Services
    $app->container->set(Mailer::class, fn (Kernel $app) => new Mailer(getenv('MAILER_DSN')));

    // Twig
    $app->twig->addExtension(new App\Twig\AppExtension());
    $app->twig->addGlobal('support_email', 'help@example.com');

    // Deploy
    $app->addDeployStep('audio', 'app:build-audio', 'Encode the sound files');
};
```

The file is optional; delete it if your site doesn't need it.

## Services

`$app->container` is a minimal [PSR-11](https://www.php-fig.org/psr/psr-11/) container:

```php
// A factory: runs once, on first use, receives the kernel; the result is shared.
$app->container->set(Mailer::class, fn (Kernel $app) => new Mailer(getenv('MAILER_DSN')));

// A ready-made value.
$app->container->set('clock', new SystemClock());
```

Use services wherever you have the kernel:

```php
$this->get(Mailer::class)                    // in a controller
$this->app()->container->get(Mailer::class)  // in an AppCommand
$app->container->get('clock')                // anywhere else
$app->container->has('clock')                // check first
```

Asking for an unregistered service throws a `Psr\Container\NotFoundExceptionInterface`.

There's no autowiring and no configuration language: just names and factories. A closure is
always treated as a factory, so to store a closure itself, wrap it in a factory.

## Twig extensions

Anything Twig supports can be added in bootstrap: extensions, globals, functions, filters.

```php
use Twig\TwigFilter;

$app->twig->addFilter(new TwigFilter('initials', fn (string $name) => implode('', array_map(
    fn ($word) => mb_substr($word, 0, 1),
    explode(' ', $name),
))));
```

```php
// src/Twig/AppExtension.php
namespace App\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

final class AppExtension extends AbstractExtension
{
    public function getFunctions(): array
    {
        return [new TwigFunction('year', fn () => date('Y'))];
    }
}
```

## Other kernel parts

The kernel exposes TinyTank's own services, which you can use (but not replace) from bootstrap:
`$app->twig`, `$app->blog`, `$app->seo`, `$app->site`, `$app->router`, `$app->translations`,
`$app->vite`, `$app->datastar`. See the [PHP API reference](../reference/php).
