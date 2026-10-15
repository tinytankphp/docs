# Writing a TinyTank package

A feature you want in several sites (an audio player component, a contact form, a newsletter
integration) can live in its own Composer package. There's no plugin system to learn: a package is
a normal library that a site turns on with one explicit line.

## The convention

The package has a class with a static `register()` method that receives the kernel:

```php
namespace Acme\AudioPlayer;

use TinyTank\Kernel;

final class AudioPlayer
{
    public static function register(Kernel $app): void
    {
        // Templates: content components and partials, overridable by the site.
        $app->addTemplates(dirname(__DIR__) . '/templates', 'acme-audio');

        // Anything else bootstrap.php can do:
        $app->twig->addExtension(new AudioPlayerExtension());
        $app->container->set(Playlists::class, fn () => new Playlists());
        $app->addDeployStep('audio', fn (Kernel $app, $io) => Playlists::build($app, $io), 'Encode the playlists', before: 'opcache');
    }
}
```

The site installs it and calls it from `config/bootstrap.php`:

```sh
composer require acme/tinytank-audio-player
```

```php
// config/bootstrap.php
return static function (Kernel $app): void {
    Acme\AudioPlayer\AudioPlayer::register($app);
};
```

Nothing is discovered automatically: a site's `bootstrap.php` lists everything it uses.

## Templates

`$app->addTemplates($dir, $namespace)` adds the package's templates after the site's and before the
framework's. With `templates/_components/audio-player.twig` in the package, posts can use
`::audio-player{…}` (see [Content components](../content/components)), and a site restyles it by
creating its own `templates/_components/audio-player.twig`, which can extend the original:

```twig
{% extends '@acme-audio/_components/audio-player.twig' %}
```

The package's templates use Tailwind classes the site must generate: tell the site to add the
package's folder to `resources/css/app.css`:

```css
@source "../../vendor/acme/tinytank-audio-player/templates";
```

## Console commands and deploy steps

The console discovers commands in the site's own `src/Command/` only. A package ships its command
class, setting its name in `configure()` (`$this->setName('acme:build-audio')`) rather than with
`#[AsCommand]`, because PHP attributes aren't inherited. The site then enables it with an empty
subclass:

```php
// src/Command/BuildAudioCommand.php
namespace App\Command;

final class BuildAudioCommand extends \Acme\AudioPlayer\BuildAudioCommand
{
}
```

A deploy step from `register()` should be a closure (`addDeployStep('audio', fn (Kernel $app, $io) => …)`),
so it works whether or not the site enabled the command.

## A CDN

A package can add a CDN to purge with a class implementing `TinyTank\Cdn\Purger`, given in
`register()` with `$app->cdn->usePurger(…)`. See [CDN caching](../deployment/cdn#another-cdn-as-a-package).

## Dependencies

Require `tinytank/framework` with the same constraint as sites (`^0.1@dev`) and keep the package's
own dependencies small: every site that installs it pulls them in.
