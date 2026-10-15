# Console commands

`bin/console` runs TinyTank's commands (`deploy`, `cache:clear`) plus **every command class in
`src/Command/`**, registered automatically.

## Writing a command

Extend `TinyTank\Console\AppCommand` to get the app through `$this->app()`:

```php
<?php

declare(strict_types=1);

namespace App\Command;

use TinyTank\Console\AppCommand;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand('app:posts', 'Lists the published posts.')]
final class PostsCommand extends AppCommand
{
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        foreach ($this->app()->posts() as $post) {
            $output->writeln("{$post['date']}  {$post['title']}");
        }

        return Command::SUCCESS;
    }
}
```

```sh
ddev console app:posts         # or: php bin/console app:posts
```

Commands use [Symfony Console](https://symfony.com/doc/current/console.html): arguments, options,
`SymfonyStyle` output and everything else work as documented there.

## How discovery works

- every concrete class in `src/Command/` (and its subfolders) that extends Symfony's `Command`
  is registered; abstract classes and other classes are skipped
- the class name must match the file (`src/Command/Audio/BuildCommand.php` →
  `App\Command\Audio\BuildCommand`)
- commands are created **without constructor arguments**. Need the app or a service? Extend
  `AppCommand` and use `$this->app()`. A command with required constructor arguments is reported as
  an error.

## The kernel is booted lazily

`$this->app()` boots the kernel the first time it's called, so `bin/console list` works even before
a site is configured. Plain Symfony commands in `src/Command/` work too, if they don't need the app.

`$this->root()` returns the project root.

## Running commands during deploy

A command can become a step of `bin/console deploy`; see [Deploy steps](./deploy-steps). It then
runs with the same production-mode kernel as the rest of the deploy.
