# sasaki-package-manager

A very very simple demo and guide for explaining package manager.

This repository was inspired by [g-plane/tiny-package-manager](https://github.com/g-plane/tiny-package-manager)

# details

[雰囲気でパッケージマネージャーを作ろう](https://zenn.dev/sa2knight/articles/d473ca2894b659)(Japanese article)

## install

```bash
$ npm install -g sasaki-package-manager
```

## Usage

```
$ sasaki-pm
Usage: sasaki-pm [options] [command]

Options:
  --production               install only dependencies (not devDependencies)
  --save-dev                 Package will appear in your devDependencies
  -h, --help                 display help for command

Commands:
  install [packageNames...]
  help [command]             display help for command
```