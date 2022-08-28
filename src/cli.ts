import { Command } from 'commander'
import { install } from './tinyPm.js'

const program = new Command()

program
  .command('install')
  .argument('[packageNames...]')
  .action(packageNames => {
    const options = program.opts()
    install(packageNames, {
      saveDev: !!options.saveDev,
      production: !!options.production
    })
  })

program
  .option('--production', 'devDependencies のインストールを省略する')
  .option('--save-dev', 'パッケージを devDependencies に追加する')
  .parse()
